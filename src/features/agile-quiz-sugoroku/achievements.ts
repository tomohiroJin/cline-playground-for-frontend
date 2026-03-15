/**
 * 実績システム（後方互換用）
 *
 * 実体は domain/achievement/achievement-checker.ts に移動済み。
 * 既存のインポートパスを壊さないよう再エクスポートを維持する。
 */
export { ACHIEVEMENTS, checkAchievements } from './domain/achievement';
