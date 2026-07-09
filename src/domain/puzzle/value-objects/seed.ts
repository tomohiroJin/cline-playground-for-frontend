import { assert } from '../../../shared/utils/assert';

/**
 * 決定的擬似乱数生成器（mulberry32）を生成する。
 * 同一シードから常に同一の [0,1) 数列を返す純粋関数。
 */
export const createSeededRng = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** 'YYYYMMDD' 形式の日付文字列を数値シードへ変換する（事前条件: 8桁数字） */
export const dateStringToSeed = (yyyymmdd: string): number => {
  assert(/^\d{8}$/.test(yyyymmdd), `Invalid date seed: ${yyyymmdd}. Must be YYYYMMDD.`);
  return parseInt(yyyymmdd, 10);
};
