import { isWalkable, hasLineOfSight, getEmptyCells } from '../models/maze';
import { FIXED_MAZE_9X9, FIXED_MAZE_5X5 } from '../../__tests__/helpers/fixed-maze';

describe('domain/models/maze', () => {
  describe('isWalkable', () => {
    test('通路は歩行可能', () => {
      expect(isWalkable(FIXED_MAZE_9X9, 1, 1)).toBe(true);
    });

    test('壁は歩行不可', () => {
      expect(isWalkable(FIXED_MAZE_9X9, 0, 0)).toBe(false);
    });

    test('範囲外は歩行不可', () => {
      expect(isWalkable(FIXED_MAZE_9X9, -1, -1)).toBe(false);
    });

    test('小数座標も正しく判定する', () => {
      expect(isWalkable(FIXED_MAZE_9X9, 1.5, 1.5)).toBe(true);
    });
  });

  describe('hasLineOfSight', () => {
    test('同じ位置からは視線が通る', () => {
      expect(hasLineOfSight(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 1.5)).toBe(true);
    });

    test('壁を挟んだ位置では視線が通らない', () => {
      // (1,1) と (1,3) の間に壁 (1,2) がある場合（FIXED_MAZE_9X9 に依存）
      expect(hasLineOfSight(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 3.5)).toBe(true);
    });

    test('開放空間では視線が通る', () => {
      expect(hasLineOfSight(FIXED_MAZE_5X5, 1.5, 1.5, 3.5, 3.5)).toBe(true);
    });
  });

  describe('getEmptyCells', () => {
    test('空きセルのリストを返す', () => {
      const cells = getEmptyCells(FIXED_MAZE_9X9);
      expect(cells.length).toBeGreaterThan(0);
      // 全てのセルが通路であること
      for (const cell of cells) {
        expect(FIXED_MAZE_9X9[cell.y][cell.x]).toBe(0);
      }
    });

    test('外壁のセルは含まない', () => {
      const cells = getEmptyCells(FIXED_MAZE_9X9);
      for (const cell of cells) {
        expect(cell.x).toBeGreaterThan(0);
        expect(cell.y).toBeGreaterThan(0);
        expect(cell.x).toBeLessThan(8);
        expect(cell.y).toBeLessThan(8);
      }
    });

    test('固定乱数を渡すとソート順が決定的になる', () => {
      const fixedRandom = () => 0.5;
      const cells1 = getEmptyCells(FIXED_MAZE_9X9, fixedRandom);
      const cells2 = getEmptyCells(FIXED_MAZE_9X9, fixedRandom);
      expect(cells1).toEqual(cells2);
    });
  });
});
