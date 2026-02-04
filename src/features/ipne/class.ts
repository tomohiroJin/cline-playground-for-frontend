/**
 * 職業システムモジュール
 */
import {
  ClassConfig,
  PlayerClass,
  PlayerClassValue,
  TrapState,
  TrapStateValue,
  WallState,
  WallStateValue,
  WallType,
  WallTypeValue,
} from './types';

/** 職業設定 */
export const CLASS_CONFIGS: Record<PlayerClassValue, ClassConfig> = {
  [PlayerClass.WARRIOR]: {
    name: '戦士',
    description: '攻撃力が高く、ぶつかって進むプレイスタイル。罠・特殊壁は触れるか攻撃して初めて判明。',
    trapVisibility: 'none',
    wallVisibility: 'none',
  },
  [PlayerClass.THIEF]: {
    name: '盗賊',
    description: '移動速度が高く、避けて進むプレイスタイル。罠・特殊壁が常時うっすら見える。',
    trapVisibility: 'faint',
    wallVisibility: 'faint',
  },
};

/**
 * 職業に応じた設定を取得
 */
export const getClassConfig = (playerClass: PlayerClassValue): ClassConfig => {
  return CLASS_CONFIGS[playerClass];
};

/**
 * 罠が見えるかどうかを判定
 */
export const canSeeTrap = (
  playerClass: PlayerClassValue,
  trapState: TrapStateValue
): boolean => {
  // 発見済みまたは発動済みなら誰でも見える
  if (trapState === TrapState.REVEALED || trapState === TrapState.TRIGGERED) {
    return true;
  }

  // 未発見の場合、盗賊のみ見える
  const config = CLASS_CONFIGS[playerClass];
  return config.trapVisibility === 'faint';
};

/**
 * 特殊壁が見えるかどうかを判定
 */
export const canSeeSpecialWall = (
  playerClass: PlayerClassValue,
  wallType: WallTypeValue,
  wallState: WallStateValue
): boolean => {
  // 通常壁は常に見える
  if (wallType === WallType.NORMAL) {
    return true;
  }

  // 発見済み、損傷、破壊済みなら誰でも見える
  if (
    wallState === WallState.REVEALED ||
    wallState === WallState.DAMAGED ||
    wallState === WallState.BROKEN
  ) {
    return true;
  }

  // 未発見の特殊壁は、盗賊のみ見える
  const config = CLASS_CONFIGS[playerClass];
  return config.wallVisibility === 'faint';
};

/**
 * 罠の透明度を取得
 */
export const getTrapAlpha = (
  playerClass: PlayerClassValue,
  trapState: TrapStateValue
): number => {
  // 発見済みまたは発動済みなら完全に見える
  if (trapState === TrapState.REVEALED || trapState === TrapState.TRIGGERED) {
    return 1;
  }

  // 未発見の場合
  const config = CLASS_CONFIGS[playerClass];
  if (config.trapVisibility === 'faint') {
    return 0.3;
  }
  return 0;
};

/**
 * 特殊壁の透明度を取得
 */
export const getWallAlpha = (
  playerClass: PlayerClassValue,
  wallType: WallTypeValue,
  wallState: WallStateValue
): number => {
  // 通常壁は常に完全に見える
  if (wallType === WallType.NORMAL) {
    return 1;
  }

  // 発見済み、損傷、破壊済みなら完全に見える
  if (
    wallState === WallState.REVEALED ||
    wallState === WallState.DAMAGED ||
    wallState === WallState.BROKEN
  ) {
    return 1;
  }

  // 未発見の特殊壁
  const config = CLASS_CONFIGS[playerClass];
  if (config.wallVisibility === 'faint') {
    return 0.3;
  }
  return 0;
};
