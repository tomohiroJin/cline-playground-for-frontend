// 数学ユーティリティ関数のテスト

import {
  clamp,
  normalizeAngle,
  distance,
  randomInt,
  randomRange,
  formatTime,
  safeIndex,
  min,
} from '../../../domain/shared/math-utils';

describe('math-utils', () => {
  describe('clamp', () => {
    it('範囲内の値はそのまま返す', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('最小値より小さい場合は最小値を返す', () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });

    it('最大値より大きい場合は最大値を返す', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('NaN の場合は最小値を返す', () => {
      expect(clamp(NaN, 0, 10)).toBe(0);
    });

    it('境界値は正しく返す', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('normalizeAngle', () => {
    it('0 はそのまま返す', () => {
      expect(normalizeAngle(0)).toBe(0);
    });

    it('2π を超える角度を正規化する', () => {
      expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 5);
    });

    it('負の角度を正規化する', () => {
      expect(normalizeAngle(-Math.PI * 3)).toBeCloseTo(-Math.PI, 5);
    });

    it('結果は [-π, π] の範囲内', () => {
      for (let i = -10; i <= 10; i++) {
        const result = normalizeAngle(i);
        expect(result).toBeGreaterThanOrEqual(-Math.PI);
        expect(result).toBeLessThanOrEqual(Math.PI);
      }
    });
  });

  describe('distance', () => {
    it('2 点間の距離を計算する', () => {
      expect(distance(0, 0, 3, 4)).toBe(5);
    });

    it('同じ点の距離は 0', () => {
      expect(distance(1, 1, 1, 1)).toBe(0);
    });

    it('結果は常に 0 以上', () => {
      expect(distance(5, 5, 0, 0)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('randomInt', () => {
    it('0 以上 max 未満の整数を返す', () => {
      for (let i = 0; i < 100; i++) {
        const val = randomInt(10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });
  });

  describe('randomRange', () => {
    it('min 以上 max 未満の値を返す', () => {
      for (let i = 0; i < 100; i++) {
        const val = randomRange(5, 10);
        expect(val).toBeGreaterThanOrEqual(5);
        expect(val).toBeLessThan(10);
      }
    });

    it('min === max の場合は min を返す', () => {
      expect(randomRange(5, 5)).toBe(5);
    });
  });

  describe('formatTime', () => {
    it('0ms をフォーマットする', () => {
      expect(formatTime(0)).toBe('0:00.0');
    });

    it('65100ms をフォーマットする', () => {
      expect(formatTime(65100)).toBe('1:05.1');
    });

    it('NaN の場合はデフォルト値を返す', () => {
      expect(formatTime(NaN)).toBe('-:--.-');
    });
  });

  describe('safeIndex', () => {
    it('有効なインデックスの場合は要素を返す', () => {
      expect(safeIndex([10, 20, 30], 1, 0)).toBe(20);
    });

    it('範囲外のインデックスの場合はフォールバックを返す', () => {
      expect(safeIndex([10, 20], 5, 99)).toBe(99);
    });

    it('負のインデックスの場合はフォールバックを返す', () => {
      expect(safeIndex([10, 20], -1, 99)).toBe(99);
    });
  });

  describe('min', () => {
    it('配列の最小値を返す', () => {
      expect(min([3, 1, 2])).toBe(1);
    });

    it('空配列は Infinity を返す', () => {
      expect(min([])).toBe(Infinity);
    });
  });
});
