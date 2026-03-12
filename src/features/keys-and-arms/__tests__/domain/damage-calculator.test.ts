/**
 * ダメージ計算のテスト
 */
import {
  calculateKillScore,
  calculateSweepScore,
  calculatePlaceScore,
  calculateCounterScore,
  calculateShieldScore,
  calculateGuardScore,
  calculateStageClearScore,
  calculateBossClearScore,
} from '../../domain/combat/damage-calculator';

describe('combat/damage-calculator', () => {
  describe('calculateKillScore', () => {
    it('ループ 1、コンボ 1 で基本スコアを返す', () => {
      expect(calculateKillScore(1, 1)).toBe(140);
    });

    it('コンボが高いほどスコアが増加する', () => {
      const low = calculateKillScore(1, 1);
      const high = calculateKillScore(3, 1);
      expect(high).toBeGreaterThan(low);
    });

    it('ループが高いほどスコアが倍増する', () => {
      const loop1 = calculateKillScore(1, 1);
      const loop2 = calculateKillScore(1, 2);
      expect(loop2).toBe(loop1 * 2);
    });
  });

  describe('calculateSweepScore', () => {
    it('コンボとループに基づいたスコアを返す', () => {
      const score = calculateSweepScore(4, 1);
      expect(score).toBe(200 + 4 * 60);
    });

    it('ループ倍率が適用される', () => {
      const loop1 = calculateSweepScore(4, 1);
      const loop2 = calculateSweepScore(4, 2);
      expect(loop2).toBe(loop1 * 2);
    });
  });

  describe('calculatePlaceScore', () => {
    it('鍵設置スコアはループ × 500', () => {
      expect(calculatePlaceScore(1)).toBe(500);
      expect(calculatePlaceScore(2)).toBe(1000);
    });
  });

  describe('calculateCounterScore', () => {
    it('カウンタースコアはループ × 300', () => {
      expect(calculateCounterScore(1)).toBe(300);
      expect(calculateCounterScore(3)).toBe(900);
    });
  });

  describe('calculateShieldScore', () => {
    it('シールド設置スコアはループ × 200', () => {
      expect(calculateShieldScore(1)).toBe(200);
    });
  });

  describe('calculateGuardScore', () => {
    it('ガードキルスコアはループ × 50', () => {
      expect(calculateGuardScore(1)).toBe(50);
      expect(calculateGuardScore(2)).toBe(100);
    });
  });

  describe('calculateStageClearScore', () => {
    it('洞窟クリアスコアはループ × 2000', () => {
      expect(calculateStageClearScore('cave', 1)).toBe(2000);
    });

    it('草原クリアスコアはループ × 3000', () => {
      expect(calculateStageClearScore('prairie', 1)).toBe(3000);
    });
  });

  describe('calculateBossClearScore', () => {
    it('ボスクリアスコアはループ × 5000', () => {
      expect(calculateBossClearScore(1)).toBe(5000);
      expect(calculateBossClearScore(2)).toBe(10000);
    });
  });
});
