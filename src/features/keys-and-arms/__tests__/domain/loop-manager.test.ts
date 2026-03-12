/**
 * ループ管理のテスト
 */
import {
  advanceLoop,
  isTrueEnding,
  getMaxLoop,
} from '../../domain/stage-flow/loop-manager';

describe('stage-flow/loop-manager', () => {
  describe('advanceLoop', () => {
    it('ループが 1 増加する', () => {
      expect(advanceLoop(1)).toBe(2);
    });

    it('連続してループが増加する', () => {
      expect(advanceLoop(advanceLoop(1))).toBe(3);
    });
  });

  describe('isTrueEnding', () => {
    it('ループ 1 では false', () => {
      expect(isTrueEnding(1)).toBe(false);
    });

    it('ループ 2 では false', () => {
      expect(isTrueEnding(2)).toBe(false);
    });

    it('ループ 3 以上で true', () => {
      expect(isTrueEnding(3)).toBe(true);
      expect(isTrueEnding(5)).toBe(true);
    });
  });

  describe('getMaxLoop', () => {
    it('最大ループ数を返す', () => {
      // ゲームデザイン上の制約はないが、関数が定義されていること
      expect(getMaxLoop()).toBeGreaterThan(0);
    });
  });
});
