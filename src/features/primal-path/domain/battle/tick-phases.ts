/**
 * 戦闘ティックフェーズ
 *
 * 1ターンの戦闘処理を環境/プレイヤー/仲間/再生/敵の各フェーズに分割。
 */
import type { RunState, Enemy, TickResult, TickEvent } from '../../types';
import type { SynergyBonusResult } from '../evolution/synergy-service';
import { ENV_DMG } from '../../constants';
import { calcEnvDmg, calcPlayerAtk, aliveAllies, effATK, biomeBonus, RIT_LOW_HP_RATIO } from './combat-calculator';
import { calcSynergies, applySynergyBonuses } from '../evolution/synergy-service';
import { tickBuffs } from '../skill/skill-service';
import { deepCloneRun } from '../shared/utils';
import { civLvs } from '../shared/civ-utils';

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

  // シナジーATK/CRボーナスを一時適用
  const prevAtk = next.atk;
  const prevCr = next.cr;
  next.atk += sb.atkBonus;
  next.cr = Math.min(next.cr + sb.crBonus / 100, 1);

  const pa = calcPlayerAtk(next, rng);

  // 一時ボーナスを復元
  next.atk = prevAtk;
  next.cr = prevCr;
  next.aM = prevAM;

  const dm = Math.max(1, pa.dmg - e.def);
  if (dm > next.maxHit) next.maxHit = dm;

  if (next.fe === 'rit' && next.hp < next.mhp * RIT_LOW_HP_RATIO && next.wTurn === 1) {
    next.log.push({ x: '  ⚡ 血の力が覚醒！ATK×3', c: 'rc' });
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
    const bd = Math.floor(pa.dmg * 0.2 * sb.burnMul);
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

/** 1ターン分の戦闘処理 */
export function tick(r: RunState, finalMode: boolean, rng = Math.random): TickResult {
  const next = deepCloneRun(r);
  if (!next.en) return { nextRun: next, events: [] };

  const e = next.en!;
  const events: TickEvent[] = [];
  next.turn++;
  next.wTurn++;
  const pHP = next.hp;

  // シナジーボーナス計算
  const synergies = calcSynergies(next.evs);
  const sb = applySynergyBonuses(synergies);

  tickEnvPhase(next, events);
  tickPlayerPhase(next, e, events, rng, sb);
  tickAllyPhase(next, e, events, sb);
  tickRegenPhase(next, events, sb);

  // 敵撃破判定
  if (e.hp <= 0) {
    e.hp = 0;
    next.bE += e.bone;
    next.kills++;
    next.log.push({ x: '━━━ 💀 ' + e.n + ' 撃破！ 🦴+' + e.bone + ' ━━━', c: 'gc' });
    events.push({ type: 'sfx', sfx: 'kill' });
    events.push({ type: 'shake_enemy' });
    if (finalMode) {
      events.push({ type: 'final_boss_killed' });
    } else {
      events.push({ type: 'enemy_killed' });
    }
    return { nextRun: next, events };
  }

  tickEnemyPhase(next, e, events, rng, sb);

  if (tickDeathCheck(next, events)) {
    return { nextRun: next, events };
  }

  // ログトリム
  if (next.log.length > LOG_MAX) next.log = next.log.slice(-LOG_TRIM);

  // ビジュアルエフェクト
  events.push({ type: 'shake_enemy' });
  if (next.hp < pHP) events.push({ type: 'flash_player_dmg' });
  if (next.hp > pHP) events.push({ type: 'flash_player_heal' });

  // バフターンデクリメント
  next.sk = tickBuffs(next.sk);

  return { nextRun: next, events };
}
