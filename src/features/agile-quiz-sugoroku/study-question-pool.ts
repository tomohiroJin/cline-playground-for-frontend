/**
 * 勉強会モード問題プール（後方互換用）
 *
 * 実体は domain/quiz/study-question-pool.ts に移動済み。
 * 既存のインポートパスを壊さないよう再エクスポートを維持する。
 */
export {
  buildStudyPool,
  countStudyQuestions,
} from './domain/quiz';
