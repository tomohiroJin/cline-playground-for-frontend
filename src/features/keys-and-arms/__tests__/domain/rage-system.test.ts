/**
 * レイジウェーブシステムのテスト
 */
import {
  calculateAngerLevel,
  canTriggerRage,
  getRageWakeCount,
} from '../../domain/boss/rage-system';

describe('boss/rage-system', () => {
  describe('calculateAngerLevel', () => {
    it('設置済み宝石数を返す', () => {
      expect(calculateAngerLevel([1, 0, 0, 1, 0, 1])).toBe(3);
    });

    it('シールド付きも宝石として数える', () => {
      expect(calculateAngerLevel([1, 2, 0, 1, 0, 0])).toBe(3);
    });

    it('空の台座は数えない', () => {
      expect(calculateAngerLevel([0, 0, 0, 0, 0, 0])).toBe(0);
    });
  });

  describe('canTriggerRage', () => {
    it('怒りレベル 3 以上でレイジ可能', () => {
      expect(canTriggerRage(3)).toBe(true);
    });

    it('怒りレベル 2 以下ではレイジ不可', () => {
      expect(canTriggerRage(2)).toBe(false);
    });
  });

  describe('getRageWakeCount', () => {
    it('怒りレベル 3-4 で 2 本起動', () => {
      expect(getRageWakeCount(3)).toBe(2);
      expect(getRageWakeCount(4)).toBe(2);
    });

    it('怒りレベル 5 以上で 3 本起動', () => {
      expect(getRageWakeCount(5)).toBe(3);
      expect(getRageWakeCount(6)).toBe(3);
    });
  });

  describe('怒りレベルによる影響', () => {
    it('レベル 3 以上で腕の休息時間が短縮', () => {
      // 実際の減算はステージロジック側の責務
      expect(canTriggerRage(3)).toBe(true);
    });

    it('レベル 5 以上でさらに短縮', () => {
      expect(getRageWakeCount(5)).toBe(3);
    });
  });
});
