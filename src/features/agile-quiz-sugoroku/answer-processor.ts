/**
 * 回答処理（後方互換用）
 *
 * 実体は domain/quiz/answer-evaluator.ts に移動済み。
 * 既存のインポートパスを壊さないよう再エクスポートを維持する。
 */
export {
  computeAnswerResult,
  computeDebtDelta,
  nextGameStats,
} from './domain/quiz';
export type { AnswerInput } from './domain/quiz';
