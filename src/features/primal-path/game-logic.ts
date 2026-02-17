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
  AllyTemplate, LogEntry,
} from './types';
import {
  CIV_TYPES, CIV_KEYS, TREE, TB_DEFAULTS, EVOS, ALT, ENM, BOSS,
  DIFFS, BIOME_AFFINITY, ENV_DMG, AWK_SA, AWK_FA, TN, TC,
  WAVES_PER_BIOME,
} from './constants';

/* ===== Utility ===== */

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
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

function tickPlayerPhase(next: RunState, e: Enemy, events: TickEvent[], rng: () => number): void {
  const pa = calcPlayerAtk(next, rng);
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

  if (next.burn) {
    const bd = Math.floor(pa.dmg * 0.2);
    e.hp -= bd;
    next.dmgDealt += bd;
    next.log.push({ x: '  🔥 火傷 ' + bd, c: 'tc' });
  }
}

function tickAllyPhase(next: RunState, e: Enemy): void {
  next.al.forEach(a => {
    if (!a.a) return;
    if (a.h) {
      const h = Math.floor(a.atk * 2.5);
      next.hp = Math.min(next.hp + h, next.mhp);
      next.log.push({ x: '  💚 ' + a.n + ' +' + h, c: 'lc' });
    } else {
      const ad = Math.max(1, a.atk - e.def);
      e.hp -= ad;
      next.dmgDealt += ad;
      next.log.push({ x: '  ' + a.n + ' → ' + ad, c: '' });
    }
  });
}

function tickRegenPhase(next: RunState): void {
  if (next.tb.rg > 0) {
    const rg = Math.max(1, Math.floor(next.mhp * next.tb.rg));
    next.hp = Math.min(next.hp + rg, next.mhp);
    next.log.push({ x: '  🌿 再生 +' + rg, c: 'lc' });
  }
}

function tickEnemyPhase(next: RunState, e: Enemy, events: TickEvent[], rng: () => number): void {
  let ed = Math.max(1, e.atk - next.def);
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

  tickEnvPhase(next);
  tickPlayerPhase(next, e, events, rng);
  tickAllyPhase(next, e);
  tickRegenPhase(next);

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

  tickEnemyPhase(next, e, events, rng);

  if (tickDeathCheck(next, events)) {
    return { nextRun: next, events };
  }

  // Trim log
  if (next.log.length > 60) next.log = next.log.slice(-35);

  // Visual effects
  events.push({ type: 'shake_enemy' });
  if (next.hp < pHP) events.push({ type: 'flash_player_dmg' });
  if (next.hp > pHP) events.push({ type: 'flash_player_heal' });

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

  next.en = scaleEnemy(src, next.dd.hm, next.dd.am, 1 + next.bc * 0.25);
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
