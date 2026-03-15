/**
 * コンボ色計算（後方互換用）
 *
 * 実体は domain/quiz/combo-calculator.ts に移動済み。
 * 既存のインポートパスを壊さないよう再エクスポートを維持する。
 */
export {
  getComboStage,
  getComboColor,
  COMBO_STAGES,
} from './domain/quiz';
export type { ComboStageId, ComboStage } from './domain/quiz';
