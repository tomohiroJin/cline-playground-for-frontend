/**
 * KEYS & ARMS — 数学ユーティリティ
 * 純粋関数のみ。副作用なし、Canvas依存なし。
 */

export const TAU = Math.PI * 2;

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
export const rng = (lo = 0, hi = 1): number => lo + Math.random() * (hi - lo);
export const rngInt = (lo: number, hi: number): number => Math.floor(rng(lo, hi + 1));
export const rngSpread = (spread: number): number => (Math.random() - .5) * spread * 2;

/** 配列をシャッフル（Fisher-Yates） */
export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rngInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
