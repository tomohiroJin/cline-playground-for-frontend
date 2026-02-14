import { Utils } from '../utils';

describe('Racing Game Utils', () => {
  describe('clamp', () => {
    test('範囲内の値はそのまま返す', () => {
      expect(Utils.clamp(5, 0, 10)).toBe(5);
    });
    test('最小値より小さい場合は最小値を返す', () => {
      expect(Utils.clamp(-1, 0, 10)).toBe(0);
    });
    test('最大値より大きい場合は最大値を返す', () => {
      expect(Utils.clamp(15, 0, 10)).toBe(10);
    });
    test('NaNの場合は最小値を返す', () => {
      expect(Utils.clamp(NaN, 0, 10)).toBe(0);
    });
  });

  describe('sum', () => {
    test('配列の合計を返す', () => {
      expect(Utils.sum([1, 2, 3])).toBe(6);
    });
    test('空配列は0を返す', () => {
      expect(Utils.sum([])).toBe(0);
    });
  });

  describe('min', () => {
    test('配列の最小値を返す', () => {
      expect(Utils.min([3, 1, 2])).toBe(1);
    });
    test('空配列はInfinityを返す', () => {
      expect(Utils.min([])).toBe(Infinity);
    });
  });

  describe('normalizeAngle', () => {
    test('0はそのまま返す', () => {
      expect(Utils.normalizeAngle(0)).toBe(0);
    });
    test('2πを超える角度を正規化する', () => {
      const result = Utils.normalizeAngle(Math.PI * 3);
      expect(result).toBeCloseTo(Math.PI, 5);
    });
    test('負の角度を正規化する', () => {
      const result = Utils.normalizeAngle(-Math.PI * 3);
      expect(result).toBeCloseTo(-Math.PI, 5);
    });
  });

  describe('formatTime', () => {
    test('0msをフォーマットする', () => {
      expect(Utils.formatTime(0)).toBe('0:00.0');
    });
    test('65100msをフォーマットする', () => {
      expect(Utils.formatTime(65100)).toBe('1:05.1');
    });
    test('NaNの場合はデフォルト値を返す', () => {
      expect(Utils.formatTime(NaN)).toBe('-:--.-');
    });
  });

  describe('safeIndex', () => {
    test('有効なインデックスの場合は要素を返す', () => {
      expect(Utils.safeIndex([10, 20, 30], 1, 0)).toBe(20);
    });
    test('範囲外のインデックスの場合はフォールバックを返す', () => {
      expect(Utils.safeIndex([10, 20], 5, 99)).toBe(99);
    });
    test('負のインデックスの場合はフォールバックを返す', () => {
      expect(Utils.safeIndex([10, 20], -1, 99)).toBe(99);
    });
  });

  describe('dist', () => {
    test('2点間の距離を計算する', () => {
      expect(Utils.dist(0, 0, 3, 4)).toBe(5);
    });
    test('同じ点の距離は0', () => {
      expect(Utils.dist(1, 1, 1, 1)).toBe(0);
    });
  });

  describe('randInt', () => {
    test('0以上max未満の整数を返す', () => {
      for (let i = 0; i < 100; i++) {
        const val = Utils.randInt(10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });
  });

  describe('randRange', () => {
    test('min以上max未満の値を返す', () => {
      for (let i = 0; i < 100; i++) {
        const val = Utils.randRange(5, 10);
        expect(val).toBeGreaterThanOrEqual(5);
        expect(val).toBeLessThan(10);
      }
    });
    test('min === maxの場合はminを返す', () => {
      expect(Utils.randRange(5, 5)).toBe(5);
    });
  });

  describe('randChoice', () => {
    test('配列の要素を返す', () => {
      const arr = ['a', 'b', 'c'];
      for (let i = 0; i < 100; i++) {
        expect(arr).toContain(Utils.randChoice(arr));
      }
    });
    test('空配列はnullを返す', () => {
      expect(Utils.randChoice([])).toBeNull();
    });
  });
});
