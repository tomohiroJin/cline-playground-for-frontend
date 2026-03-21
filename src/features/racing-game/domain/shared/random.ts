// 乱数ジェネレータ（テスト時に決定的な乱数を注入可能にする）

/** 乱数生成関数の型（[0, 1) の浮動小数を返す） */
export type RandomFn = () => number;

/** デフォルト乱数（Math.random のラッパー） */
export const defaultRandom: RandomFn = () => Math.random();

/**
 * シード付き疑似乱数ジェネレータの生成（xorshift32）
 * テスト時の再現性確保に使用
 */
export const createSeededRandom = (seed: number): RandomFn => {
  let state = seed | 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
};

/** グローバル乱数ジェネレータ（差し替え可能） */
let globalRandom: RandomFn = defaultRandom;

/** グローバル乱数を差し替える */
export const setGlobalRandom = (rng: RandomFn): void => {
  globalRandom = rng;
};

/** グローバル乱数をデフォルトに戻す */
export const resetGlobalRandom = (): void => {
  globalRandom = defaultRandom;
};

/** 現在のグローバル乱数を取得 */
export const getRandom = (): RandomFn => globalRandom;
