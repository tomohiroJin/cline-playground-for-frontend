import { isGoal, findGoalPosition, findStartPosition } from '../goal';
import { TileType, GameMap } from '../types';

describe('goal', () => {
  // TileType: FLOOR=0, WALL=1, GOAL=2, START=3
  const testMap: GameMap = [
    [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
    [TileType.WALL, TileType.START, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
    [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
    [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.GOAL, TileType.WALL],
    [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
  ];

  describe('isGoal', () => {
    test('ゴール位置でtrueを返すこと', () => {
      expect(isGoal(testMap, 3, 3)).toBe(true);
    });

    test('ゴール以外の位置でfalseを返すこと', () => {
      expect(isGoal(testMap, 1, 1)).toBe(false);
      expect(isGoal(testMap, 2, 2)).toBe(false);
    });
  });

  describe('findGoalPosition', () => {
    test('ゴール位置を正しく取得できること', () => {
      const pos = findGoalPosition(testMap);
      expect(pos).toEqual({ x: 3, y: 3 });
    });

    test('ゴールがないマップではundefinedを返すこと', () => {
      const noGoalMap: GameMap = [
        [TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL],
      ];
      const pos = findGoalPosition(noGoalMap);
      expect(pos).toBeUndefined();
    });
  });

  describe('findStartPosition', () => {
    test('スタート位置を正しく取得できること', () => {
      const pos = findStartPosition(testMap);
      expect(pos).toEqual({ x: 1, y: 1 });
    });

    test('スタートがないマップではundefinedを返すこと', () => {
      const noStartMap: GameMap = [
        [TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL],
      ];
      const pos = findStartPosition(noStartMap);
      expect(pos).toBeUndefined();
    });
  });
});
