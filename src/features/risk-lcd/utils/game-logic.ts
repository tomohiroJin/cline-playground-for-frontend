import type { MergedStyle, RankResult } from '../types';
import { ROWS, RANK_TABLE, LANE_LABELS, STY } from '../constants/game-config';

// 値を範囲内にクランプ
export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

// ランク計算
export function computeRank(sc: number, cl: boolean, st: number): RankResult {
  const e = RANK_TABLE.find(r => r.test(sc, cl, st));
  return e ? { g: e.g, c: e.c } : { g: 'E', c: 'まず生き延びろ。' };
}

// コンボ倍率計算
export function comboMult(cnt: number, bonus: number): number {
  return (cnt >= 5 ? 2 : cnt >= 3 ? 1.5 : 1) + bonus * (cnt >= 3 ? 1 : 0);
}

// 有効予告段数を計算
export function calcEffBf(
  bf0: number[],
  lane: number,
  adj: number,
  adjLane: number,
  adjExtra: number,
  fog: number
): number {
  let v = bf0[lane] + adj + fog;
  if (lane === adjLane) v += adjExtra;
  return clamp(v, 0, ROWS - 1);
}

// 予告段数のビジュアルラベル
export function visLabel(v: number): string {
  return v >= 7 ? 'SAFE' : v >= 4 ? 'MID' : 'RISK';
}

// 複数スタイルをマージ
export function mergeStyles(ids: string[]): MergedStyle {
  if (ids.length === 0) throw new Error('mergeStyles: empty');
  const b: MergedStyle = {
    mu: [1, 2, 4],
    rs: [],
    sf: [],
    wm: 0,
    cm: 0,
    sh: 0,
    sp: 0,
    db: 0,
    cb: 0,
    bfSet: [0, 4, 6],
    autoBlock: 0,
  };
  ids.forEach(id => {
    const s = STY[id];
    if (!s) return;
    b.mu = b.mu.map((v, i) => Math.max(v, s.mu[i]));
    s.rs.forEach(r => {
      if (!b.rs.includes(r)) b.rs.push(r);
    });
    b.wm += s.wm;
    b.cm += s.cm;
    b.sh += s.sh;
    b.sp = Math.max(b.sp, s.sp);
    b.db = Math.max(b.db, s.db);
    b.cb = Math.max(b.cb, s.cb);
    if (s.autoBlock) b.autoBlock = 1;
    if (s.bfSet.reduce((a, c) => a + c, 0) < b.bfSet.reduce((a, c) => a + c, 0))
      b.bfSet = [...s.bfSet];
  });
  return b;
}

// 重み付き選択（excludeリストのインデックスは除外）
export function wPick(w: number[], ex: number[]): number {
  const wt = w.map((v, i) => (ex.includes(i) ? 0 : v));
  const s = wt.reduce((a, b) => a + b, 0);
  if (s <= 0) return -1;
  const r = Math.random() * s;
  let a = 0;
  for (let i = 0; i < wt.length; i++) {
    a += wt[i];
    if (r <= a) return i;
  }
  return wt.length - 1;
}

// サバイバルラウンドのポイント計算
export function computePoints(
  mu: number,
  cm: number,
  scoreMult: number,
  scoreMod: number,
  baseBonus: number
): number {
  return Math.floor((10 + baseBonus) * mu * cm * scoreMult * scoreMod);
}

// ステージクリアボーナス計算
export function computeStageBonus(
  stage: number,
  cbMod: number,
  scoreMult: number,
  maxCombo: number,
  nearMiss: number
): number {
  let bn = 50 * (stage + 1);
  bn = Math.floor(bn * (1 + cbMod) * scoreMult);
  if (maxCombo >= 5) bn += 100;
  else if (maxCombo >= 3) bn += 30;
  if (nearMiss >= 3) bn += 50;
  return bn;
}

// ビルドサマリー文字列を生成
export function buildSummary(game: {
  scoreMult: number;
  st: MergedStyle;
  slowMod: number;
  speedMod: number;
  revive: number;
  comboBonus: number;
}): string {
  const p: string[] = [];
  if (game.scoreMult > 1.01) p.push('SCORE×' + game.scoreMult.toFixed(1));
  if (game.st.sf.length > 0)
    p.push('避難所:' + game.st.sf.map((l: number) => LANE_LABELS[l]).join(','));
  if (game.slowMod > 0.01) p.push('SLOW-' + ((game.slowMod * 100) | 0) + '%');
  if (game.speedMod < -0.01)
    p.push('FAST+' + ((Math.abs(game.speedMod) * 100) | 0) + '%');
  if (game.revive > 0) p.push('REVIVE×' + game.revive);
  if (game.comboBonus > 0.01) p.push('COMBO+' + game.comboBonus.toFixed(1));
  return p.join(' ─ ');
}

// 隣接レーンかどうかを判定
export function isAdjacentTo(obs: number[], lane: number): boolean {
  return obs.some(l => Math.abs(l - lane) === 1);
}
