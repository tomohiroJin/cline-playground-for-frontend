/**
 * 敵管理モジュール
 */
import { DirectionValue, Enemy, EnemyState, EnemyType, EnemyTypeValue, Item, Position } from './types';
import { createHealthSmall, createHealthLarge, createLevelUpItem, createKeyItem } from './item';

const ENEMY_CONFIGS = {
  [EnemyType.PATROL]: {
    hp: 4,
    damage: 1,
    speed: 2,
    detectionRange: 5,
    chaseRange: 8,
    attackRange: 3,
  },
  [EnemyType.CHARGE]: {
    hp: 3,
    damage: 2,
    speed: 5,
    detectionRange: 6,
    chaseRange: 10,
    attackRange: 1,
  },
  [EnemyType.RANGED]: {
    hp: 3,
    damage: 1,
    speed: 1.5,
    detectionRange: 7,
    chaseRange: 10,
    attackRange: 4,
  },
  [EnemyType.SPECIMEN]: {
    hp: 1,
    damage: 0,
    speed: 4,
    detectionRange: 4,
    chaseRange: undefined,
    attackRange: 0,
  },
  [EnemyType.BOSS]: {
    hp: 35,
    damage: 4,
    speed: 1.5,
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

export const createRangedEnemy = (x: number, y: number): Enemy => {
  return createEnemy(EnemyType.RANGED, x, y);
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

// ===== MVP4 SPECIMENドロップ機能 =====

/** SPECIMENのアイテムドロップ率 */
export const SPECIMEN_DROP_RATE = 0.3;

/** ドロップアイテムの種類と重み */
export const DROP_ITEM_WEIGHTS = {
  HEALTH_SMALL: 50,
  HEALTH_LARGE: 30,
  LEVEL_UP: 20,
} as const;

/**
 * アイテムをドロップするかどうかを判定する
 * @param enemy 敵
 * @param random 乱数（0.0〜1.0）- テスト用にオプショナル
 * @returns ドロップする場合true
 */
export function shouldDropItem(enemy: Enemy, random: number = Math.random()): boolean {
  // SPECIMENのみドロップ
  if (enemy.type !== EnemyType.SPECIMEN) {
    return false;
  }
  return random < SPECIMEN_DROP_RATE;
}

/**
 * ドロップするアイテムの種類を決定する
 * @param random 乱数（0.0〜1.0）- テスト用にオプショナル
 * @returns アイテムタイプ
 */
export function selectDropItemType(random: number = Math.random()): 'health_small' | 'health_large' | 'level_up' {
  const totalWeight =
    DROP_ITEM_WEIGHTS.HEALTH_SMALL + DROP_ITEM_WEIGHTS.HEALTH_LARGE + DROP_ITEM_WEIGHTS.LEVEL_UP;
  const roll = random * totalWeight;

  if (roll < DROP_ITEM_WEIGHTS.HEALTH_SMALL) {
    return 'health_small';
  }
  if (roll < DROP_ITEM_WEIGHTS.HEALTH_SMALL + DROP_ITEM_WEIGHTS.HEALTH_LARGE) {
    return 'health_large';
  }
  return 'level_up';
}

/**
 * 敵の位置にドロップアイテムを作成する
 * @param enemy 敵
 * @param itemRandom アイテム種類の乱数
 * @returns 作成されたアイテム、またはnull
 */
export function createDropItem(enemy: Enemy, itemRandom: number = Math.random()): Item | null {
  const itemType = selectDropItemType(itemRandom);

  switch (itemType) {
    case 'health_small':
      return createHealthSmall(enemy.x, enemy.y);
    case 'health_large':
      return createHealthLarge(enemy.x, enemy.y);
    case 'level_up':
      return createLevelUpItem(enemy.x, enemy.y);
    default:
      return null;
  }
}

/** 敵死亡処理の結果 */
export interface EnemyDeathResult {
  /** 敵が死亡したか */
  isDead: boolean;
  /** ドロップしたアイテム（ない場合はnull） */
  droppedItem: Item | null;
}

/**
 * 敵の死亡を処理する
 * @param enemy 敵
 * @param dropRandom ドロップ判定用乱数
 * @param itemRandom アイテム種類判定用乱数
 * @returns 処理結果
 */
export function processEnemyDeath(
  enemy: Enemy,
  dropRandom: number = Math.random(),
  itemRandom: number = Math.random()
): EnemyDeathResult {
  if (isEnemyAlive(enemy)) {
    return { isDead: false, droppedItem: null };
  }

  let droppedItem: Item | null = null;

  // ボスは必ず鍵をドロップする
  if (enemy.type === EnemyType.BOSS) {
    droppedItem = createKeyItem(enemy.x, enemy.y);
  } else if (shouldDropItem(enemy, dropRandom)) {
    droppedItem = createDropItem(enemy, itemRandom);
  }

  return { isDead: true, droppedItem };
}

export { ENEMY_CONFIGS };
