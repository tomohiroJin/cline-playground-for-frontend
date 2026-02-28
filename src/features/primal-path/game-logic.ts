/**
 * 原始進化録 - PRIMAL PATH - 純粋ゲームロジック
 *
 * すべて純粋関数: 引数 → 返値、副作用なし。
 */
import type {
  StatSnapshot, EvoEffect, RunState, Enemy, Ally, Evolution,
  TreeBonus, CivLevels, PlayerAttackResult, TickResult, TickEvent,
  ApplyEvoResult, AwakeningRule, AwakeningNext, AwokenRecord,
  SaveData, Difficulty, BiomeId, BiomeIdExt, CivType, CivTypeExt,
  AllyTemplate, LogEntry, DmgPopup, ASkillId, ASkillDef, SkillSt, ABuff,
  SynergyTag, ActiveSynergy, SynergyEffect,
  EventChoice, EventCost, EventEffect, RandomEventDef,
} from './types';
import {
  CIV_TYPES, CIV_KEYS, TREE, TB_DEFAULTS, EVOS, ALT, ENM, BOSS,
  DIFFS, BIOME_AFFINITY, ENV_DMG, AWK_SA, AWK_FA, TN, TC,
  WAVES_PER_BIOME, A_SKILLS, SYNERGY_BONUSES,
  RANDOM_EVENTS, EVENT_CHANCE, EVENT_MIN_BATTLES,
} from './constants';

/* ===== Utility ===== */

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/* ===== Damage Popup ===== */

const POPUP_LIFETIME = 8;
const MAX_POPUPS = 5;
const POPUP_DY = 3;

/** ポップアップ生成（純粋関数） */
export function mkPopup(v: number, crit: boolean, heal: boolean): DmgPopup {
  const cl = heal ? '#50ff90' : crit ? '#ff3030' : '#ffffff';
  const fs = heal ? 16 : crit ? 24 : 15;
  return { v, x: 0.5, y: 0, cl, fs, a: 1, lt: POPUP_LIFETIME };
}

/** ポップアップ毎tick更新（純粋関数） */
export function updatePopups(popups: DmgPopup[]): DmgPopup[] {
  return popups
    .map(p => ({ ...p, y: p.y - POPUP_DY, lt: p.lt - 1, a: Math.max(0, (p.lt - 1) / POPUP_LIFETIME) }))
    .filter(p => p.lt > 0)
    .slice(-MAX_POPUPS);
}

function deepCloneRun(r: RunState): RunState {
  return {
    ...r,
    al: r.al.map(a => ({ ...a })),
    log: [...r.log],
    awoken: [...r.awoken],
    en: r.en ? { ...r.en } : null,
    bms: [...r.bms],
    dd: { ...r.dd },
    tb: { ...r.tb },
    sk: { avl: [...r.sk.avl], cds: { ...r.sk.cds }, bfs: r.sk.bfs.map(b => ({ ...b, fx: { ...b.fx } })) },
    evs: [...r.evs],
  };
}

/* ===== Stat Snapshot ===== */

const SNAP_KEYS: (keyof StatSnapshot)[] = ['atk', 'mhp', 'hp', 'def', 'cr', 'aM', 'burn', 'bb'];

export function getSnap(r: RunState): StatSnapshot {
  const s = {} as StatSnapshot;
  SNAP_KEYS.forEach(k => { (s as unknown as Record<string, number>)[k] = (r as unknown as Record<string, number>)[k]; });
  return s;
}

export function applyStatFx(st: StatSnapshot, fx: EvoEffect): StatSnapshot {
  const s = { ...st };
  if (fx.atk) s.atk += fx.atk;
  if (fx.def) s.def += fx.def;
  if (fx.cr) s.cr = Math.min(s.cr + fx.cr, 1);
  if (fx.mhp) { s.mhp += fx.mhp; s.hp = Math.min(s.hp + fx.mhp, s.mhp); }
  if (fx.heal) s.hp = Math.min(s.hp + fx.heal, s.mhp);
  if (fx.full) s.hp = s.mhp;
  if (fx.sd) s.hp = Math.max(1, s.hp - fx.sd);
  if (fx.burn) s.burn = 1;
  if (fx.half) { s.mhp = Math.floor(s.mhp / 2); s.hp = Math.min(s.hp, s.mhp); }
  if (fx.aM) s.aM *= fx.aM;
  if (fx.bb) s.bb += fx.bb;
  return s;
}

function writeSnapToRun(r: RunState, s: StatSnapshot): void {
  SNAP_KEYS.forEach(k => { (r as unknown as Record<string, number>)[k] = (s as unknown as Record<string, number>)[k]; });
}

/* ===== Civilization ===== */

export function civLvs(r: RunState): CivLevels {
  return { tech: r.cT, life: r.cL, rit: r.cR };
}

export function civMin(r: RunState): number {
  return Math.min(r.cT, r.cL, r.cR);
}

export function civLv(r: RunState, t: CivType): number {
  return r[CIV_KEYS[t]];
}

/* ===== Effective ATK ===== */

export function effATK(r: RunState): number {
  return Math.floor(r.atk * r.aM * r.dm);
}

/* ===== Ally helpers ===== */

export function aliveAllies(al: Ally[]): Ally[] {
  return al.filter(a => a.a);
}

export function deadAllies(al: Ally[]): Ally[] {
  return al.filter(a => !a.a);
}

/* ===== Biome ===== */

export function biomeBonus(biome: BiomeIdExt, lvs: CivLevels): number {
  if (biome === 'final') return 1;
  const b = BIOME_AFFINITY[biome as BiomeId];
  return b && b.check(lvs) ? b.m : 1;
}

/* ===== Environment Damage ===== */

export function calcEnvDmg(biome: BiomeIdExt, envScale: number, tb: TreeBonus, fe: CivTypeExt | null): number {
  const cfg = ENV_DMG[biome as string];
  if (!cfg) return 0;
  let d = Math.floor(cfg.base * envScale);
  d = Math.max(0, Math.floor(d * (1 - (tb[cfg.resist] || 0))));
  if (cfg.immune && fe === cfg.immune) d = 0;
  return d;
}

/* ===== Tree Bonus ===== */

export function getTB(tree: Record<string, number>): TreeBonus {
  const b: TreeBonus = { ...TB_DEFAULTS };
  for (const id in tree) {
    if (!tree[id]) continue;
    const nd = TREE.find(x => x.id === id);
    if (nd) {
      for (const k in nd.e) {
        (b as unknown as Record<string, number>)[k] = ((b as unknown as Record<string, number>)[k] || 0) + (nd.e as unknown as Record<string, number>)[k];
      }
    }
  }
  return b;
}

/* ===== Enemy Scaling ===== */

export function scaleEnemy(src: { n: string; hp: number; atk: number; def: number; bone: number }, hm: number, am: number, scale = 1): Enemy {
  return {
    n: src.n,
    hp: Math.floor(src.hp * hm * scale),
    mhp: Math.floor(src.hp * hm * scale),
    atk: Math.floor(src.atk * am * scale),
    def: src.def,
    bone: src.bone,
  };
}

/* ===== Simulate Evolution (preview) ===== */

export function simEvo(r: RunState, ev: Evolution): { atk: number; hp: number; mhp: number; def: number; cr: number } {
  const s = applyStatFx(getSnap(r), ev.e);
  return { atk: Math.floor(s.atk * s.aM * r.dm), hp: s.hp, mhp: s.mhp, def: s.def, cr: s.cr };
}

/* ===== Roll Evolutions ===== */

export function rollE(r: RunState, rng = Math.random): Evolution[] {
  const rr = 0.12 + r.tb.rr;
  const n = r.evoN;
  const p: Evolution[] = [];
  const used: Record<string, boolean> = {};
  const hasDead = deadAllies(r.al).length > 0;

  CIV_TYPES.forEach(t => {
    const pool = EVOS.filter(e => e.t === t && !used[e.n] && (rng() < rr || !e.r) && (!e.e.revA || hasDead));
    if (pool.length) {
      const pick = pool[rng() * pool.length | 0];
      p.push(pick);
      used[pick.n] = true;
    }
  });

  while (p.length < n) {
    const pool = EVOS.filter(e => !used[e.n] && (rng() < rr || !e.r) && (!e.e.revA || hasDead));
    if (!pool.length) break;
    const pick = pool[rng() * pool.length | 0];
    p.push(pick);
    used[pick.n] = true;
  }

  if (p.length < n) {
    const fallback = EVOS.filter(e => !used[e.n] && (!e.e.revA || hasDead));
    const fb = [...fallback];
    while (p.length < n && fb.length) {
      const idx = rng() * fb.length | 0;
      const pick = fb.splice(idx, 1)[0];
      p.push(pick);
      used[pick.n] = true;
    }
  }

  return p.slice(0, n);
}

/* ===== Apply Evolution ===== */

export function applyEvo(r: RunState, ev: Evolution, rng = Math.random): ApplyEvoResult {
  const next = deepCloneRun(r);
  next.evs.push(ev);
  writeSnapToRun(next, applyStatFx(getSnap(next), ev.e));

  if (ev.e.aHL) {
    next.al.forEach(a => { if (a.a) a.hp = Math.min(a.hp + (ev.e.aHL || 0), a.mhp); });
  }

  let allyRevived: string | null = null;
  if (ev.e.revA) {
    const dead = deadAllies(next.al);
    if (dead.length) {
      const target = dead[0];
      target.a = 1;
      target.hp = Math.floor(target.mhp * ((ev.e.revA || 0) / 100));
      allyRevived = target.n;
    }
  }

  // Increment civ level
  const key = CIV_KEYS[ev.t];
  (next as unknown as Record<string, number>)[key]++;

  // Check ally recruitment (at civ levels 2, 4, 6)
  const cc = civLv(next, ev.t);
  let allyJoined: AllyTemplate | null = null;
  if (next.al.length < next.mxA && (cc === 2 || cc === 4 || cc === 6)) {
    const ts = ALT[ev.t];
    const tpl = ts[rng() * ts.length | 0];
    const hm = 1 + next.tb.aH;
    const am = 1 + next.tb.aA;
    next.al.push({
      n: tpl.n, hp: Math.floor(tpl.hp * hm), mhp: Math.floor(tpl.hp * hm),
      atk: Math.floor(tpl.atk * am), t: ev.t, a: 1, h: tpl.h, tk: tpl.tk,
    });
    allyJoined = tpl;
  }

  return { nextRun: next, allyJoined, allyRevived };
}

/* ===== Apply Awakening Effects ===== */

export function applyAwkFx(r: RunState, fx: EvoEffect, id: string, nm: string, cl: string, fe: CivTypeExt | null): RunState {
  const next = deepCloneRun(r);
  writeSnapToRun(next, applyStatFx(getSnap(next), fx));
  if ((fx as Record<string, unknown>).allyAtkMul) {
    next.al.forEach(a => { if (a.a) a.atk *= (fx as Record<string, number>).allyAtkMul; });
  }
  if ((fx as Record<string, unknown>).allyFullHeal) {
    next.al.forEach(a => { if (a.a) a.hp = a.mhp; });
  }
  if (fe !== undefined) next.fe = fe;
  next.awoken.push({ id, nm, cl });
  return next;
}

/* ===== Awakening Check ===== */

export function checkAwakeningRules(r: RunState): AwakeningRule | null {
  const done = r.awoken.map(a => a.id);
  const lvs = civLvs(r);
  const mn = civMin(r);

  const rules: AwakeningRule[] = [
    { id: 'sa_bal', t: 'bal', tier: 1, ok: mn >= 3 },
  ];
  CIV_TYPES.forEach(t => {
    rules.push({ id: 'sa_' + t, t, tier: 1, ok: lvs[t] >= r.saReq });
  });
  rules.push({ id: 'fa_bal', t: 'bal', tier: 2, ok: mn >= 4 && done.indexOf('sa_bal') >= 0 });
  CIV_TYPES.forEach(t => {
    rules.push({ id: 'fa_' + t, t, tier: 2, ok: lvs[t] >= r.fReq });
  });

  return rules.find(r2 => r2.ok && done.indexOf(r2.id) < 0) || null;
}

export function awkInfo(r: RunState): AwakeningNext[] {
  const done = r.awoken.map(a => a.id);
  const lvs = civLvs(r);
  const mn = civMin(r);
  const nxt: AwakeningNext[] = [];

  if (mn < 3 && done.indexOf('sa_bal') < 0) {
    nxt.push({ nm: '調和・小', need: '全Lv3(残' + Math.max(0, 3 - mn) + ')', cl: '#e0c060' });
  }
  CIV_TYPES.forEach(t => {
    const sid = 'sa_' + t;
    if (lvs[t] < r.saReq && done.indexOf(sid) < 0) {
      nxt.push({ nm: TN[t] + '・小', need: TN[t] + 'Lv' + r.saReq + '(残' + Math.max(0, r.saReq - lvs[t]) + ')', cl: TC[t] });
    }
  });
  if (mn >= 3 && done.indexOf('sa_bal') >= 0 && mn < 4 && done.indexOf('fa_bal') < 0) {
    nxt.push({ nm: '調和・大', need: '全Lv4(残' + Math.max(0, 4 - mn) + ')', cl: '#e0c060' });
  }
  CIV_TYPES.forEach(t => {
    const fid = 'fa_' + t;
    if (lvs[t] < r.fReq && done.indexOf(fid) < 0) {
      nxt.push({ nm: TN[t] + '・大', need: TN[t] + 'Lv' + r.fReq + '(残' + Math.max(0, r.fReq - lvs[t]) + ')', cl: TC[t] });
    }
  });

  return nxt.slice(0, 3);
}

/* ===== Player Attack ===== */

export function calcPlayerAtk(r: RunState, rng = Math.random): PlayerAttackResult {
  let pa = Math.floor(r.atk * r.aM * r.dm);
  if (r.fe === 'rit' && r.hp < r.mhp * 0.3) pa *= 3;
  const crit = rng() < r.cr;
  if (crit) pa = Math.floor(pa * 1.6);
  return { dmg: Math.floor(pa * biomeBonus(r.cBT, civLvs(r))), crit };
}

/* ===== Battle Tick — Sub-functions ===== */

function tickEnvPhase(next: RunState): void {
  const envCfg = ENV_DMG[next.cBT as string];
  if (envCfg) {
    const envD = calcEnvDmg(next.cBT, next.dd.env, next.tb, next.fe);
    if (envD > 0) {
      next.hp -= envD;
      next.log.push({ x: envCfg.icon + ' -' + envD, c: envCfg.c });
    }
  }
}

function tickPlayerPhase(next: RunState, e: Enemy, events: TickEvent[], rng: () => number, sb: SynergyBonusResult): void {
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

  if (next.fe === 'rit' && next.hp < next.mhp * 0.3 && next.wTurn === 1) {
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

function tickAllyPhase(next: RunState, e: Enemy, events: TickEvent[], sb: SynergyBonusResult): void {
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

function tickRegenPhase(next: RunState, events: TickEvent[], sb: SynergyBonusResult): void {
  if (next.tb.rg > 0) {
    const rg = Math.max(1, Math.floor(next.mhp * next.tb.rg * (1 + sb.healBonusRatio)));
    next.hp = Math.min(next.hp + rg, next.mhp);
    next.log.push({ x: '  🌿 再生 +' + rg, c: 'lc' });
    events.push({ type: 'popup', v: rg, crit: false, heal: true, tgt: 'pl' });
  }
}

function tickEnemyPhase(next: RunState, e: Enemy, events: TickEvent[], rng: () => number, sb: SynergyBonusResult): void {
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

/** @returns true if player died */
function tickDeathCheck(next: RunState, events: TickEvent[]): boolean {
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

/* ===== Battle Tick ===== */

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

  tickEnvPhase(next);
  tickPlayerPhase(next, e, events, rng, sb);
  tickAllyPhase(next, e, events, sb);
  tickRegenPhase(next, events, sb);

  // Enemy killed
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

  // Trim log
  if (next.log.length > 60) next.log = next.log.slice(-35);

  // Visual effects
  events.push({ type: 'shake_enemy' });
  if (next.hp < pHP) events.push({ type: 'flash_player_dmg' });
  if (next.hp > pHP) events.push({ type: 'flash_player_heal' });

  // バフターンデクリメント
  next.sk = tickBuffs(next.sk);

  return { nextRun: next, events };
}

/* ===== Start Run ===== */

export function startRunState(di: number, save: SaveData): RunState {
  const d = DIFFS[di];
  const tb = getTB(save.tree);
  const bms = (['grassland', 'glacier', 'volcano'] as BiomeId[]).sort(() => Math.random() - 0.5);

  return {
    hp: 80 + tb.bH, mhp: 80 + tb.bH, atk: 8 + tb.bA, def: 2 + tb.bD,
    cr: Math.min(0.05 + tb.cr, 1), burn: 0, aM: 1, dm: 1 + tb.dM,
    cT: tb.sC, cL: tb.sC, cR: tb.sC,
    al: [], bms,
    cB: 0, cBT: bms[0], cW: 0, wpb: WAVES_PER_BIOME, bE: 0, bb: 0,
    di, dd: d, fe: null, tb,
    mxA: 3 + tb.aS, evoN: 3 + tb.eN,
    fReq: 5 + tb.fQ, saReq: 4 + tb.aQ,
    rvU: 0, bc: 0, log: [], turn: 0, kills: 0,
    dmgDealt: 0, dmgTaken: 0, maxHit: 0, wDmg: 0, wTurn: 0,
    awoken: [],
    en: null,
    sk: { avl: [], cds: {}, bfs: [] },
    evs: [],
    btlCount: 0, eventCount: 0,
    _wDmgBase: 0, _fbk: '', _fPhase: 0,
  };
}

/* ===== Start Battle ===== */

export function startBattle(r: RunState, finalMode: boolean): RunState {
  const next = deepCloneRun(r);
  next.cW++;
  const boss = next.cW > next.wpb;

  const biome = next.cBT as BiomeId;
  const src = boss
    ? BOSS[biome]
    : ENM[biome][Math.min(next.cW - 1, ENM[biome].length - 1)];

  const biomeScale = 0.75 + next.cB * 0.25;
  next.en = scaleEnemy(src, next.dd.hm, next.dd.am, biomeScale + next.bc * 0.25);
  next.log = [];
  next.wDmg = 0;
  next.wTurn = 0;
  next._wDmgBase = next.dmgDealt;

  return next;
}

/* ===== After Battle (enemy killed, non-final) ===== */

export function afterBattle(r: RunState): { nextRun: RunState; biomeCleared: boolean } {
  const next = deepCloneRun(r);
  const boss = next.cW > next.wpb;

  // バトルカウントインクリメント
  next.btlCount++;

  // スキルクールダウンデクリメント
  next.sk = decSkillCds(next.sk);

  if (boss) {
    next.bc++;
    const rec = Math.floor(next.mhp * 0.2);
    next.hp = Math.min(next.hp + rec, next.mhp);
    next.cW = 0;
    return { nextRun: next, biomeCleared: true };
  }
  return { nextRun: next, biomeCleared: false };
}

/* ===== Final Boss ===== */

export function resolveFinalBossKey(r: RunState): string {
  const map: Record<string, string> = { tech: 'ft', life: 'fl', rit: 'fr' };
  if (r.fe && map[r.fe]) return map[r.fe];
  return r.cT >= r.cL && r.cT >= r.cR ? 'ft' : r.cL >= r.cR ? 'fl' : 'fr';
}

export function startFinalBoss(r: RunState): { nextRun: RunState; bossKey: string } {
  const bk = resolveFinalBossKey(r);
  const next = deepCloneRun(r);
  next._fbk = bk;
  next._fPhase = 1;
  next.cBT = 'final';
  next.en = scaleEnemy(BOSS[bk], next.dd.hm, next.dd.am, 1);
  next.cW = next.wpb + 1;
  next.log = [];
  next.wTurn = 0;
  next._wDmgBase = next.dmgDealt;
  return { nextRun: next, bossKey: bk };
}

export function handleFinalBossKill(r: RunState): { nextRun: RunState; gameWon: boolean } {
  const next = deepCloneRun(r);
  if (next._fPhase === 1 && next.di >= 3) {
    next._fPhase = 2;
    const bk2 = ['ft', 'fl', 'fr'].find(k => k !== next._fbk) || 'ft';
    next.en = scaleEnemy(BOSS[bk2], next.dd.hm, next.dd.am, 0.85);
    next.log = [];
    next.wTurn = 0;
    next._wDmgBase = next.dmgDealt;
    return { nextRun: next, gameWon: false };
  }
  return { nextRun: next, gameWon: true };
}

/* ===== Bone Reward ===== */

export function calcBoneReward(r: RunState, won: boolean): number {
  let tb = r.bE + r.bb;
  tb = Math.floor(tb * r.dd.bm * (1 + r.tb.bM));
  if (r.fe === 'rit') tb = Math.floor(tb * 1.5);
  if (won) tb = Math.floor(tb * 1.5);
  return Math.max(tb, 1);
}

/* ===== Ally Revive Cost ===== */

export function allyReviveCost(r: RunState): number {
  return Math.max(2, Math.floor(3 + r.bc * 2 + r.di * 1.5));
}

/* ===== Best Difficulty Label ===== */

export function bestDiffLabel(save: SaveData): string {
  const marks: string[] = [];
  DIFFS.forEach((d, i) => {
    if (save.best && save.best[i]) marks.push(d.ic + d.n);
  });
  return marks.join(' ');
}

/* ===== TB Summary ===== */

export function tbSummary(tb: TreeBonus): string[] {
  const parts: string[] = [];
  const summaryDefs: { k: keyof TreeBonus; f: (v: number) => string }[] = [
    { k: 'bA', f: v => 'ATK+' + v }, { k: 'bH', f: v => 'HP+' + v },
    { k: 'bD', f: v => 'DEF+' + v }, { k: 'cr', f: v => '会心+' + (v * 100).toFixed(0) + '%' },
    { k: 'bM', f: v => '骨+' + (v * 100).toFixed(0) + '%' }, { k: 'dM', f: v => 'ダメ+' + (v * 100).toFixed(0) + '%' },
    { k: 'rg', f: v => '再生+' + (v * 100).toFixed(0) + '%' }, { k: 'rv', f: () => '復活' },
    { k: 'iR', f: v => '氷耐' + (v * 100).toFixed(0) + '%' }, { k: 'fR', f: v => '火耐' + (v * 100).toFixed(0) + '%' },
    { k: 'aS', f: v => '仲間枠+' + v }, { k: 'aH', f: v => '仲間HP+' + (v * 100).toFixed(0) + '%' },
    { k: 'aA', f: v => '仲間ATK+' + (v * 100).toFixed(0) + '%' }, { k: 'eN', f: v => '進化択+' + v },
    { k: 'sC', f: v => '初期Lv+' + v },
  ];
  summaryDefs.forEach(s => { if (tb[s.k]) parts.push(s.f(tb[s.k])); });
  return parts;
}

/* ===== Pick Biome Logic ===== */

export function pickBiomeAuto(r: RunState): { biome: BiomeId; needSelection: boolean; options: BiomeId[] } {
  if (r.cB === 0) {
    return { biome: r.bms[0], needSelection: false, options: [] };
  }
  const rem = r.bms.filter((_, i) => i >= r.cB) as BiomeId[];
  if (rem.length <= 1) {
    return { biome: rem[0] || r.bms[2], needSelection: false, options: [] };
  }
  return { biome: rem[0], needSelection: true, options: rem };
}

export function applyBiomeSelection(r: RunState, biome: BiomeId): RunState {
  const next = deepCloneRun(r);
  next.cBT = biome;
  next.cB++;
  next.cW = 0;
  return next;
}

export function applyFirstBiome(r: RunState): RunState {
  const next = deepCloneRun(r);
  next.cBT = next.bms[0];
  next.cB = 1;
  return next;
}

export function applyAutoLastBiome(r: RunState): RunState {
  const next = deepCloneRun(r);
  const rem = next.bms.filter((_, i) => i >= next.cB) as BiomeId[];
  next.cBT = rem[0] || next.bms[2];
  next.cB++;
  return next;
}

/* ===== Active Skills ===== */

/** 文明レベルからスキル解放判定 */
export function calcAvlSkills(r: RunState): ASkillId[] {
  const lvs = civLvs(r);
  const mn = Math.min(lvs.tech, lvs.life, lvs.rit);
  return A_SKILLS
    .filter(s => {
      if (s.ct === 'bal') return mn >= s.rL;
      return lvs[s.ct] >= s.rL;
    })
    .map(s => s.id);
}

/** スキル発動（純粋関数） */
export function applySkill(r: RunState, sid: ASkillId): { nextRun: RunState; events: TickEvent[] } {
  const def = A_SKILLS.find(s => s.id === sid);
  if (!def) return { nextRun: r, events: [] };

  // クールダウン中は不発
  if (r.sk.cds[sid] && r.sk.cds[sid]! > 0) return { nextRun: r, events: [] };

  const next = deepCloneRun(r);
  const events: TickEvent[] = [];
  const fx = def.fx;

  if (fx.t === 'dmgAll') {
    // 敵に固定ダメージ
    if (next.en) {
      const dmg = Math.floor(fx.bd * fx.mul);
      next.en.hp -= dmg;
      next.dmgDealt += dmg;
      next.log.push({ x: `✦ ${def.ic} ${def.nm} → ${dmg}`, c: 'gc' });
      events.push({ type: 'popup', v: dmg, crit: false, heal: false, tgt: 'en' });
      events.push({ type: 'sfx', sfx: 'skFire' });
      events.push({ type: 'skill_fx', sid, v: dmg });
    }
  } else if (fx.t === 'healAll') {
    // プレイヤー回復
    const heal = fx.bh;
    next.hp = Math.min(next.hp + heal, next.mhp);
    // 仲間も回復
    next.al.forEach(a => {
      if (a.a) a.hp = Math.min(a.hp + Math.floor(a.mhp * fx.aR), a.mhp);
    });
    next.log.push({ x: `✦ ${def.ic} ${def.nm} +${heal}`, c: 'lc' });
    events.push({ type: 'popup', v: heal, crit: false, heal: true, tgt: 'pl' });
    events.push({ type: 'sfx', sfx: 'skHeal' });
    events.push({ type: 'skill_fx', sid, v: heal });
  } else if (fx.t === 'buffAtk') {
    // ATK倍率バフ + HP消費
    next.hp = Math.max(1, next.hp - fx.hC);
    next.sk.bfs.push({ sid, rT: fx.dur, fx: { ...fx } });
    next.log.push({ x: `✦ ${def.ic} ${def.nm} ATK×${fx.aM} ${fx.dur}T`, c: 'rc' });
    events.push({ type: 'sfx', sfx: 'skRage' });
    events.push({ type: 'skill_fx', sid, v: fx.aM });
  } else if (fx.t === 'shield') {
    // 被ダメ軽減バフ
    next.sk.bfs.push({ sid, rT: fx.dur, fx: { ...fx } });
    next.log.push({ x: `✦ ${def.ic} ${def.nm} -${Math.floor(fx.dR * 100)}% ${fx.dur}T`, c: 'cc' });
    events.push({ type: 'sfx', sfx: 'skShield' });
    events.push({ type: 'skill_fx', sid, v: fx.dR });
  }

  // クールダウン設定
  next.sk.cds[sid] = def.cd;

  return { nextRun: next, events };
}

/** バフターンデクリメント・消滅 */
export function tickBuffs(sk: SkillSt): SkillSt {
  const bfs = sk.bfs
    .map(b => ({ ...b, rT: b.rT - 1, fx: { ...b.fx } }))
    .filter(b => b.rT > 0);
  return { ...sk, bfs };
}

/** バトル終了時クールダウンデクリメント */
export function decSkillCds(sk: SkillSt): SkillSt {
  const cds: Partial<Record<ASkillId, number>> = {};
  for (const key in sk.cds) {
    const k = key as ASkillId;
    const v = (sk.cds[k] || 0) - 1;
    if (v > 0) cds[k] = v;
  }
  return { ...sk, cds, avl: [...sk.avl], bfs: sk.bfs.map(b => ({ ...b, fx: { ...b.fx } })) };
}

/* ===== Synergy System ===== */

/**
 * 取得済み進化からシナジー状況を計算する
 * @param evolutions - 取得済み進化の配列
 * @returns 発動中のシナジー配列
 */
export function calcSynergies(evolutions: Evolution[]): ActiveSynergy[] {
  // タグを集計
  const tagCounts = new Map<SynergyTag, number>();
  for (const evo of evolutions) {
    if (!evo.tags) continue;
    for (const tag of evo.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  // 各タグについてシナジー発動判定
  const result: ActiveSynergy[] = [];
  for (const bonus of SYNERGY_BONUSES) {
    const count = tagCounts.get(bonus.tag) ?? 0;
    if (count < 2) continue;
    const tier: 1 | 2 = count >= 3 ? 2 : 1;
    const bonusDef = tier === 2 ? bonus.tier2 : bonus.tier1;
    result.push({
      tag: bonus.tag,
      count,
      tier,
      bonusName: bonusDef.name,
    });
  }
  return result;
}

/** シナジーボーナス適用結果 */
export interface SynergyBonusResult {
  atkBonus: number;
  defBonus: number;
  hpBonus: number;
  crBonus: number;
  burnMul: number;
  healBonusRatio: number;
  allyAtkBonus: number;
  allyHpBonus: number;
}

/**
 * シナジーボーナスを集計する
 * @param synergies - 発動中シナジー配列
 * @returns ボーナス集計結果
 */
export function applySynergyBonuses(synergies: ActiveSynergy[]): SynergyBonusResult {
  let atkBonus = 0, defBonus = 0, hpBonus = 0, crBonus = 0, burnMul = 1;
  let healBonusRatio = 0, allyAtkBonus = 0, allyHpBonus = 0;

  /** 単一効果を適用するヘルパー */
  const applyEffect = (effect: SynergyEffect): void => {
    switch (effect.type) {
      case 'stat_bonus':
        if (effect.stat === 'atk') atkBonus += effect.value;
        if (effect.stat === 'def') defBonus += effect.value;
        if (effect.stat === 'hp') hpBonus += effect.value;
        if (effect.stat === 'cr') crBonus += effect.value;
        break;
      case 'damage_multiplier':
        if (effect.target === 'burn') burnMul *= effect.multiplier;
        break;
      case 'heal_bonus':
        healBonusRatio += effect.ratio;
        break;
      case 'ally_bonus':
        if (effect.stat === 'atk') allyAtkBonus += effect.value;
        if (effect.stat === 'hp') allyHpBonus += effect.value;
        break;
      case 'compound':
        for (const sub of effect.effects) applyEffect(sub);
        break;
      // special: ゲーム側で個別処理
    }
  };

  for (const syn of synergies) {
    const bonusDef = SYNERGY_BONUSES.find(b => b.tag === syn.tag);
    if (!bonusDef) continue;
    const effect = syn.tier === 2 ? bonusDef.tier2.effect : bonusDef.tier1.effect;
    applyEffect(effect);
  }

  return { atkBonus, defBonus, hpBonus, crBonus, burnMul, healBonusRatio, allyAtkBonus, allyHpBonus };
}

/* ===== ランダムイベント ===== */

/**
 * 最もレベルの高い文明タイプを返す（タイブレークはtech優先）
 */
export function dominantCiv(r: RunState): CivType {
  if (r.cT >= r.cL && r.cT >= r.cR) return 'tech';
  if (r.cL >= r.cR) return 'life';
  return 'rit';
}

/**
 * バトル後にイベントを発生させるか判定する
 *
 * @param r - 現在のランステート
 * @param rng - 乱数関数（0〜1）
 * @returns 発生するイベント（undefinedなら発生なし）
 */
export function rollEvent(
  r: RunState,
  rng: () => number = Math.random,
): RandomEventDef | undefined {
  // 序盤はイベント発生しない
  if (r.btlCount < EVENT_MIN_BATTLES) return undefined;

  // 確率チェック
  if (rng() >= EVENT_CHANCE) return undefined;

  // バイオームアフィニティを考慮して候補をフィルタ
  const currentBiome = r.cBT;
  const candidates = RANDOM_EVENTS.filter(e => {
    if (e.minBiomeCount && r.bc < e.minBiomeCount) return false;
    return true;
  });

  // バイオームアフィニティがあるイベントを優先（2倍の重み）
  const weighted: RandomEventDef[] = [];
  for (const evt of candidates) {
    weighted.push(evt);
    if (evt.biomeAffinity?.includes(currentBiome as BiomeId)) {
      weighted.push(evt); // 重複追加で確率2倍
    }
  }

  if (weighted.length === 0) return undefined;
  const idx = Math.floor(rng() * weighted.length);
  return weighted[idx];
}

/**
 * イベント選択肢の効果を適用する
 *
 * @param r - 現在のランステート
 * @param choice - 選択した選択肢
 * @param rng - 乱数関数
 * @returns 更新後のランステート
 */
export function applyEventChoice(
  r: RunState,
  choice: EventChoice,
  rng: () => number = Math.random,
): RunState {
  const next = deepCloneRun(r);
  const eff = choice.effect;

  switch (eff.type) {
    case 'stat_change':
      if (eff.stat === 'hp') next.mhp += eff.value;
      if (eff.stat === 'atk') next.atk += eff.value;
      if (eff.stat === 'def') next.def += eff.value;
      break;
    case 'heal':
      next.hp = Math.min(next.mhp, next.hp + eff.amount);
      break;
    case 'damage':
      next.hp = Math.max(1, next.hp - eff.amount);
      break;
    case 'bone_change':
      next.bE += eff.amount;
      break;
    case 'add_ally': {
      // 仲間枠に空きがある場合のみ追加
      const aliveCount = next.al.length;
      if (aliveCount < next.mxA) {
        // 最高文明タイプの味方テンプレートからランダム選択
        const civType = dominantCiv(next);
        const templates = ALT[civType];
        const tmpl = templates[Math.floor(rng() * templates.length)];
        next.al.push({
          n: tmpl.n, hp: tmpl.hp, mhp: tmpl.hp, atk: tmpl.atk,
          t: tmpl.t, a: 1, h: tmpl.h, tk: tmpl.tk,
        });
      }
      break;
    }
    case 'random_evolution': {
      // ランダム進化1つを即時適用
      const pool = EVOS.filter(e => !e.e.revA);
      if (pool.length > 0) {
        const evo = pool[Math.floor(rng() * pool.length)];
        next.evs.push(evo);
        // ステータスに効果を適用
        const snap = applyStatFx(getSnap(next), evo.e);
        writeSnapToRun(next, snap);
        // 文明レベルアップ
        const key = CIV_KEYS[evo.t];
        next[key] += 1;
      }
      break;
    }
    case 'civ_level_up': {
      const targetCiv = eff.civType === 'dominant'
        ? dominantCiv(next)
        : eff.civType;
      if (targetCiv === 'tech') next.cT += 1;
      else if (targetCiv === 'life') next.cL += 1;
      else if (targetCiv === 'rit') next.cR += 1;
      break;
    }
    case 'nothing':
      break;
  }

  next.eventCount += 1;
  return next;
}

/** イベント効果の結果メッセージを生成 */
export function formatEventResult(
  effect: EventEffect,
  cost?: EventCost,
): { icon: string; text: string } {
  let base: { icon: string; text: string };
  switch (effect.type) {
    case 'stat_change': {
      const statName = effect.stat === 'hp' ? '最大HP' : effect.stat === 'atk' ? 'ATK' : 'DEF';
      const icon = effect.stat === 'hp' ? '❤️' : effect.stat === 'atk' ? '💪' : '🛡️';
      const sign = effect.value >= 0 ? '+' : '';
      base = { icon, text: `${statName} ${sign}${effect.value}!` };
      break;
    }
    case 'heal':
      base = { icon: '💚', text: `HP ${effect.amount} 回復!` };
      break;
    case 'damage':
      base = { icon: '💔', text: `${effect.amount} ダメージを受けた!` };
      break;
    case 'bone_change': {
      const bSign = effect.amount >= 0 ? '+' : '';
      base = { icon: '🦴', text: `骨 ${bSign}${effect.amount}!` };
      break;
    }
    case 'add_ally':
      base = { icon: '🤝', text: '仲間が加わった!' };
      break;
    case 'random_evolution':
      base = { icon: '🧬', text: 'ランダムな進化を獲得!' };
      break;
    case 'civ_level_up':
      base = { icon: '📈', text: '文明レベルが上がった!' };
      break;
    case 'nothing':
      base = { icon: '…', text: '何も起こらなかった' };
      break;
  }

  // コスト情報を付記
  if (cost) {
    if (cost.type === 'hp_damage') {
      base.text += ` (HP -${cost.amount})`;
    } else if (cost.type === 'bone') {
      base.text += ` (骨 -${cost.amount})`;
    }
  }

  return base;
}
