/**
 * 戦闘ティックフェーズ
 *
 * 1ターンの戦闘処理を環境/プレイヤー/仲間/再生/敵の各フェーズに分割。
 */
import type { RunState, Enemy, TickResult, TickEvent } from '../../types';
import type { SynergyBonusResult } from '../evolution/synergy-service';
import { ENV_DMG, BOSS_HIT_CAP } from '../../constants';
import { calcEnvDmg, calcPlayerAtk, aliveAllies, RIT_LOW_HP_RATIO } from './combat-calculator';
import { calcSynergies, applySynergyBonuses } from '../evolution/synergy-service';
import { keystonePlayerAtkMods, onKeystoneKill, keystoneReflectDmg, isKeystoneFreezeTurn, keystoneLethalGuard } from '../keystone/keystone-service';
import { tickBuffs } from '../skill/skill-service';
import { deepCloneRun } from '../shared/utils';
import { requireValidPlayer } from '../../contracts/player-contracts';
import { ensureTickResult } from '../../contracts/tick-postconditions';

/* ===== 定数 ===== */

/** ログ配列の最大保持数 */
const LOG_MAX = 60;
/** ログ配列のトリム後保持数 */
const LOG_TRIM = 35;


/* ===== フェーズ関数 ===== */

/** 環境ダメージフェーズ */
export function tickEnvPhase(next: RunState, events: TickEvent[]): void {
  const envCfg = ENV_DMG[next.cBT as string];
  if (envCfg) {
    const envD = calcEnvDmg(next.cBT, next.dd.env, next.tb, next.fe);
    if (envD > 0) {
      next.hp -= envD;
      next.log.push({ x: envCfg.icon + ' -' + envD, c: envCfg.c });
      events.push({ type: 'sfx', sfx: 'envDmg' });
    }
  }
}

/** プレイヤー攻撃フェーズ */
export function tickPlayerPhase(next: RunState, e: Enemy, events: TickEvent[], rng: () => number, sb: SynergyBonusResult): void {
  // buffAtk バフ適用
  const atkBuff = next.sk.bfs.find(b => b.fx.t === 'buffAtk');
  const prevAM = next.aM;
  if (atkBuff && atkBuff.fx.t === 'buffAtk') next.aM *= atkBuff.fx.aM;

  // シナジー＋キーストーンの ATK ボーナスを一時適用
  const prevAtk = next.atk;
  const prevCr = next.cr;
  const ksMods = keystonePlayerAtkMods(next);
  next.atk = Math.floor((next.atk + sb.atkBonus + ksMods.flatAdd) * ksMods.mult);
  next.cr = Math.min(next.cr + sb.crBonus / 100, 1);

  const pa = calcPlayerAtk(next, rng);

  // 一時ボーナスを復元
  next.atk = prevAtk;
  next.cr = prevCr;
  next.aM = prevAM;

  const dm = Math.max(1, pa.dmg - e.def);
  if (dm > next.maxHit) next.maxHit = dm;

  if (next.fe === 'rit' && next.hp < next.mhp * RIT_LOW_HP_RATIO && next.wTurn === 1) {
    next.log.push({ x: '  ⚡ 血の力が覚醒！ATK×2', c: 'rc' });
  }

  e.hp -= dm;
  next.dmgDealt += dm;
  next.log.push({
    x: '⚔ → ' + e.n + ' ' + dm + (pa.crit ? ' 💥会心' : '') + (dm === 1 ? ' ⚠DEF硬い' : ''),
    c: pa.crit ? 'gc' : dm === 1 ? 'xc' : '',
  });
  events.push({ type: 'sfx', sfx: pa.crit ? 'crit' : 'hit' });
  events.push({ type: 'popup', v: dm, crit: pa.crit, heal: false, tgt: 'en' });

  if (next.burn) {
    // burnDmgMul が未設定の場合は 1 として既存挙動を維持。chain_blaze スタックで倍率を追加積算
    const bd = Math.floor(pa.dmg * 0.2 * sb.burnMul * (next.burnDmgMul ?? 1) * (1 + (next.ksStacks?.chain_blaze ?? 0)));
    e.hp -= bd;
    next.dmgDealt += bd;
    next.log.push({ x: '  🔥 火傷 ' + bd, c: 'tc' });
  }
}

/** 仲間攻撃フェーズ */
export function tickAllyPhase(next: RunState, e: Enemy, events: TickEvent[], sb: SynergyBonusResult): void {
  next.al.forEach(a => {
    if (!a.a) return;
    if (a.h) {
      const h = Math.floor(a.atk * 2.5);
      next.hp = Math.min(next.hp + h, next.mhp);
      next.log.push({ x: '  💚 ' + a.n + ' +' + h, c: 'lc' });
      events.push({ type: 'popup', v: h, crit: false, heal: true, tgt: 'pl' });
    } else {
      const ad = Math.max(1, (a.atk + sb.allyAtkBonus) - e.def);
      e.hp -= ad;
      next.dmgDealt += ad;
      next.log.push({ x: '  ' + a.n + ' → ' + ad, c: '' });
    }
  });
}

/** 再生フェーズ */
export function tickRegenPhase(next: RunState, events: TickEvent[], sb: SynergyBonusResult): void {
  if (next.noHealing) return;
  if (next.tb.rg > 0) {
    const rg = Math.max(1, Math.floor(next.mhp * next.tb.rg * (1 + sb.healBonusRatio)));
    const actualHeal = Math.min(rg, next.mhp - next.hp);
    next.hp = Math.min(next.hp + rg, next.mhp);
    next.totalHealing += actualHeal;
    next.log.push({ x: '  🌿 再生 +' + rg, c: 'lc' });
    events.push({ type: 'popup', v: rg, crit: false, heal: true, tgt: 'pl' });
  }
}

/** 敵攻撃フェーズ */
export function tickEnemyPhase(next: RunState, e: Enemy, events: TickEvent[], rng: () => number, sb: SynergyBonusResult): void {
  // 永久凍結: 周期的に敵の攻撃を無効化する
  if (isKeystoneFreezeTurn(next)) {
    next.log.push({ x: '  🧊 永久凍結！敵の攻撃を無効化', c: 'lc' });
    events.push({ type: 'sfx', sfx: 'envDmg' });
    return;
  }
  let ed = Math.max(1, e.atk - (next.def + sb.defBonus));
  // shield バフ適用
  const shieldBuff = next.sk.bfs.find(b => b.fx.t === 'shield');
  if (shieldBuff && shieldBuff.fx.t === 'shield') ed = Math.max(1, Math.floor(ed * (1 - shieldBuff.fx.dR)));
  const tk = next.al.find(a => a.a && a.tk);
  if (tk) {
    const td = Math.max(1, Math.floor(ed * 0.6));
    tk.hp -= td;
    ed = Math.floor(ed * 0.4);
    if (tk.hp <= 0) {
      tk.a = 0;
      next.log.push({ x: '☠ ' + tk.n + ' 倒れた', c: 'xc' });
    }
  }
  next.hp -= ed;
  next.dmgTaken += ed;
  next.log.push({ x: '🩸 ' + e.n + ' → ' + ed, c: 'xc' });
  // 棘の守護: 被ダメージの一部を敵へ反射
  const reflect = keystoneReflectDmg(next, ed);
  if (reflect > 0) {
    e.hp -= reflect;
    next.dmgDealt += reflect;
    next.log.push({ x: '  🛡️ 反射 ' + reflect, c: 'gc' });
  }
  events.push({ type: 'sfx', sfx: 'plDmg' });
  events.push({ type: 'popup', v: ed, crit: false, heal: false, tgt: 'pl' });

  if (rng() < 0.25) {
    const la = aliveAllies(next.al).filter(a => !a.tk);
    if (la.length) {
      const t2 = la[rng() * la.length | 0];
      const ad2 = Math.max(1, Math.floor(e.atk * 0.4));
      t2.hp -= ad2;
      next.log.push({ x: '  💥 ' + t2.n + ' -' + ad2, c: 'xc' });
      if (t2.hp <= 0) {
        t2.a = 0;
        next.log.push({ x: '☠ ' + t2.n + ' 倒れた', c: 'xc' });
      }
    }
  }
}

/** 死亡判定（復活の儀チェック含む）。死亡した場合trueを返す */
export function tickDeathCheck(next: RunState, events: TickEvent[]): boolean {
  if (next.hp <= 0) {
    // 不滅の祈り: 戦闘ごと1回、致死をHP1で耐える
    if (keystoneLethalGuard(next)) {
      next.log.push({ x: '  ♻️ 不滅の祈り！HP1で生存', c: 'gc' });
      events.push({ type: 'sfx', sfx: 'heal' });
      return false;
    }
    if (next.tb.rv && !next.rvU) {
      next.rvU = 1;
      next.hp = Math.floor(next.mhp * Math.max(0.3, 0.3 + (next.tb.rP || 0)));
      next.log.push({ x: '✨ 復活の儀！', c: 'gc' });
      events.push({ type: 'sfx', sfx: 'heal' });
      return false;
    } else {
      next.hp = 0;
      next.log.push({ x: '部族は滅びた…', c: 'xc' });
      events.push({ type: 'sfx', sfx: 'death' });
      events.push({ type: 'player_dead' });
      return true;
    }
  }
  return false;
}

/* ===== メインティック ===== */

/** 敵撃破を確定し TickResult を返す（破壊的。通常キルと反射killの両方から呼ぶ） */
function resolveEnemyDefeat(next: RunState, e: Enemy, events: TickEvent[], finalMode: boolean): TickResult {
  e.hp = 0;
  next.bE += e.bone;
  next.kills++;
  // キーストーンのキル時フック（狩人の蓄積・連鎖の業火のスタック更新）
  onKeystoneKill(next);
  next.log.push({ x: '━━━ 💀 ' + e.n + ' 撃破！ 🦴+' + e.bone + ' ━━━', c: 'gc' });
  events.push({ type: 'sfx', sfx: 'kill' });
  events.push({ type: 'shake_enemy' });
  events.push(finalMode ? { type: 'final_boss_killed' } : { type: 'enemy_killed' });
  // 保険: 将来のリグレッションでも事後条件違反を起こさないよう負HPを0に丸める
  if (next.hp < 0) next.hp = 0;
  const result = { nextRun: next, events };
  if (process.env.NODE_ENV !== 'production') ensureTickResult(result);
  return result;
}

/** 1ターン分の戦闘処理 */
export function tick(r: RunState, finalMode: boolean, rng = Math.random): TickResult {
  if (process.env.NODE_ENV !== 'production') {
    requireValidPlayer(r);
  }
  const next = deepCloneRun(r);
  if (!next.en) return { nextRun: next, events: [] };

  const e = next.en!;
  const events: TickEvent[] = [];
  next.turn++;
  next.wTurn++;
  const pHP = next.hp;
  // ボスの被ダメージ上限算出用に、ターン開始時の敵HPを記録する
  const eHP0 = e.hp;

  // シナジーボーナス計算
  const synergies = calcSynergies(next.evs);
  const sb = applySynergyBonuses(synergies);

  tickEnvPhase(next, events);
  // 環境ダメージが致死量の場合はここで死亡（または復活/不滅）を確定し、
  // 負HPのまま敵撃破経路へ抜けるのを防ぐ
  if (tickDeathCheck(next, events)) {
    return { nextRun: next, events };
  }
  tickPlayerPhase(next, e, events, rng, sb);
  tickAllyPhase(next, e, events, sb);
  tickRegenPhase(next, events, sb);

  // ボス: 1ターンの被ダメージを最大HPの BOSS_HIT_CAP までに制限し、装甲を削り切る(ブレイク)まで
  // 本体HPを削れない。装甲があるうちはボスが生存して反撃し続けるため、危険な長期戦になる。
  if (e.boss) {
    const dealt = eHP0 - e.hp;
    if (dealt > 0) {
      let remain = Math.min(dealt, Math.floor(e.mhp * BOSS_HIT_CAP)); // per-turn 上限
      e.hp = eHP0; // いったん戻し、装甲→本体の順で再適用する
      if (e.armor && e.armor > 0) {
        const absorbed = Math.min(e.armor, remain);
        e.armor -= absorbed;
        remain -= absorbed;
        if (e.armor === 0) {
          next.log.push({ x: '  💥 ' + e.n + ' の装甲をブレイク！', c: 'gc' });
        }
      }
      e.hp = eHP0 - remain; // 装甲ブレイク後の余剰のみ本体へ（per-turn 上限内）
    }
  }

  // 敵撃破判定（プレイヤー/仲間/再生フェーズ後）
  if (e.hp <= 0) {
    return resolveEnemyDefeat(next, e, events, finalMode);
  }

  tickEnemyPhase(next, e, events, rng, sb);

  if (tickDeathCheck(next, events)) {
    // 死亡時は hp=0 に正規化済み
    return { nextRun: next, events };
  }

  // 棘の守護などの反射で敵が倒れた場合、同一tick内で撃破を確定する（プレイヤー生存が前提）
  if (e.hp <= 0) {
    return resolveEnemyDefeat(next, e, events, finalMode);
  }

  // ログトリム
  if (next.log.length > LOG_MAX) next.log = next.log.slice(-LOG_TRIM);

  // ビジュアルエフェクト
  events.push({ type: 'shake_enemy' });
  if (next.hp < pHP) events.push({ type: 'flash_player_dmg' });
  if (next.hp > pHP) events.push({ type: 'flash_player_heal' });

  // バフターンデクリメント
  next.sk = tickBuffs(next.sk);

  const result = { nextRun: next, events };
  if (process.env.NODE_ENV !== 'production') ensureTickResult(result);
  return result;
}
