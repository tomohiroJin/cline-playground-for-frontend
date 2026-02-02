/**
 * 敵管理モジュール
 */
import { DirectionValue, Enemy, EnemyState, EnemyType, EnemyTypeValue, Position } from './types';

const ENEMY_CONFIGS = {
  [EnemyType.PATROL]: {
    hp: 3,
    damage: 1,
    speed: 2,
    detectionRange: 5,
    chaseRange: 8,
    attackRange: 3,
  },
  [EnemyType.CHARGE]: {
    hp: 2,
    damage: 2,
    speed: 5,
    detectionRange: 6,
    chaseRange: 10,
    attackRange: 1,
  },
  [EnemyType.RANGED]: {
    hp: 2,
    damage: 1,
    speed: 3,
    detectionRange: 7,
    chaseRange: 10,
    attackRange: 4,
  },
  [EnemyType.SPECIMEN]: {
    hp: 1,
    damage: 0,
    speed: 6,
    detectionRange: 4,
    chaseRange: undefined,
    attackRange: 0,
  },
  [EnemyType.BOSS]: {
    hp: 12,
    damage: 4,
    speed: 5,
    detectionRange: 8,
    chaseRange: 15,
    attackRange: 3,
  },
} as const;

let enemyIdCounter = 0;

export const generateEnemyId = (): string => {
  enemyIdCounter += 1;
  return `enemy-${enemyIdCounter}`;
};

export const resetEnemyIdCounter = (): void => {
  enemyIdCounter = 0;
};

export const createEnemy = (type: EnemyTypeValue, x: number, y: number): Enemy => {
  const config = ENEMY_CONFIGS[type];
  const homePosition: Position = { x, y };

  return {
    id: generateEnemyId(),
    x,
    y,
    type,
    hp: config.hp,
    maxHp: config.hp,
    damage: config.damage,
    speed: config.speed,
    detectionRange: config.detectionRange,
    chaseRange: config.chaseRange,
    attackRange: config.attackRange,
    attackCooldownUntil: 0,
    lastMoveAt: 0,
    state: type === EnemyType.PATROL ? EnemyState.PATROL : EnemyState.IDLE,
    homePosition,
    patrolPath: undefined,
    patrolIndex: 0,
  };
};

export const createPatrolEnemy = (x: number, y: number): Enemy => {
  return createEnemy(EnemyType.PATROL, x, y);
};

export const createChargeEnemy = (x: number, y: number): Enemy => {
  return createEnemy(EnemyType.CHARGE, x, y);
};

export const createSpecimenEnemy = (x: number, y: number): Enemy => {
  return createEnemy(EnemyType.SPECIMEN, x, y);
};

export const createBoss = (x: number, y: number): Enemy => {
  return createEnemy(EnemyType.BOSS, x, y);
};

export const isEnemyAlive = (enemy: Enemy): boolean => {
  return enemy.hp > 0;
};

export const damageEnemy = (enemy: Enemy, damage: number): Enemy => {
  if (damage <= 0) return enemy;
  return { ...enemy, hp: Math.max(0, enemy.hp - damage) };
};

export const applyKnockbackToEnemy = (
  enemy: Enemy,
  direction: DirectionValue,
  knockbackUntil: number
): Enemy => {
  return {
    ...enemy,
    state: EnemyState.KNOCKBACK,
    knockbackUntil,
    knockbackDirection: direction,
  };
};

export { ENEMY_CONFIGS };
