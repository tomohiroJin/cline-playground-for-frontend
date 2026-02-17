/**
 * 成長システムモジュール
 */
import { LevelUpChoice, Player, PlayerStats, StageRewardType, StatType, StatTypeValue } from './types';

/** 最大レベル */
export const MAX_LEVEL = 15;

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
  // 5ステージ拡張
  11: 30,
  12: 36,
  13: 43,
  14: 51,
  15: 60,
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

// ===== ステージ報酬 =====

/**
 * ステージ報酬をプレイヤーに適用する
 * @param player プレイヤー
 * @param rewardType 報酬の種類
 * @returns 報酬適用後のプレイヤー
 */
export const applyStageReward = (player: Player, rewardType: StageRewardType): Player => {
  const newPlayer = { ...player, stats: { ...player.stats } };

  switch (rewardType) {
    case 'max_hp':
      newPlayer.maxHp += 5;
      newPlayer.hp += 5;
      break;
    case 'attack_power':
      newPlayer.stats.attackPower += 1;
      break;
    case 'attack_range':
      newPlayer.stats.attackRange = Math.min(
        newPlayer.stats.attackRange + 1,
        STAT_LIMITS[StatType.ATTACK_RANGE] ?? Infinity
      );
      break;
    case 'move_speed':
      newPlayer.stats.moveSpeed = Math.min(
        newPlayer.stats.moveSpeed + 1,
        STAT_LIMITS[StatType.MOVE_SPEED] ?? Infinity
      );
      break;
    case 'attack_speed':
      newPlayer.stats.attackSpeed = Math.max(
        newPlayer.stats.attackSpeed - 0.1,
        STAT_LIMITS[StatType.ATTACK_SPEED] ?? 0
      );
      break;
    case 'heal_bonus':
      newPlayer.stats.healBonus = Math.min(
        newPlayer.stats.healBonus + 1,
        STAT_LIMITS[StatType.HEAL_BONUS] ?? Infinity
      );
      break;
  }

  return newPlayer;
};

/**
 * ステージ報酬が選択可能かどうかを判定する
 * @param player プレイヤー
 * @param rewardType 報酬の種類
 * @returns 選択可能な場合 true
 */
export const canChooseReward = (player: Player, rewardType: StageRewardType): boolean => {
  switch (rewardType) {
    case 'max_hp':
      // maxHpには上限なし
      return true;
    case 'attack_power':
      // attackPowerには上限なし
      return true;
    case 'attack_range':
      return canChooseStat(player.stats, StatType.ATTACK_RANGE);
    case 'move_speed':
      return canChooseStat(player.stats, StatType.MOVE_SPEED);
    case 'attack_speed':
      return canChooseStat(player.stats, StatType.ATTACK_SPEED);
    case 'heal_bonus':
      return canChooseStat(player.stats, StatType.HEAL_BONUS);
    default:
      return true;
  }
};

/**
 * ステージ別レベル上限でのレベルアップ可否を判定
 * @param currentLevel 現在のレベル
 * @param killCount 累計撃破数
 * @param stageMaxLevel ステージのレベル上限
 * @returns レベルアップ可能な場合 true
 */
export const shouldLevelUpInStage = (
  currentLevel: number,
  killCount: number,
  stageMaxLevel: number
): boolean => {
  if (currentLevel >= stageMaxLevel) return false;
  if (currentLevel >= MAX_LEVEL) return false;
  const nextLevel = currentLevel + 1;
  return killCount >= KILL_COUNT_TABLE[nextLevel];
};
