/**
 * 実績サービス
 *
 * 実績の解除条件チェックを担当する。
 */
import type { AchievementDef, RunStats, AggregateStats } from '../../types';
import { SYNERGY_BONUSES } from '../../constants';

/**
 * 実績の解除条件をチェックする
 * @returns 解除されたか
 */
export function checkAchievement(
  achievement: AchievementDef,
  stats: AggregateStats,
  currentRun: RunStats,
): boolean {
  const c = achievement.condition;
  switch (c.type) {
    case 'first_clear':
      return currentRun.result === 'victory';
    case 'clear_count':
      return stats.totalClears >= c.count;
    case 'clear_difficulty':
      return stats.clearedDifficulties.includes(c.difficulty);
    case 'all_difficulties_cleared':
      return stats.clearedDifficulties.length >= 4;
    case 'all_awakenings':
      return stats.achievedAwakenings.length >= 4;
    case 'max_damage':
      return currentRun.maxDamage >= c.threshold;
    case 'total_kills':
      return stats.totalKills >= c.count;
    case 'synergy_tier2':
      return stats.achievedSynergiesTier2.includes(c.tag);
    case 'all_synergies_tier1':
      return stats.achievedSynergiesTier1.length >= SYNERGY_BONUSES.length;
    case 'event_count':
      return stats.totalEvents >= c.count;
    case 'challenge_clear':
      return stats.clearedChallenges.includes(c.challengeId);
    case 'no_damage_boss':
      return currentRun.result === 'victory' && stats.lastBossDamageTaken === 0;
    case 'speed_clear':
      return currentRun.result === 'victory' && currentRun.playtimeSeconds <= c.maxSeconds;
    case 'bone_hoarder':
      return stats.totalBoneEarned >= c.amount;
    case 'full_tree':
      return stats.treeCompletionRate >= 1.0;
  }
}
