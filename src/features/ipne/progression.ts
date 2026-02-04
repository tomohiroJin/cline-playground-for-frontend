/**
 * 成長システムモジュール
 */
import { LevelUpChoice, PlayerStats, StatType, StatTypeValue } from './types';

/** 最大レベル */
export const MAX_LEVEL = 10;

/** 各レベルに必要な累計撃破数 */
export const KILL_COUNT_TABLE: Record<number, number> = {
  1: 0,   // Lv1は初期状態
  2: 1,   // Lv2に必要な累計撃破数
  3: 3,
  4: 5,
  5: 7,
  6: 10,
  7: 13,
  8: 17,
  9: 21,
  10: 25,
};

/** 能力値の上限 */
export const STAT_LIMITS: Partial<Record<StatTypeValue, number>> = {
  [StatType.ATTACK_RANGE]: 3,
  [StatType.MOVE_SPEED]: 8,
  [StatType.ATTACK_SPEED]: 0.5,
  [StatType.HEAL_BONUS]: 5,
  // ATTACK_POWERは上限なし
};

/** レベルアップ時の選択肢 */
export const LEVEL_UP_CHOICES: LevelUpChoice[] = [
  {
    stat: StatType.ATTACK_POWER,
    increase: 1,
    description: '攻撃力 +1',
  },
  {
    stat: StatType.ATTACK_RANGE,
    increase: 1,
    description: '攻撃距離 +1（上限3）',
  },
  {
    stat: StatType.MOVE_SPEED,
    increase: 1,
    description: '移動速度 +1（上限8）',
  },
  {
    stat: StatType.ATTACK_SPEED,
    increase: -0.1,
    description: '攻撃速度 +10%（クールダウン-0.1、上限0.5）',
  },
  {
    stat: StatType.HEAL_BONUS,
    increase: 1,
    description: '回復量 +1（上限+5）',
  },
];

/**
 * レベルに必要な累計撃破数を取得
 */
export const getKillCountForLevel = (level: number): number => {
  if (level <= 1) return 0;
  if (level > MAX_LEVEL) return KILL_COUNT_TABLE[MAX_LEVEL];
  return KILL_COUNT_TABLE[level];
};

/**
 * 撃破数から現在レベルを計算
 */
export const getLevelFromKillCount = (killCount: number): number => {
  for (let level = MAX_LEVEL; level >= 1; level--) {
    if (killCount >= KILL_COUNT_TABLE[level]) {
      return level;
    }
  }
  return 1;
};

/**
 * レベルアップ可能かどうかを判定
 */
export const shouldLevelUp = (currentLevel: number, killCount: number): boolean => {
  if (currentLevel >= MAX_LEVEL) return false;
  const nextLevel = currentLevel + 1;
  return killCount >= KILL_COUNT_TABLE[nextLevel];
};

/**
 * レベルアップ選択を適用
 */
export const applyLevelUpChoice = (
  stats: PlayerStats,
  statType: StatTypeValue
): PlayerStats => {
  const choice = LEVEL_UP_CHOICES.find(c => c.stat === statType);
  if (!choice) return stats;

  const newStats = { ...stats };

  switch (statType) {
    case StatType.ATTACK_POWER:
      newStats.attackPower += choice.increase;
      break;
    case StatType.ATTACK_RANGE:
      newStats.attackRange = Math.min(
        newStats.attackRange + choice.increase,
        STAT_LIMITS[StatType.ATTACK_RANGE] ?? Infinity
      );
      break;
    case StatType.MOVE_SPEED:
      newStats.moveSpeed = Math.min(
        newStats.moveSpeed + choice.increase,
        STAT_LIMITS[StatType.MOVE_SPEED] ?? Infinity
      );
      break;
    case StatType.ATTACK_SPEED:
      newStats.attackSpeed = Math.max(
        newStats.attackSpeed + choice.increase,
        STAT_LIMITS[StatType.ATTACK_SPEED] ?? 0
      );
      break;
    case StatType.HEAL_BONUS:
      newStats.healBonus = Math.min(
        newStats.healBonus + choice.increase,
        STAT_LIMITS[StatType.HEAL_BONUS] ?? Infinity
      );
      break;
  }

  return newStats;
};

/**
 * 能力値が上限に達していないか確認
 */
export const canChooseStat = (stats: PlayerStats, statType: StatTypeValue): boolean => {
  const limit = STAT_LIMITS[statType];

  // 上限なしの能力は常に選択可能
  if (limit === undefined) return true;

  switch (statType) {
    case StatType.ATTACK_RANGE:
      return stats.attackRange < limit;
    case StatType.MOVE_SPEED:
      return stats.moveSpeed < limit;
    case StatType.ATTACK_SPEED:
      // attackSpeedは低いほど速い（上限は下限値）
      return stats.attackSpeed > limit;
    case StatType.HEAL_BONUS:
      return stats.healBonus < limit;
    default:
      return true;
  }
};

/**
 * 次レベルまでの必要撃破数を取得
 */
export const getNextKillsRequired = (currentLevel: number, killCount: number): number => {
  if (currentLevel >= MAX_LEVEL) return 0;
  const nextLevelKills = KILL_COUNT_TABLE[currentLevel + 1];
  return Math.max(0, nextLevelKills - killCount);
};
