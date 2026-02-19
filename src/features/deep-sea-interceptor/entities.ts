// ============================================================================
// Deep Sea Interceptor - エンティティ生成
// ============================================================================

import { randomRange, randomInt as baseRandomInt } from '../../utils/math-utils';
import { Config, EnemyConfig, ItemConfig } from './constants';
import type { Bullet, Enemy, EnemyBullet, Item, Particle, Bubble, Position, ItemType, WeaponType, EnemyType } from './types';

// ユニークID生成
const uniqueId = (() => {
  let id = 0;
  return () => ++id + Math.random();
})();

/** ユニークID生成器をリセット（テスト用） */
export const resetIdCounter = () => {
  // テスト用にはリセット不要（Math.randomで一意性を保証）
};

/** 配列からランダムに要素を選択 */
export function randomChoice<T>(arr: T[]): T {
  return arr[baseRandomInt(0, arr.length - 1)];
}

/** ボス判定（boss, boss1〜boss5） */
export const isBoss = (e: { enemyType: EnemyType }): boolean =>
  e.enemyType === 'boss' || (e.enemyType.startsWith('boss') && !e.enemyType.startsWith('midboss'));

/** ミッドボス判定（midboss1〜midboss5） */
export const isMidboss = (e: { enemyType: EnemyType }): boolean =>
  e.enemyType.startsWith('midboss');

/** エンティティファクトリ */
export const EntityFactory = {
  /** プレイヤー弾の生成 */
  bullet: (
    x: number,
    y: number,
    {
      charged = false,
      angle = -Math.PI / 2,
      weaponType = 'torpedo' as WeaponType,
      damage: dmgOverride,
      speed: spdOverride,
      size: sizeOverride,
      piercing = false,
      homing = false,
      lifespan,
    }: {
      charged?: boolean;
      angle?: number;
      weaponType?: WeaponType;
      damage?: number;
      speed?: number;
      size?: number;
      piercing?: boolean;
      homing?: boolean;
      lifespan?: number;
    } = {}
  ): Bullet => {
    const cfg = Config.bullet;
    return {
      id: uniqueId(),
      x,
      y,
      createdAt: Date.now(),
      type: 'bullet',
      weaponType,
      charged,
      angle,
      speed: spdOverride ?? (charged ? cfg.chargedSpeed : cfg.speed),
      damage: dmgOverride ?? (charged ? cfg.chargedDamage : 1),
      size: sizeOverride ?? (charged ? cfg.chargedSize : cfg.size),
      piercing: piercing || (charged && weaponType === 'torpedo'),
      homing,
      lifespan,
    };
  },

  /** 敵キャラクターの生成 */
  enemy: (type: string, x: number, y: number, stage = 1): Enemy => {
    const cfg = EnemyConfig[type];
    if (!cfg) throw new Error(`Invalid enemy type: ${type}`);
    const boss = type === 'boss' || (type.startsWith('boss') && !type.startsWith('midboss'));
    const hp = boss ? cfg.hp + stage * 15 : cfg.hp;
    return {
      id: uniqueId(),
      x,
      y,
      createdAt: Date.now(),
      type: 'enemy',
      enemyType: type as import('./types').EnemyType,
      hp,
      maxHp: hp,
      speed: cfg.speed,
      points: cfg.points,
      size: Config.enemy.baseSize * cfg.sizeRatio,
      canShoot: cfg.canShoot,
      fireRate: cfg.fireRate,
      lastShotAt: 0,
      movementPattern: baseRandomInt(0, 2),
      angle: 0,
      bossPhase: boss ? 1 : 0,
    };
  },

  /** 敵弾の生成 */
  enemyBullet: (x: number, y: number, velocity: Position): EnemyBullet => ({
    id: uniqueId(),
    x,
    y,
    createdAt: Date.now(),
    type: 'enemyBullet',
    vx: velocity.x,
    vy: velocity.y,
    size: 8,
  }),

  /** アイテムの生成 */
  item: (x: number, y: number, itemType: ItemType): Item => ({
    id: uniqueId(),
    x,
    y,
    createdAt: Date.now(),
    type: 'item',
    itemType,
    size: 24,
    speed: 1.5,
  }),

  /** パーティクルの生成 */
  particle: (
    x: number,
    y: number,
    {
      color,
      life = 15,
      velocity = null,
    }: { color: string; life?: number; velocity?: Position | null } = { color: '#fff' }
  ): Particle => ({
    id: uniqueId(),
    x,
    y,
    createdAt: Date.now(),
    type: 'particle',
    color,
    vx: velocity?.x ?? randomRange(-3, 3),
    vy: velocity?.y ?? randomRange(-3, 3),
    life,
    maxLife: life,
    size: randomRange(2, 5),
  }),

  /** 泡の生成 */
  bubble: (): Bubble => ({
    id: uniqueId(),
    x: randomRange(0, Config.canvas.width),
    y: Config.canvas.height + 5,
    createdAt: Date.now(),
    size: randomRange(2, 7),
    speed: randomRange(0.3, 0.9),
    opacity: randomRange(0.1, 0.3),
  }),
};
