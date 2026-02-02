/**
 * テスト用ユーティリティ
 */
import {
  GameMap,
  TileType,
  Player,
  Enemy,
  Item,
  EnemyType,
  ItemType,
} from '../types';
import { createPlayer } from '../player';
import { createEnemy } from '../enemy';
import { createItem } from '../item';

/**
 * テスト用マップを生成
 */
export const createTestMap = (width = 7, height = 7): GameMap => {
  const map: GameMap = Array.from({ length: height }, () => Array(width).fill(TileType.WALL));

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      map[y][x] = TileType.FLOOR;
    }
  }

  map[1][1] = TileType.START;
  map[height - 2][width - 2] = TileType.GOAL;

  return map;
};

/**
 * テスト用プレイヤーを生成
 */
export const createTestPlayer = (x = 1, y = 1): Player => {
  return createPlayer(x, y);
};

describe('testUtils', () => {
  test('createTestMap が床とスタート/ゴールを含むこと', () => {
    const map = createTestMap(5, 5);
    expect(map[1][1]).toBe(TileType.START);
    expect(map[3][3]).toBe(TileType.GOAL);
    expect(map[2][2]).toBe(TileType.FLOOR);
  });
});

/**
 * テスト用敵を生成
 */
export const createTestEnemy = (
  type: (typeof EnemyType)[keyof typeof EnemyType] = EnemyType.PATROL,
  x = 2,
  y = 2
): Enemy => {
  return createEnemy(type, x, y);
};

/**
 * テスト用アイテムを生成
 */
export const createTestItem = (
  type: (typeof ItemType)[keyof typeof ItemType] = ItemType.HEALTH_SMALL,
  x = 3,
  y = 3
): Item => {
  return createItem(type, x, y);
};
