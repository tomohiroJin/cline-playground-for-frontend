/**
 * Division 値オブジェクト
 *
 * パズルの分割数を表す値オブジェクト。
 * 有効な分割数のみ許可する。
 */
import { assert } from '../../../shared/utils/assert';
import { VALID_DIVISIONS, SHUFFLE_FACTOR } from '../../../shared/constants/puzzle-constants';

/** 分割数の型 */
export type Division = (typeof VALID_DIVISIONS)[number];

/**
 * 難易度別の乗数テーブル
 *
 * VALID_DIVISIONS の全値に対応する乗数を定義する。
 * 新しい分割数を追加する場合はここにも乗数を追加すること。
 */
const DIVISION_MULTIPLIERS: Record<Division, number> = {
  2: 0.3,
  3: 0.5,
  4: 1.0,
  5: 1.5,
  6: 2.0,
  8: 3.5,
  10: 5.0,
  16: 10.0,
  32: 20.0,
};

/**
 * バリデーション付き Division ファクトリ
 */
export const createDivision = (value: number): Division => {
  assert(
    (VALID_DIVISIONS as readonly number[]).includes(value),
    `Invalid division: ${value}. Must be one of ${VALID_DIVISIONS.join(', ')}`
  );
  return value as Division;
};

/**
 * 分割数からシャッフル回数を計算する
 */
export const calculateShuffleMoves = (division: number): number =>
  division * division * SHUFFLE_FACTOR;

/**
 * 分割数から難易度倍率を取得する
 */
export const getDivisionMultiplier = (division: number): number =>
  DIVISION_MULTIPLIERS[division] ?? 1.0;
