// カード効果計算のテスト

import { getCardMultiplier, computeAllCardEffects } from '../../../domain/card/card-effect';
import type { CardEffect } from '../../../domain/card/types';

describe('card-effect', () => {
  describe('getCardMultiplier', () => {
    it('空配列の場合は 1 を返す', () => {
      expect(getCardMultiplier([], 'speedMultiplier')).toBe(1);
    });

    it('単一効果の乗算値を返す', () => {
      const cards: CardEffect[] = [{ speedMultiplier: 1.15 }];
      expect(getCardMultiplier(cards, 'speedMultiplier')).toBeCloseTo(1.15);
    });

    it('複数効果の乗算を返す', () => {
      const cards: CardEffect[] = [
        { speedMultiplier: 1.10 },
        { speedMultiplier: 1.20 },
      ];
      expect(getCardMultiplier(cards, 'speedMultiplier')).toBeCloseTo(1.32);
    });

    it('未定義フィールドはデフォルト 1 として扱う', () => {
      const cards: CardEffect[] = [{ accelMultiplier: 1.25 }];
      expect(getCardMultiplier(cards, 'speedMultiplier')).toBe(1);
    });
  });

  describe('computeAllCardEffects', () => {
    it('空配列では全て 1 を返す', () => {
      const result = computeAllCardEffects([]);
      expect(result.speedMul).toBe(1);
      expect(result.accelMul).toBe(1);
      expect(result.turnMul).toBe(1);
      expect(result.driftBoostMul).toBe(1);
      expect(result.heatGainMul).toBe(1);
      expect(result.wallDamageMul).toBe(1);
    });

    it('複数効果を正しく乗算する', () => {
      const cards: CardEffect[] = [
        { speedMultiplier: 1.10, accelMultiplier: 1.25 },
        { speedMultiplier: 1.20 },
      ];
      const result = computeAllCardEffects(cards);
      expect(result.speedMul).toBeCloseTo(1.32);
      expect(result.accelMul).toBeCloseTo(1.25);
    });
  });
});
