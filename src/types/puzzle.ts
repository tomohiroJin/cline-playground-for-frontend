/** ランク */
export type PuzzleRank = '★★★' | '★★☆' | '★☆☆' | 'クリア';

/** スコア計算結果 */
export interface PuzzleScore {
  totalScore: number;
  moveCount: number;
  elapsedTime: number;
  hintUsed: boolean;
  division: number;
  rank: PuzzleRank;
  shuffleMoves: number;
}

/** 難易度別乗数 */
export const DIVISION_MULTIPLIERS: Record<number, number> = {
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

/** ランク閾値 */
export const RANK_THRESHOLDS = {
  THREE_STAR: 8000,
  TWO_STAR: 5000,
  ONE_STAR: 2000,
};
