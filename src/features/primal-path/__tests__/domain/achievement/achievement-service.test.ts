/**
 * domain/achievement/achievement-service のテスト
 */
import { checkAchievement } from '../../../domain/achievement/achievement-service';
import type { AchievementDef, AggregateStats, RunStats } from '../../../types';

describe('domain/achievement/achievement-service', () => {
  const baseStats: AggregateStats = {
    totalRuns: 0,
    totalClears: 0,
    totalKills: 0,
    totalBoneEarned: 0,
    totalEvents: 0,
    clearedDifficulties: [],
    achievedAwakenings: [],
    achievedSynergiesTier1: [],
    achievedSynergiesTier2: [],
    clearedChallenges: [],
    lastBossDamageTaken: 0,
    treeCompletionRate: 0,
  };

  const baseRunStats: RunStats = {
    id: 'test',
    date: '2025-01-01',
    result: 'victory',
    difficulty: 0,
    biomeCount: 3,
    totalKills: 10,
    maxDamage: 100,
    totalDamageDealt: 500,
    totalDamageTaken: 200,
    totalHealing: 50,
    evolutionCount: 5,
    synergyCount: 2,
    eventCount: 1,
    skillUsageCount: 3,
    boneEarned: 50,
    playtimeSeconds: 300,
    awakening: undefined,
    challengeId: undefined,
    endlessWave: undefined,
  };

  describe('checkAchievement', () => {
    it('first_clear条件を勝利時に解除する', () => {
      const achievement: AchievementDef = {
        id: 'test_first_clear',
        name: 'テスト初クリア',
        description: '初クリア',
        condition: { type: 'first_clear' },
        icon: '🏆',
      };
      expect(checkAchievement(achievement, baseStats, baseRunStats)).toBe(true);
    });

    it('first_clear条件を敗北時には解除しない', () => {
      const achievement: AchievementDef = {
        id: 'test_first_clear',
        name: 'テスト初クリア',
        description: '初クリア',
        condition: { type: 'first_clear' },
        icon: '🏆',
      };
      expect(checkAchievement(achievement, baseStats, { ...baseRunStats, result: 'defeat' })).toBe(false);
    });

    it('total_kills条件をキル数が足りない場合に解除しない', () => {
      const achievement: AchievementDef = {
        id: 'test_kills',
        name: 'テストキル',
        description: '100体撃破',
        condition: { type: 'total_kills', count: 100 },
        icon: '💀',
      };
      expect(checkAchievement(achievement, { ...baseStats, totalKills: 50 }, baseRunStats)).toBe(false);
    });
  });
});
