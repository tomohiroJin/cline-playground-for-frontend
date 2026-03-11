/**
 * 実績サービス
 *
 * 実績の解除条件チェックを担当する。
 * 条件チェックは AchievementChecker レジストリにより拡張可能（OCP準拠）。
 */
import type { AchievementDef, RunStats, AggregateStats } from '../../types';
import { achievementRegistry } from './achievement-registry';

/**
 * 実績の解除条件をチェックする — Registry ベースで条件を判定
 * @returns 解除されたか
 */
export function checkAchievement(
  achievement: AchievementDef,
  stats: AggregateStats,
  currentRun: RunStats,
): boolean {
  const c = achievement.condition;
  const checker = achievementRegistry.get(c.type);
  if (!checker) return false;
  return checker.check(c, stats, currentRun);
}
