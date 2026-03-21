// ============================================================================
// Deep Sea Interceptor - スコアリングサービス（純粋関数）
// ============================================================================

import type { Difficulty } from '../../types';
import { MAX_COMBO_MULTIPLIER, COMBO_MULTIPLIER_INCREMENT } from '../../constants';

/** コンボ倍率を計算 */
export function calculateMultiplier(combo: number): number {
  return Math.min(MAX_COMBO_MULTIPLIER, 1.0 + combo * COMBO_MULTIPLIER_INCREMENT);
}

/** スコア付きの撃破ポイントを計算 */
export function calculateDestroyScore(
  basePoints: number,
  combo: number,
  scoreMultiplier: number
): number {
  const multiplier = calculateMultiplier(combo);
  return Math.floor(basePoints * multiplier * scoreMultiplier);
}

/** ステージクリアボーナスを計算 */
export function calculateStageBonus(
  stage: number,
  maxCombo: number,
  grazeCount: number
): number {
  return 1000 * stage + maxCombo * 10 + grazeCount * 5;
}

/** ランク判定（純粋関数） */
export function calculateRank(score: number, lives: number, difficulty: Difficulty): string {
  const diffMultiplier = difficulty === 'cadet' ? 2.0 : difficulty === 'abyss' ? 0.5 : 1.0;
  const adjustedScore = score / diffMultiplier;

  if (adjustedScore >= 40000 && lives > 0) return 'S';
  if (adjustedScore >= 25000) return 'A';
  if (adjustedScore >= 15000) return 'B';
  if (adjustedScore >= 5000) return 'C';
  return 'D';
}
