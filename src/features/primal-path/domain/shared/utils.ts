/**
 * 共通ユーティリティ関数
 *
 * 数値クランプ、ポップアップ管理、ステータススナップショット等の
 * ドメイン横断的なユーティリティを提供する。
 */
import type { StatSnapshot, EvoEffect, RunState, DmgPopup } from '../../types';

/* ===== 定数 ===== */

const POPUP_LIFETIME = 8;
const MAX_POPUPS = 5;
const POPUP_DY = 3;

const SNAP_KEYS: (keyof StatSnapshot)[] = ['atk', 'mhp', 'hp', 'def', 'cr', 'aM', 'burn', 'bb'];

/* ===== 数値ユーティリティ ===== */

/** 値を指定範囲内にクランプする */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/* ===== ダメージポップアップ ===== */

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

/* ===== ステータススナップショット ===== */

/** RunStateからステータスのスナップショットを抽出する */
export function getSnap(r: RunState): StatSnapshot {
  const s = {} as StatSnapshot;
  SNAP_KEYS.forEach(k => { s[k] = r[k]; });
  return s;
}

/** 進化効果をステータススナップショットに適用する */
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

/** スナップショットの値をRunStateに書き戻す */
export function writeSnapToRun(r: RunState, s: StatSnapshot): void {
  SNAP_KEYS.forEach(k => { (r[k] as number) = s[k]; });
}

/* ===== RunState ディープクローン ===== */

/** RunStateの深いコピーを作成する（イミュータブル更新用） */
export function deepCloneRun(r: RunState): RunState {
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
