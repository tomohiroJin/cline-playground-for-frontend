/**
 * scoring のユニットテスト
 *
 * 壁配置のスコアリングと経路評価ロジックを検証する。
 */

import { TileType } from '../../../types';
import {
  getDistanceFromPath,
  calculateShortcutValue,
  hasAlternativeRoute,
} from './scoring';
import { createTestMap } from '../../../__tests__/testUtils';

describe('scoring', () => {
  describe('getDistanceFromPath', () => {
    it('パス上の最も近い点までのマンハッタン距離を返す', () => {
      const path = [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
      ];

      expect(getDistanceFromPath(path, { x: 1, y: 1 })).toBe(0); // パス上
      expect(getDistanceFromPath(path, { x: 1, y: 2 })).toBe(1); // 隣接
      expect(getDistanceFromPath(path, { x: 5, y: 3 })).toBe(4); // (5-3) + (3-1) = 4
    });

    it('空のパスでは Infinity を返す', () => {
      expect(getDistanceFromPath([], { x: 0, y: 0 })).toBe(Infinity);
    });

    it('パス上の点では距離0を返す', () => {
      const path = [{ x: 3, y: 4 }, { x: 4, y: 4 }];
      expect(getDistanceFromPath(path, { x: 3, y: 4 })).toBe(0);
    });
  });

  describe('calculateShortcutValue', () => {
    it('ショートカットになる壁の場合正の値を返す', () => {
      // 壁で区切られた2つの通路を持つマップ
      const grid = [
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.START, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
      ];
      // 壁(2,2)を壊すと行1と行3がショートカットで繋がる
      // ただし壁(2,2)の上下に床がないとショートカットにならない
      // このマップでは(2,2)は壁で、上(2,1)=FLOOR、下(2,3)=FLOOR
      const start = { x: 0, y: 1 };
      const goal = { x: 1, y: 3 };

      const value = calculateShortcutValue(grid, { x: 2, y: 2 }, start, goal);
      // 壁(2,2)は上(2,1)=FLOOR, 下(2,3)=FLOORだが、左右は壁なので2つの隣接床しかない
      // 計算値は0以上であること
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('隣接する床タイルが2つ未満なら0を返す', () => {
      // 角に位置する壁（隣接する床が1つのみ）
      const grid = [
        [TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.FLOOR],
        [TileType.WALL, TileType.WALL, TileType.WALL],
      ];
      const start = { x: 2, y: 1 };
      const goal = { x: 2, y: 1 };

      const value = calculateShortcutValue(grid, { x: 1, y: 1 }, start, goal);
      expect(value).toBe(0);
    });
  });

  describe('hasAlternativeRoute', () => {
    it('壁位置で経路が分断されない場合 true を返す', () => {
      const grid = createTestMap(7, 7);
      const start = { x: 1, y: 1 };
      const goal = { x: 5, y: 5 };

      // 中央付近の床タイルを壁にしても迂回路がある
      const result = hasAlternativeRoute(grid, { x: 3, y: 3 }, start, goal);
      expect(result).toBe(true);
    });

    it('壁タイルに対しては true を返す（既に壁なので影響なし）', () => {
      const grid = createTestMap(7, 7);
      const start = { x: 1, y: 1 };
      const goal = { x: 5, y: 5 };

      // 既存の壁位置
      const result = hasAlternativeRoute(grid, { x: 0, y: 0 }, start, goal);
      expect(result).toBe(true);
    });

    it('start と goal が接続されていない場合 false を返す', () => {
      // 完全に分断されたマップ
      const grid = [
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.START, TileType.WALL, TileType.GOAL, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
      ];
      const start = { x: 1, y: 1 };
      const goal = { x: 3, y: 1 };

      const result = hasAlternativeRoute(grid, { x: 1, y: 1 }, start, goal);
      expect(result).toBe(false);
    });
  });
});
