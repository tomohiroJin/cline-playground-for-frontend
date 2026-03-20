/**
 * スコア計算ドメインサービス
 *
 * パズル完成時のスコアを計算する純粋関数。
 */
import { assert } from '../../shared/utils/assert';
import { PuzzleScore, PuzzleRank } from '../../types/puzzle';
import { getDivisionMultiplier } from '../puzzle/value-objects/division';

/** ランク閾値（ドメイン定数） */
export const RANK_THRESHOLDS = {
  THREE_STAR: 8000,
  TWO_STAR: 5000,
  ONE_STAR: 2000,
} as const;

/** スコア計算の定数 */
export const SCORE_CONSTANTS = {
  BASE_SCORE: 10_000,
  MOVE_PENALTY_PER: 50,
  TIME_PENALTY_PER: 10,
  HINT_PENALTY: 1_000,
} as const;

/** スコア計算の入力 */
export interface ScoreInput {
  readonly actualMoves: number;
  readonly optimalMoves: number;
  readonly elapsedSeconds: number;
  readonly hintUsed: boolean;
  readonly division: number;
}

/**
 * ランクを判定する
 */
export const determineRank = (score: number): PuzzleRank => {
  if (score >= RANK_THRESHOLDS.THREE_STAR) return '★★★';
  if (score >= RANK_THRESHOLDS.TWO_STAR) return '★★☆';
  if (score >= RANK_THRESHOLDS.ONE_STAR) return '★☆☆';
  return 'クリア';
};

/**
 * スコアを計算する
 */
export const calculateScore = (input: ScoreInput): PuzzleScore => {
  assert(input.actualMoves >= 0, 'actualMoves must be non-negative');
  assert(input.elapsedSeconds >= 0, 'elapsedSeconds must be non-negative');

  const { BASE_SCORE, MOVE_PENALTY_PER, TIME_PENALTY_PER, HINT_PENALTY } = SCORE_CONSTANTS;

  const movePenalty = Math.max(0, input.actualMoves - input.optimalMoves) * MOVE_PENALTY_PER;
  const timePenalty = input.elapsedSeconds * TIME_PENALTY_PER;
  const hintPenalty = input.hintUsed ? HINT_PENALTY : 0;
  const multiplier = getDivisionMultiplier(input.division);

  const rawScore = (BASE_SCORE - movePenalty - timePenalty - hintPenalty) * multiplier;
  const totalScore = Math.max(0, Math.round(rawScore));
  const rank = determineRank(totalScore);

  return {
    totalScore,
    moveCount: input.actualMoves,
    elapsedTime: input.elapsedSeconds,
    hintUsed: input.hintUsed,
    division: input.division,
    rank,
    shuffleMoves: input.optimalMoves,
  };
};
