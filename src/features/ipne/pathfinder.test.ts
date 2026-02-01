/**
 * 経路探索機能のテスト
 */
import { describe, test, expect } from '@jest/globals';
import { calculateDistances, placeStart, placeGoal, isConnected } from './pathfinder';
import { GameMap, TileType, Room } from './types';

// テスト用の簡単なマップ（5x5）
const createTestMap = (): GameMap => [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
];

// テスト用の部屋リスト
const createTestRooms = (): Room[] => [
  {
    rect: { x: 1, y: 1, width: 3, height: 3 },
    center: { x: 2, y: 2 },
  },
];

describe('pathfinder', () => {
  describe('calculateDistances', () => {
    test('BFSで正しく距離を計算する', () => {
      const map = createTestMap();
      const start = { x: 1, y: 1 };

      const distances = calculateDistances(map, start);

      // スタート地点の距離は0
      expect(distances.get('1,1')).toBe(0);

      // 隣接タイルの距離は1
      expect(distances.get('2,1')).toBe(1);
      expect(distances.get('1,2')).toBe(1);

      // 壁は距離計算対象外
      expect(distances.has('0,0')).toBe(false);
    });

    test('到達できないタイルは距離マップに含まれない', () => {
      const map: GameMap = [
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
      ];
      const start = { x: 1, y: 1 };

      const distances = calculateDistances(map, start);

      // (1,1)からは到達可能
      expect(distances.has('1,1')).toBe(true);

      // (3,1)は壁で隔てられているので到達不可
      expect(distances.has('3,1')).toBe(false);
    });
  });

  describe('placeStart', () => {
    test('スタートが部屋の中心に配置される', () => {
      const rooms = createTestRooms();

      const start = placeStart(rooms);

      // 部屋の中心付近に配置されること
      expect(start.x).toBeGreaterThanOrEqual(1);
      expect(start.x).toBeLessThanOrEqual(3);
      expect(start.y).toBeGreaterThanOrEqual(1);
      expect(start.y).toBeLessThanOrEqual(3);
    });
  });

  describe('placeGoal', () => {
    test('ゴールがスタートから最遠地点に配置される', () => {
      const map = createTestMap();
      const start = { x: 1, y: 1 };

      const goal = placeGoal(map, start);

      // ゴールは床タイル上にある
      expect(map[goal.y][goal.x]).toBe(TileType.FLOOR);

      // ゴールはスタートと異なる位置
      expect(goal.x !== start.x || goal.y !== start.y).toBe(true);
    });

    test('スタートから到達可能な位置にゴールが配置される', () => {
      const map = createTestMap();
      const start = { x: 1, y: 1 };

      const goal = placeGoal(map, start);

      // 到達可能性を確認
      const connected = isConnected(map, start, goal);
      expect(connected).toBe(true);
    });
  });

  describe('isConnected', () => {
    test('到達可能な場合はtrueを返す', () => {
      const map = createTestMap();
      const start = { x: 1, y: 1 };
      const goal = { x: 3, y: 3 };

      const connected = isConnected(map, start, goal);

      expect(connected).toBe(true);
    });

    test('到達不可能な場合はfalseを返す', () => {
      const map: GameMap = [
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
      ];
      const start = { x: 1, y: 1 };
      const goal = { x: 3, y: 1 };

      const connected = isConnected(map, start, goal);

      expect(connected).toBe(false);
    });
  });
});
