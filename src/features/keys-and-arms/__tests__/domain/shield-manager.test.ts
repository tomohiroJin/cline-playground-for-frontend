/**
 * シールド管理のテスト
 */
import {
  calculateInitialShields,
  useShield,
  shouldDropShield,
} from '../../domain/items/shield-manager';

describe('items/shield-manager', () => {
  describe('calculateInitialShields', () => {
    it('獲得 0 でベース 1', () => {
      expect(calculateInitialShields(0)).toBe(1);
    });

    it('獲得数に応じて増加する', () => {
      expect(calculateInitialShields(2)).toBe(3);
    });

    it('上限 5 を超えない', () => {
      expect(calculateInitialShields(10)).toBe(5);
    });
  });

  describe('useShield', () => {
    it('シールドが 1 減少する', () => {
      expect(useShield(3)).toBe(2);
    });

    it('0 以下にはならない', () => {
      expect(useShield(0)).toBe(0);
    });
  });

  describe('shouldDropShield', () => {
    it('キル数が閾値に達したら true', () => {
      expect(shouldDropShield(5, 5)).toBe(true);
    });

    it('キル数が閾値未満なら false', () => {
      expect(shouldDropShield(4, 5)).toBe(false);
    });

    it('キル数が閾値を超過していても true', () => {
      expect(shouldDropShield(6, 5)).toBe(true);
    });
  });
});
