/**
 * quiz サブドメイン - 再エクスポート
 */
export { pickQuestion } from './question-picker';
export {
  computeAnswerResult,
  computeDebtDelta,
  nextGameStats,
} from './answer-evaluator';
export type { AnswerInput } from './answer-evaluator';
export {
  getComboStage,
  getComboColor,
  COMBO_STAGES,
} from './combo-calculator';
export type { ComboStageId, ComboStage } from './combo-calculator';
export {
  getTagColor,
  computeTagStatEntries,
  getWeakGenres,
  getWeakGenreIds,
} from './tag-stats';
export type { TagStatEntry } from './tag-stats';
export {
  buildStudyPool,
  countStudyQuestions,
  shuffleArray,
} from './study-question-pool';
