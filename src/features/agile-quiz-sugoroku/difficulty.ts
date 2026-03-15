/**
 * 難易度設定（後方互換用）
 *
 * 実体は domain/scoring/difficulty.ts に移動済み。
 * 既存のインポートパスを壊さないよう再エクスポートを維持する。
 */
export {
  DIFFICULTY_CONFIGS,
  getDifficultyConfig,
  calculateGradeWithDifficulty,
} from './domain/scoring';
