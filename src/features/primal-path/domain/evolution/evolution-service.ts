/**
 * 進化サービス
 *
 * 進化のロール、適用、プレビュー処理を担当する。
 */
import type {
  RunState, Evolution, AllyTemplate, ApplyEvoResult,
} from '../../types';
import { CIV_TYPES, CIV_KEYS, EVOS, ALT } from '../../constants';
import { applyStatFx, getSnap, writeSnapToRun, deepCloneRun } from '../shared/utils';
import { civLv } from '../shared/civ-utils';
import { deadAllies } from '../battle/combat-calculator';
import { effATK } from '../battle/combat-calculator';

/** 進化適用のプレビュー（ステータス確認用） */
export function simEvo(r: RunState, ev: Evolution): { atk: number; hp: number; mhp: number; def: number; cr: number } {
  const s = applyStatFx(getSnap(r), ev.e);
  return { atk: Math.floor(s.atk * s.aM * r.dm), hp: s.hp, mhp: s.mhp, def: s.def, cr: s.cr };
}

/** 指定数の進化をロールする（文明バランス考慮） */
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

/** 進化を適用する（ステータス更新・文明Lv・仲間追加） */
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

  // 文明レベルインクリメント
  const key = CIV_KEYS[ev.t];
  next[key]++;

  // 仲間リクルート（文明レベル2, 4, 6時）
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
