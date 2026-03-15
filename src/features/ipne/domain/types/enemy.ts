/**
 * 敵関連の型定義
 * 敵の種類、状態、データ構造
 */

import type { DirectionValue, Position } from './world';

/** 敵の種類 */
export const EnemyType = {
  PATROL: 'patrol',
  CHARGE: 'charge',
  RANGED: 'ranged',
  SPECIMEN: 'specimen',
  BOSS: 'boss',
  // 5ステージ制で追加
  MINI_BOSS: 'mini_boss',
  MEGA_BOSS: 'mega_boss',
} as const;

export type EnemyTypeValue = (typeof EnemyType)[keyof typeof EnemyType];

/** 敵の状態 */
export const EnemyState = {
  IDLE: 'idle',
  PATROL: 'patrol',
  CHASE: 'chase',
  ATTACK: 'attack',
  FLEE: 'flee',
  RETURN: 'return',
  KNOCKBACK: 'knockback',
} as const;

export type EnemyStateValue = (typeof EnemyState)[keyof typeof EnemyState];

/** 敵データ */
export interface Enemy {
  id: string;
  x: number;
  y: number;
  type: EnemyTypeValue;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  detectionRange: number;
  chaseRange?: number;
  attackRange: number;
  attackCooldownUntil: number;
  state: EnemyStateValue;
  patrolPath?: Position[];
  patrolIndex?: number;
  homePosition: Position;
  lastKnownPlayerPos?: Position;
  lastSeenAt?: number;
  lastMoveAt?: number;
  knockbackUntil?: number;
  knockbackDirection?: DirectionValue;
  /** 撃破アニメーション中フラグ */
  isDying?: boolean;
  /** 撃破開始時刻（ms） */
  deathStartTime?: number;
  /** 攻撃アニメーション終了時刻（ms） */
  attackAnimUntil?: number;
}
