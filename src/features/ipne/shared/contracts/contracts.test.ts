import {
  assertCondition,
  assertNumberInRange,
  assertIntegerInRange,
  assertUniquePositions,
} from './index';

describe('contracts', () => {
  describe('assertCondition', () => {
    it('条件が真の場合は例外を投げない', () => {
      expect(() => assertCondition(true, 'ok')).not.toThrow();
    });

    it('条件が偽の場合は例外を投げる', () => {
      expect(() => assertCondition(false, 'failed')).toThrow('failed');
    });
  });

  describe('assertNumberInRange', () => {
    it('範囲内の値を許可する', () => {
      expect(() => assertNumberInRange(0.5, 0, 1, 'ratio')).not.toThrow();
    });

    it('範囲外の値を拒否する', () => {
      expect(() => assertNumberInRange(1.5, 0, 1, 'ratio')).toThrow();
    });
  });

  describe('assertIntegerInRange', () => {
    it('範囲内の整数を許可する', () => {
      expect(() => assertIntegerInRange(3, 0, 5, 'count')).not.toThrow();
    });

    it('小数を拒否する', () => {
      expect(() => assertIntegerInRange(1.2, 0, 5, 'count')).toThrow();
    });
  });

  describe('assertUniquePositions', () => {
    it('重複なし座標を許可する', () => {
      expect(() =>
        assertUniquePositions(
          [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
          ],
          'positions'
        )
      ).not.toThrow();
    });

    it('重複座標を拒否する', () => {
      expect(() =>
        assertUniquePositions(
          [
            { x: 1, y: 1 },
            { x: 1, y: 1 },
          ],
          'positions'
        )
      ).toThrow();
    });
  });
});
