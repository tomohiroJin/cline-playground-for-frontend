/**
 * プレイヤー操作モジュール
 */

import {
  Player,
  GameMap,
  DirectionValue,
  Direction,
  PlayerClass,
  PlayerClassValue,
  PlayerStats,
} from './types';
import { canMove } from './collision';

/** 職業別初期能力値 */
const INITIAL_STATS: Record<PlayerClassValue, PlayerStats> = {
  [PlayerClass.WARRIOR]: {
    attackPower: 2,
    attackRange: 1,
    moveSpeed: 4,
    attackSpeed: 1.0,
    healBonus: 0,
  },
  [PlayerClass.THIEF]: {
    attackPower: 1,
    attackRange: 1,
    moveSpeed: 6,
    attackSpeed: 1.0,
    healBonus: 0,
  },
};

/**
 * プレイヤーを作成
 */
export const createPlayer = (
  x: number,
  y: number,
  playerClass: PlayerClassValue = PlayerClass.WARRIOR
): Player => {
  return {
    x,
    y,
    hp: 16,
    maxHp: 16,
    direction: Direction.DOWN,
    isInvincible: false,
    invincibleUntil: 0,
    attackCooldownUntil: 0,
    // MVP3追加
    playerClass,
    level: 1,
    killCount: 0,
    stats: { ...INITIAL_STATS[playerClass] },
    slowedUntil: 0,
  };
};

/**
 * プレイヤーを指定方向に移動
 * 移動先が壁の場合は移動しない
 */
export const movePlayer = (
  player: Player,
  direction: DirectionValue,
  map: GameMap
): Player => {
  let newX = player.x;
  let newY = player.y;

  switch (direction) {
    case Direction.UP:
      newY = player.y - 1;
      break;
    case Direction.DOWN:
      newY = player.y + 1;
      break;
    case Direction.LEFT:
      newX = player.x - 1;
      break;
    case Direction.RIGHT:
      newX = player.x + 1;
      break;
  }

  // 移動可能な場合のみ新しい位置を返す
  if (canMove(map, newX, newY)) {
    return { ...player, x: newX, y: newY, direction };
  }

  // 移動不可の場合は向きだけ更新する
  return { ...player, direction };
};

/** 向きを更新 */
export const updatePlayerDirection = (player: Player, direction: DirectionValue): Player => {
  return { ...player, direction };
};

/** ダメージ処理 */
export const damagePlayer = (
  player: Player,
  damage: number,
  currentTime: number,
  invincibleDuration: number
): Player => {
  if (damage <= 0) return player;
  if (isPlayerInvincible(player, currentTime)) return player;

  const newHp = Math.max(0, player.hp - damage);
  return {
    ...player,
    hp: newHp,
    isInvincible: true,
    invincibleUntil: currentTime + invincibleDuration,
  };
};

/** 回復処理 */
export const healPlayer = (player: Player, healAmount: number): Player => {
  if (healAmount <= 0) return player;
  return {
    ...player,
    hp: Math.min(player.maxHp, player.hp + healAmount),
  };
};

/** 無敵判定 */
export const isPlayerInvincible = (player: Player, currentTime: number): boolean => {
  return player.isInvincible && currentTime < player.invincibleUntil;
};

/** 攻撃可能か判定 */
export const canPlayerAttack = (player: Player, currentTime: number): boolean => {
  return currentTime >= player.attackCooldownUntil;
};

/** 攻撃クールダウン設定 */
export const setAttackCooldown = (player: Player, currentTime: number, cooldown: number): Player => {
  return { ...player, attackCooldownUntil: currentTime + cooldown };
};
