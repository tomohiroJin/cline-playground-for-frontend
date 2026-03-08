/**
 * 実績チェッカー定義
 *
 * 各チェッカーは AchievementChecker インターフェースを実装し、
 * 特定の実績条件タイプに対する判定ロジックを提供する。
 * 新しい条件タイプは、チェッカーを追加してレジストリに登録するだけで拡張可能。
 */
import type { AchievementChecker } from '../achievement-checker';
import type { AchievementCondition, AggregateStats, RunStats } from '../../../types';
import { SYNERGY_BONUSES, DIFFS } from '../../../constants';

/** 難易度の総数 */
const TOTAL_DIFFICULTY_COUNT = DIFFS.length;
/** 覚醒タイプの総数（tech, life, rit, bal） */
const TOTAL_AWAKENING_COUNT = 4;
/** ツリー完成率の閾値 */
const TREE_COMPLETION_THRESHOLD = 1.0;

export const firstClearChecker: AchievementChecker = {
  check(_c: AchievementCondition, _s: AggregateStats, run: RunStats) {
    return run.result === 'victory';
  },
};

export const clearCountChecker: AchievementChecker = {
  check(c: AchievementCondition, stats: AggregateStats) {
    return c.type === 'clear_count' && stats.totalClears >= c.count;
  },
};

export const clearDifficultyChecker: AchievementChecker = {
  check(c: AchievementCondition, stats: AggregateStats) {
    return c.type === 'clear_difficulty' && stats.clearedDifficulties.includes(c.difficulty);
  },
};

export const allDifficultiesClearedChecker: AchievementChecker = {
  check(_c: AchievementCondition, stats: AggregateStats) {
    return stats.clearedDifficulties.length >= TOTAL_DIFFICULTY_COUNT;
  },
};

export const allAwakeningsChecker: AchievementChecker = {
  check(_c: AchievementCondition, stats: AggregateStats) {
    return stats.achievedAwakenings.length >= TOTAL_AWAKENING_COUNT;
  },
};

export const maxDamageChecker: AchievementChecker = {
  check(c: AchievementCondition, _s: AggregateStats, run: RunStats) {
    return c.type === 'max_damage' && run.maxDamage >= c.threshold;
  },
};

export const totalKillsChecker: AchievementChecker = {
  check(c: AchievementCondition, stats: AggregateStats) {
    return c.type === 'total_kills' && stats.totalKills >= c.count;
  },
};

export const synergyTier2Checker: AchievementChecker = {
  check(c: AchievementCondition, stats: AggregateStats) {
    return c.type === 'synergy_tier2' && stats.achievedSynergiesTier2.includes(c.tag);
  },
};

export const allSynergiesTier1Checker: AchievementChecker = {
  check(_c: AchievementCondition, stats: AggregateStats) {
    return stats.achievedSynergiesTier1.length >= SYNERGY_BONUSES.length;
  },
};

export const eventCountChecker: AchievementChecker = {
  check(c: AchievementCondition, stats: AggregateStats) {
    return c.type === 'event_count' && stats.totalEvents >= c.count;
  },
};

export const challengeClearChecker: AchievementChecker = {
  check(c: AchievementCondition, stats: AggregateStats) {
    return c.type === 'challenge_clear' && stats.clearedChallenges.includes(c.challengeId);
  },
};

export const noDamageBossChecker: AchievementChecker = {
  check(_c: AchievementCondition, stats: AggregateStats, run: RunStats) {
    return run.result === 'victory' && stats.lastBossDamageTaken === 0;
  },
};

export const speedClearChecker: AchievementChecker = {
  check(c: AchievementCondition, _s: AggregateStats, run: RunStats) {
    return c.type === 'speed_clear' && run.result === 'victory' && run.playtimeSeconds <= c.maxSeconds;
  },
};

export const boneHoarderChecker: AchievementChecker = {
  check(c: AchievementCondition, stats: AggregateStats) {
    return c.type === 'bone_hoarder' && stats.totalBoneEarned >= c.amount;
  },
};

export const fullTreeChecker: AchievementChecker = {
  check(_c: AchievementCondition, stats: AggregateStats) {
    return stats.treeCompletionRate >= TREE_COMPLETION_THRESHOLD;
  },
};
