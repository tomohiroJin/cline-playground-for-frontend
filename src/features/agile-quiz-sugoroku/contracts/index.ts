/**
 * 契約（Design by Contract）層のエクスポート
 */
export { ContractViolationError, assertContract } from './contract-error';
export {
  assertValidGameStats,
  assertValidSprintNumber,
  assertCanStartSprint,
} from './game-contracts';
export {
  assertCanPickQuestion,
  assertValidAnswerResult,
  assertValidCombo,
} from './quiz-contracts';
export {
  assertValidGradeClassification,
  assertValidDerivedStats,
  assertNonNegativeDebt,
} from './scoring-contracts';
