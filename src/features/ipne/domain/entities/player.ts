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
  StatTypeValue,
  Wall,
} from '../types';
import { canMove } from '../services/collisionService';
import { shouldLevelUp, applyLevelUpChoice } from '../services/progressionService';
import { GAME_BALANCE } from '../config/gameBalance';
import { ensure } from '../contracts';

/** 職業別初期能力値 */
const INITIAL_STATS: Record<PlayerClassValue, PlayerStats> = {
  [PlayerClass.WARRIOR]: {
    attackPower: GAME_BALANCE.player.warrior.attackPower,
    attackRange: GAME_BALANCE.player.warrior.attackRange,
    moveSpeed: GAME_BALANCE.player.warrior.moveSpeed,
    attackSpeed: GAME_BALANCE.player.warrior.attackSpeed,
    healBonus: GAME_BALANCE.player.warrior.healBonus,
  },
  [PlayerClass.THIEF]: {
    attackPower: GAME_BALANCE.player.thief.attackPower,
    attackRange: GAME_BALANCE.player.thief.attackRange,
    moveSpeed: GAME_BALANCE.player.thief.moveSpeed,
    attackSpeed: GAME_BALANCE.player.thief.attackSpeed,
    healBonus: GAME_BALANCE.player.thief.healBonus,
  },
};

/** 職業別初期HP */
const INITIAL_HP: Record<PlayerClassValue, number> = {
  [PlayerClass.WARRIOR]: GAME_BALANCE.player.warrior.initialHp,
  [PlayerClass.THIEF]: GAME_BALANCE.player.thief.initialHp,
};

/**
 * プレイヤーを作成
 */
export const createPlayer = (
  x: number,
  y: number,
  playerClass: PlayerClassValue = PlayerClass.WARRIOR
): Player => {
  const initialHp = INITIAL_HP[playerClass];
  return {
    x,
    y,
    hp: initialHp,
    maxHp: initialHp,
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
    // MVP6追加
    hasKey: false,
    lastRegenAt: 0,
  };
};

/**
 * プレイヤーを指定方向に移動
 * 移動先が壁の場合は移動しない
 * 特殊壁（破壊済み、すり抜け可能）は通過可能
 */
export const movePlayer = (
  player: Player,
  direction: DirectionValue,
  map: GameMap,
  walls?: Wall[]
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

  // 移動可能な場合のみ新しい位置を返す（特殊壁も考慮）
  if (canMove(map, newX, newY, walls)) {
    return { ...player, x: newX, y: newY, direction };
  }

  // 移動不可の場合は向きだけ更新する
  return { ...player, direction };
};

/** 向きを更新 */
export const updatePlayerDirection = (player: Player, direction: DirectionValue): Player => {
  return { ...player, direction };
};

/** ダメージ処理結果（参照同等性に依存しない明示的な結果型） */
export interface DamageResult {
  player: Player;
  tookDamage: boolean;
  actualDamage: number;
}

/** ダメージ処理 */
export const damagePlayer = (
  player: Player,
  damage: number,
  currentTime: number,
  invincibleDuration: number
): DamageResult => {
  if (damage <= 0) return { player, tookDamage: false, actualDamage: 0 };
  if (isPlayerInvincible(player, currentTime)) return { player, tookDamage: false, actualDamage: 0 };

  const actualDamage = Math.min(damage, player.hp);
  const newHp = Math.max(0, player.hp - damage);

  ensure(newHp >= 0, 'ダメージ後のHPは0以上である必要があります');
  ensure(newHp <= player.maxHp, 'ダメージ後のHPはmaxHPを超えてはなりません');

  return {
    player: {
      ...player,
      hp: newHp,
      isInvincible: true,
      invincibleUntil: currentTime + invincibleDuration,
    },
    tookDamage: true,
    actualDamage,
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

// ===== MVP3 追加関数 =====

/** 撃破数増加結果 */
export interface KillCountResult {
  player: Player;
  shouldLevelUp: boolean;
}

/**
 * 撃破数をインクリメント
 */
export const incrementKillCount = (player: Player): KillCountResult => {
  const newKillCount = player.killCount + 1;
  const newPlayer = { ...player, killCount: newKillCount };
  const canLevelUp = shouldLevelUp(player.level, newKillCount);
  return {
    player: newPlayer,
    shouldLevelUp: canLevelUp,
  };
};

/**
 * レベルアップ処理
 */
export const processLevelUp = (player: Player, statChoice: StatTypeValue): Player => {
  const newStats = applyLevelUpChoice(player.stats, statChoice);
  return {
    ...player,
    level: player.level + 1,
    stats: newStats,
  };
};

/**
 * 実効移動速度を取得（速度低下状態を考慮）
 */
export const getEffectiveMoveSpeed = (player: Player, currentTime: number): number => {
  const baseSpeed = player.stats.moveSpeed;
  if (isSlowed(player, currentTime)) {
    return baseSpeed * GAME_BALANCE.movement.slowedSpeedMultiplier;
  }
  return baseSpeed;
};

/**
 * 実効攻撃クールダウンを取得（attackSpeedを考慮）
 */
export const getEffectiveAttackCooldown = (player: Player, baseCooldown: number): number => {
  return baseCooldown * player.stats.attackSpeed;
};

/**
 * 実効回復量を取得（healBonusを考慮）
 */
export const getEffectiveHeal = (player: Player, baseHeal: number): number => {
  return baseHeal + player.stats.healBonus;
};

/**
 * 速度低下効果を適用
 */
export const applySlowEffect = (player: Player, currentTime: number, duration: number): Player => {
  return {
    ...player,
    slowedUntil: currentTime + duration,
  };
};

/**
 * 速度低下状態かどうかを判定
 */
export const isSlowed = (player: Player, currentTime: number): boolean => {
  return currentTime < player.slowedUntil;
};
