import { bfsPath } from '../services/pathfinding';
import { FIXED_MAZE_9X9, FIXED_MAZE_5X5 } from '../../__tests__/helpers/fixed-maze';

describe('domain/services/pathfinding', () => {
  describe('bfsPath', () => {
    test('同じ位置へのパスは空配列を返す', () => {
      const path = bfsPath(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 1.5);
      expect(path).toEqual([]);
    });

    test('隣接セルへのパスを正しく計算する', () => {
      // (1,1) → (2,1)：FIXED_MAZE_9X9 では隣接通路
      const path = bfsPath(FIXED_MAZE_9X9, 1.5, 1.5, 2.5, 1.5);
      expect(path.length).toBeGreaterThan(0);
      // パスの最後は目標位置
      expect(path[path.length - 1].x).toBe(2.5);
      expect(path[path.length - 1].y).toBe(1.5);
    });

    test('パスの各ポイントは通路上にある', () => {
      const path = bfsPath(FIXED_MAZE_9X9, 1.5, 1.5, 7.5, 7.5);
      for (const point of path) {
        const gridX = Math.floor(point.x);
        const gridY = Math.floor(point.y);
        expect(FIXED_MAZE_9X9[gridY][gridX]).toBe(0);
      }
    });

    test('開放空間では最短経路を返す', () => {
      // 5x5 開放空間で (1,1) → (3,3)
      const path = bfsPath(FIXED_MAZE_5X5, 1.5, 1.5, 3.5, 3.5);
      expect(path.length).toBeGreaterThan(0);
      // マンハッタン距離は 4 なのでパス長は 4 以下
      expect(path.length).toBeLessThanOrEqual(4);
    });

    test('到達不能な場合は空配列を返す', () => {
      // 壁で完全に分断された迷路
      const blockedMaze = [
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
      ];
      const path = bfsPath(blockedMaze, 1.5, 1.5, 3.5, 3.5);
      expect(path).toEqual([]);
    });
  });
});
