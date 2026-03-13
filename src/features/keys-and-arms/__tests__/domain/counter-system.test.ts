/**
 * カウンターシステムのテスト
 */
import {
  canCounter,
  calculateCounterRestTime,
} from '../../domain/boss/counter-system';

describe('boss/counter-system', () => {
  describe('canCounter', () => {
    it('カウンター CD が 0 かつ台座位置にいる場合に可能', () => {
      expect(canCounter(1, 0)).toBe(true);
    });

    it('カウンター CD が 0 より大きい場合は不可', () => {
      expect(canCounter(1, 5)).toBe(false);
    });

    it('セーフゾーン（pos 0）では不可', () => {
      expect(canCounter(0, 0)).toBe(false);
    });

    it('台座位置 1-6 で可能', () => {
      for (let pos = 1; pos <= 6; pos++) {
        expect(canCounter(pos, 0)).toBe(true);
      }
    });

    it('範囲外の playerPos でも false を返す（DEBUG=false 時はアサーションが no-op）', () => {
      expect(canCounter(-1, 0)).toBe(false);
      expect(canCounter(7, 0)).toBe(false);
    });
  });

  describe('calculateCounterRestTime', () => {
    it('基本休息時間 + 2 を返す', () => {
      expect(calculateCounterRestTime(5)).toBe(7);
    });

    it('最低 2 を返す', () => {
      expect(calculateCounterRestTime(0)).toBe(2);
    });
  });
});
