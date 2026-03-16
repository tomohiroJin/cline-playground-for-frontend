/**
 * 敵管理モジュール
 */
import { DirectionValue, Enemy, EnemyState, EnemyType, EnemyTypeValue, Item, Position } from '../types';
import { createHealthSmall, createHealthLarge, createLevelUpItem, createKeyItem } from './item';
import { IdGenerator } from '../ports';
import { require as requireContract } from '../contracts';
import { GAME_BALANCE } from '../config/gameBalance';

const ENEMY_CONFIGS = {
  [EnemyType.PATROL]: GAME_BALANCE.enemy.patrol,
  [EnemyType.CHARGE]: GAME_BALANCE.enemy.charge,
  [EnemyType.RANGED]: GAME_BALANCE.enemy.ranged,
  [EnemyType.SPECIMEN]: GAME_BALANCE.enemy.specimen,
  [EnemyType.BOSS]: GAME_BALANCE.enemy.boss,
  [EnemyType.MINI_BOSS]: GAME_BALANCE.enemy.miniBoss,
  [EnemyType.MEGA_BOSS]: GAME_BALANCE.enemy.megaBoss,
} as const;

export const createEnemy = (type: EnemyTypeValue, x: number, y: number, idGenerator: IdGenerator): Enemy => {
  requireContract(x >= 0, 'x座標は0以上である必要があります');
  requireContract(y >= 0, 'y座標は0以上である必要があります');

  const config = ENEMY_CONFIGS[type];
  const homePosition: Position = { x, y };

  return {
    id: idGenerator.generateEnemyId(),
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

export const createPatrolEnemy = (x: number, y: number, idGenerator: IdGenerator): Enemy => {
  return createEnemy(EnemyType.PATROL, x, y, idGenerator);
};

export const createChargeEnemy = (x: number, y: number, idGenerator: IdGenerator): Enemy => {
  return createEnemy(EnemyType.CHARGE, x, y, idGenerator);
};

export const createRangedEnemy = (x: number, y: number, idGenerator: IdGenerator): Enemy => {
  return createEnemy(EnemyType.RANGED, x, y, idGenerator);
};

export const createSpecimenEnemy = (x: number, y: number, idGenerator: IdGenerator): Enemy => {
  return createEnemy(EnemyType.SPECIMEN, x, y, idGenerator);
};

export const createBoss = (x: number, y: number, idGenerator: IdGenerator): Enemy => {
  return createEnemy(EnemyType.BOSS, x, y, idGenerator);
};

/** ミニボスを生成する */
export const createMiniBoss = (x: number, y: number, idGenerator: IdGenerator): Enemy => {
  return createEnemy(EnemyType.MINI_BOSS, x, y, idGenerator);
};

/** メガボスを生成する */
export const createMegaBoss = (x: number, y: number, idGenerator: IdGenerator): Enemy => {
  return createEnemy(EnemyType.MEGA_BOSS, x, y, idGenerator);
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
export function shouldDropItem(enemy: Enemy, random: number): boolean {
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
export function selectDropItemType(random: number): 'health_small' | 'health_large' | 'level_up' {
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
export function createDropItem(enemy: Enemy, idGenerator: IdGenerator, itemRandom: number): Item | null {
  const itemType = selectDropItemType(itemRandom);

  switch (itemType) {
    case 'health_small':
      return createHealthSmall(enemy.x, enemy.y, idGenerator);
    case 'health_large':
      return createHealthLarge(enemy.x, enemy.y, idGenerator);
    case 'level_up':
      return createLevelUpItem(enemy.x, enemy.y, idGenerator);
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
  idGenerator: IdGenerator,
  dropRandom: number,
  itemRandom: number
): EnemyDeathResult {
  if (isEnemyAlive(enemy)) {
    return { isDead: false, droppedItem: null };
  }

  let droppedItem: Item | null = null;

  // ボスとメガボスは必ず鍵をドロップする
  if (enemy.type === EnemyType.BOSS || enemy.type === EnemyType.MEGA_BOSS) {
    droppedItem = createKeyItem(enemy.x, enemy.y, idGenerator);
  } else if (enemy.type === EnemyType.MINI_BOSS) {
    // ミニボスは大回復アイテムを確定ドロップ
    droppedItem = createHealthLarge(enemy.x, enemy.y, idGenerator);
  } else if (shouldDropItem(enemy, dropRandom)) {
    droppedItem = createDropItem(enemy, idGenerator, itemRandom);
  }

  return { isDead: true, droppedItem };
}

export { ENEMY_CONFIGS };
