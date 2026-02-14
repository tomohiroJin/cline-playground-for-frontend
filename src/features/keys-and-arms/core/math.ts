/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — 数学ユーティリティ
 * 純粋関数のみ。副作用なし、Canvas依存なし。
 */

export const TAU = Math.PI * 2;

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const rng = (lo = 0, hi = 1) => lo + Math.random() * (hi - lo);
export const rngInt = (lo, hi) => Math.floor(rng(lo, hi + 1));
export const rngSpread = (spread) => (Math.random() - .5) * spread * 2;

/** 配列をシャッフル（Fisher-Yates） */
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rngInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
