import { getCardMultiplier, computeAllCardEffects } from '../card-effects';
import type { CardEffect } from '../types';

describe('card-effects', () => {
  describe('getCardMultiplier', () => {
    test('空配列では1を返す', () => {
      expect(getCardMultiplier([], 'speedMultiplier')).toBe(1);
    });

    test('単一効果の乗算値を正しく返す', () => {
      const cards: CardEffect[] = [{ speedMultiplier: 1.15 }];
      expect(getCardMultiplier(cards, 'speedMultiplier')).toBeCloseTo(1.15);
    });

    test('複数効果の乗算を正しく計算する', () => {
      const cards: CardEffect[] = [
        { speedMultiplier: 1.15 },
        { speedMultiplier: 1.10 },
      ];
      expect(getCardMultiplier(cards, 'speedMultiplier')).toBeCloseTo(1.15 * 1.10);
    });

    test('未定義フィールドは1として扱う', () => {
      const cards: CardEffect[] = [{ accelMultiplier: 1.25 }];
      // speedMultiplier は未定義 → 1
      expect(getCardMultiplier(cards, 'speedMultiplier')).toBe(1);
    });

    test('wallDamageMultiplier の乗算を正しく計算する', () => {
      const cards: CardEffect[] = [
        { wallDamageMultiplier: 0.50 },
        { wallDamageMultiplier: 0.80 },
      ];
      expect(getCardMultiplier(cards, 'wallDamageMultiplier')).toBeCloseTo(0.50 * 0.80);
    });
  });

  describe('computeAllCardEffects', () => {
    test('空配列では全フィールドが1を返す', () => {
      const result = computeAllCardEffects([]);
      expect(result.speedMul).toBe(1);
      expect(result.accelMul).toBe(1);
      expect(result.turnMul).toBe(1);
      expect(result.driftBoostMul).toBe(1);
      expect(result.heatGainMul).toBe(1);
      expect(result.wallDamageMul).toBe(1);
    });

    test('複数効果を一括計算する', () => {
      const cards: CardEffect[] = [
        { speedMultiplier: 1.15, turnMultiplier: 1.20 },
        { accelMultiplier: 1.25, wallDamageMultiplier: 0.50 },
      ];
      const result = computeAllCardEffects(cards);
      expect(result.speedMul).toBeCloseTo(1.15);
      expect(result.accelMul).toBeCloseTo(1.25);
      expect(result.turnMul).toBeCloseTo(1.20);
      expect(result.driftBoostMul).toBe(1);
      expect(result.heatGainMul).toBe(1);
      expect(result.wallDamageMul).toBeCloseTo(0.50);
    });
  });
});
