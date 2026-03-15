/**
 * プレイヤー関連の型定義
 * プレイヤー、職業、能力値、レベルアップ
 */

import type { DirectionValue } from './world';

/** 職業の種類 */
export const PlayerClass = {
  WARRIOR: 'warrior',
  THIEF: 'thief',
} as const;

export type PlayerClassValue = (typeof PlayerClass)[keyof typeof PlayerClass];

/** 可視性の種類 */
export type VisibilityType = 'none' | 'faint';

/** 職業設定 */
export interface ClassConfig {
  name: string;
  description: string;
  trapVisibility: VisibilityType;
  wallVisibility: VisibilityType;
}

/** 能力値の種類 */
export const StatType = {
  ATTACK_POWER: 'attackPower',
  ATTACK_RANGE: 'attackRange',
  MOVE_SPEED: 'moveSpeed',
  ATTACK_SPEED: 'attackSpeed',
  HEAL_BONUS: 'healBonus',
} as const;

export type StatTypeValue = (typeof StatType)[keyof typeof StatType];

/** プレイヤー能力値 */
export interface PlayerStats {
  attackPower: number;
  attackRange: number;
  moveSpeed: number;
  attackSpeed: number;
  healBonus: number;
}

/** レベルアップ選択肢 */
export interface LevelUpChoice {
  stat: StatTypeValue;
  increase: number;
  description: string;
}

/** プレイヤー状態 */
export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  direction: DirectionValue;
  isInvincible: boolean;
  invincibleUntil: number;
  attackCooldownUntil: number;
  // MVP3追加
  playerClass: PlayerClassValue;
  level: number;
  killCount: number;
  stats: PlayerStats;
  slowedUntil: number;
  // MVP6追加
  hasKey: boolean;
  /** 最後にリジェネが発動した時刻（ms） */
  lastRegenAt: number;
}
