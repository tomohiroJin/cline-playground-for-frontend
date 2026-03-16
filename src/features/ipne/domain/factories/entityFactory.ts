/**
 * 統一エンティティファクトリ
 *
 * 各エンティティの生成を統一インターフェースで提供する。
 * 個別の createXxx 関数に委譲することで、既存の振る舞いを維持する。
 */
import { EnemyTypeValue, TrapTypeValue, WallTypeValue, WallStateValue, ItemTypeValue } from '../types';
import { Enemy, Trap, Wall, Item } from '../types';
import { IdGenerator } from '../ports';
import { createEnemy } from '../entities/enemy';
import { createTrap } from '../entities/trap';
import { createWall } from '../entities/wall';
import { createItem } from '../entities/item';
export const EntityFactory = {
  /** 敵を生成する */
  createEnemy: (type: EnemyTypeValue, x: number, y: number, idGenerator: IdGenerator): Enemy =>
    createEnemy(type, x, y, idGenerator),

  /** 罠を生成する */
  createTrap: (type: TrapTypeValue, x: number, y: number, idGenerator: IdGenerator): Trap =>
    createTrap(type, x, y, idGenerator),

  /** 壁を生成する */
  createWall: (type: WallTypeValue, x: number, y: number, state?: WallStateValue): Wall =>
    createWall(type, x, y, state),

  /** アイテムを生成する */
  createItem: (type: ItemTypeValue, x: number, y: number, idGenerator: IdGenerator): Item =>
    createItem(type, x, y, idGenerator),
} as const;
