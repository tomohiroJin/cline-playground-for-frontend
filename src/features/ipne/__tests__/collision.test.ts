import { isWall, canMove } from '../collision';
import { TileType, GameMap } from '../types';

describe('collision', () => {
  const testMap: GameMap = [
    [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
    [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
    [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
    [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
    [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
  ];

  describe('isWall', () => {
    test('壁タイルの位置でtrueを返すこと', () => {
      expect(isWall(testMap, 0, 0)).toBe(true);
      expect(isWall(testMap, 4, 4)).toBe(true);
    });

    test('床タイルの位置でfalseを返すこと', () => {
      expect(isWall(testMap, 1, 1)).toBe(false);
      expect(isWall(testMap, 2, 2)).toBe(false);
    });

    test('マップ範囲外ではtrueを返すこと', () => {
      expect(isWall(testMap, -1, 0)).toBe(true);
      expect(isWall(testMap, 0, -1)).toBe(true);
      expect(isWall(testMap, 5, 0)).toBe(true);
      expect(isWall(testMap, 0, 5)).toBe(true);
    });
  });

  describe('canMove', () => {
    test('床タイルに移動できること', () => {
      expect(canMove(testMap, 1, 1)).toBe(true);
      expect(canMove(testMap, 2, 2)).toBe(true);
    });

    test('壁タイルに移動できないこと', () => {
      expect(canMove(testMap, 0, 0)).toBe(false);
      expect(canMove(testMap, 4, 4)).toBe(false);
    });
  });
});
