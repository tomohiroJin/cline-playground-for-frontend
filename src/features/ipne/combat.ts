/**
 * 戦闘処理
 */
import { Direction, Enemy, GameMap, Player, Position } from './types';
import { applyKnockbackToEnemy, damageEnemy, isEnemyAlive } from './enemy';
import { canPlayerAttack, damagePlayer, setAttackCooldown } from './player';
import { canMove, getEnemyAtPosition } from './collision';

const COMBAT_CONFIG = {
  playerAttackDamage: 1,
  attackCooldown: 500,
  knockbackDistance: 1,
  knockbackDuration: 200,
  invincibleDuration: 1000,
} as const;

export interface PlayerAttackResult {
  player: Player;
  enemies: Enemy[];
  attackPosition?: Position;
  didAttack: boolean;
}

const getAttackPosition = (player: Player): Position => {
  switch (player.direction) {
    case Direction.UP:
      return { x: player.x, y: player.y - 1 };
    case Direction.DOWN:
      return { x: player.x, y: player.y + 1 };
    case Direction.LEFT:
      return { x: player.x - 1, y: player.y };
    case Direction.RIGHT:
      return { x: player.x + 1, y: player.y };
    default:
      return { x: player.x, y: player.y };
  }
};

export const getAttackTarget = (player: Player, enemies: Enemy[]): Enemy | undefined => {
  const attackPos = getAttackPosition(player);
  return getEnemyAtPosition(enemies, attackPos.x, attackPos.y);
};

const applyKnockback = (
  enemy: Enemy,
  direction: Player['direction'],
  map: GameMap,
  currentTime: number
): Enemy => {
  let nextX = enemy.x;
  let nextY = enemy.y;

  switch (direction) {
    case Direction.UP:
      nextY -= COMBAT_CONFIG.knockbackDistance;
      break;
    case Direction.DOWN:
      nextY += COMBAT_CONFIG.knockbackDistance;
      break;
    case Direction.LEFT:
      nextX -= COMBAT_CONFIG.knockbackDistance;
      break;
    case Direction.RIGHT:
      nextX += COMBAT_CONFIG.knockbackDistance;
      break;
  }

  const canKnockback = canMove(map, nextX, nextY);
  const moved = canKnockback ? { ...enemy, x: nextX, y: nextY } : enemy;

  return applyKnockbackToEnemy(moved, direction, currentTime + COMBAT_CONFIG.knockbackDuration);
};

export const playerAttack = (
  player: Player,
  enemies: Enemy[],
  map: GameMap,
  currentTime: number
): PlayerAttackResult => {
  if (!canPlayerAttack(player, currentTime)) {
    return { player, enemies, didAttack: false };
  }

  const target = getAttackTarget(player, enemies);
  if (!target) {
    return {
      player: setAttackCooldown(player, currentTime, COMBAT_CONFIG.attackCooldown),
      enemies,
      didAttack: true,
      attackPosition: getAttackPosition(player),
    };
  }

  const updatedEnemies = enemies.map(enemy => {
    if (enemy.id !== target.id) return enemy;
    const damaged = damageEnemy(enemy, COMBAT_CONFIG.playerAttackDamage);
    if (!isEnemyAlive(damaged)) {
      return damaged;
    }
    return applyKnockback(damaged, player.direction, map, currentTime);
  });

  return {
    player: setAttackCooldown(player, currentTime, COMBAT_CONFIG.attackCooldown),
    enemies: updatedEnemies,
    didAttack: true,
    attackPosition: getAttackPosition(player),
  };
};

export const processEnemyContact = (
  player: Player,
  enemies: Enemy[],
  currentTime: number
): { player: Player; didDamage: boolean } => {
  const enemy = getEnemyAtPosition(enemies, player.x, player.y);
  if (!enemy) return { player, didDamage: false };

  const updatedPlayer = damagePlayer(
    player,
    enemy.damage,
    currentTime,
    COMBAT_CONFIG.invincibleDuration
  );

  return { player: updatedPlayer, didDamage: updatedPlayer !== player };
};

export const isKnockbackComplete = (enemy: Enemy, currentTime: number): boolean => {
  if (enemy.knockbackUntil === undefined) return true;
  return currentTime >= enemy.knockbackUntil;
};

export { COMBAT_CONFIG };
