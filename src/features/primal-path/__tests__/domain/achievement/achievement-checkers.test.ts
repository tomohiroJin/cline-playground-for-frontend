/**
 * 実績チェッカーのテスト
 */
import { achievementRegistry } from '../../../domain/achievement/achievement-registry';
import type { AchievementCondition, AggregateStats, RunStats } from '../../../types';

type ConditionType = AchievementCondition['type'];

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

const baseRun: RunStats = {
  id: 'test', date: '2025-01-01', result: 'victory', difficulty: 0,
  biomeCount: 3, totalKills: 10, maxDamage: 100, totalDamageDealt: 500,
  totalDamageTaken: 200, totalHealing: 50, evolutionCount: 5, synergyCount: 2,
  eventCount: 1, skillUsageCount: 3, boneEarned: 50, playtimeSeconds: 300,
  awakening: undefined, challengeId: undefined, endlessWave: undefined,
};

/** ヘルパー: 条件を直接チェック */
function check(condition: AchievementCondition, stats = baseStats, run = baseRun): boolean {
  const checker = achievementRegistry.get(condition.type);
  expect(checker).toBeDefined();
  return checker!.check(condition, stats, run);
}

describe('achievementRegistry', () => {
  it('全15種類の条件タイプが登録されている', () => {
    const types: ConditionType[] = [
      'first_clear', 'clear_count', 'clear_difficulty', 'all_difficulties_cleared',
      'all_awakenings', 'max_damage', 'total_kills', 'synergy_tier2',
      'all_synergies_tier1', 'event_count', 'challenge_clear', 'no_damage_boss',
      'speed_clear', 'bone_hoarder', 'full_tree',
    ];
    types.forEach(t => expect(achievementRegistry.has(t)).toBe(true));
  });
});

describe('個別チェッカー', () => {
  it('first_clear: 勝利時にtrue', () => {
    expect(check({ type: 'first_clear' })).toBe(true);
    expect(check({ type: 'first_clear' }, baseStats, { ...baseRun, result: 'defeat' })).toBe(false);
  });

  it('clear_count: クリア回数達成でtrue', () => {
    expect(check({ type: 'clear_count', count: 5 }, { ...baseStats, totalClears: 5 })).toBe(true);
    expect(check({ type: 'clear_count', count: 5 }, { ...baseStats, totalClears: 4 })).toBe(false);
  });

  it('clear_difficulty: 難易度クリア済みでtrue', () => {
    expect(check({ type: 'clear_difficulty', difficulty: 2 }, { ...baseStats, clearedDifficulties: [0, 1, 2] })).toBe(true);
    expect(check({ type: 'clear_difficulty', difficulty: 3 }, { ...baseStats, clearedDifficulties: [0, 1, 2] })).toBe(false);
  });

  it('all_difficulties_cleared: 4種以上クリアでtrue', () => {
    expect(check({ type: 'all_difficulties_cleared' }, { ...baseStats, clearedDifficulties: [0, 1, 2, 3] })).toBe(true);
    expect(check({ type: 'all_difficulties_cleared' }, { ...baseStats, clearedDifficulties: [0, 1, 2] })).toBe(false);
  });

  it('all_awakenings: 4種以上覚醒でtrue', () => {
    expect(check({ type: 'all_awakenings' }, { ...baseStats, achievedAwakenings: ['a', 'b', 'c', 'd'] })).toBe(true);
    expect(check({ type: 'all_awakenings' }, { ...baseStats, achievedAwakenings: ['a', 'b'] })).toBe(false);
  });

  it('max_damage: 閾値以上でtrue', () => {
    expect(check({ type: 'max_damage', threshold: 100 })).toBe(true);
    expect(check({ type: 'max_damage', threshold: 200 })).toBe(false);
  });

  it('total_kills: キル数達成でtrue', () => {
    expect(check({ type: 'total_kills', count: 50 }, { ...baseStats, totalKills: 50 })).toBe(true);
    expect(check({ type: 'total_kills', count: 100 }, { ...baseStats, totalKills: 50 })).toBe(false);
  });

  it('synergy_tier2: 指定シナジー達成でtrue', () => {
    expect(check({ type: 'synergy_tier2', tag: 'flame' as never }, { ...baseStats, achievedSynergiesTier2: ['flame' as never] })).toBe(true);
    expect(check({ type: 'synergy_tier2', tag: 'flame' as never })).toBe(false);
  });

  it('event_count: イベント数達成でtrue', () => {
    expect(check({ type: 'event_count', count: 10 }, { ...baseStats, totalEvents: 10 })).toBe(true);
    expect(check({ type: 'event_count', count: 10 }, { ...baseStats, totalEvents: 5 })).toBe(false);
  });

  it('challenge_clear: チャレンジ達成でtrue', () => {
    expect(check({ type: 'challenge_clear', challengeId: 'c1' }, { ...baseStats, clearedChallenges: ['c1'] })).toBe(true);
    expect(check({ type: 'challenge_clear', challengeId: 'c2' })).toBe(false);
  });

  it('no_damage_boss: 勝利かつボスダメージ0でtrue', () => {
    expect(check({ type: 'no_damage_boss' }, { ...baseStats, lastBossDamageTaken: 0 })).toBe(true);
    expect(check({ type: 'no_damage_boss' }, { ...baseStats, lastBossDamageTaken: 10 })).toBe(false);
    expect(check({ type: 'no_damage_boss' }, { ...baseStats, lastBossDamageTaken: 0 }, { ...baseRun, result: 'defeat' })).toBe(false);
  });

  it('speed_clear: 勝利かつ時間内でtrue', () => {
    expect(check({ type: 'speed_clear', maxSeconds: 300 })).toBe(true);
    expect(check({ type: 'speed_clear', maxSeconds: 100 })).toBe(false);
  });

  it('bone_hoarder: 骨合計達成でtrue', () => {
    expect(check({ type: 'bone_hoarder', amount: 100 }, { ...baseStats, totalBoneEarned: 100 })).toBe(true);
    expect(check({ type: 'bone_hoarder', amount: 200 })).toBe(false);
  });

  it('full_tree: ツリー完成率1.0でtrue', () => {
    expect(check({ type: 'full_tree' }, { ...baseStats, treeCompletionRate: 1.0 })).toBe(true);
    expect(check({ type: 'full_tree' }, { ...baseStats, treeCompletionRate: 0.9 })).toBe(false);
  });
});
