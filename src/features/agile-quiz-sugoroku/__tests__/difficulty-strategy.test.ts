/**
 * 難易度 Strategy パターンのテスト
 *
 * DIFFICULTY_CONFIGS がプラガブルな設定として機能することを検証
 */
import { DIFFICULTY_CONFIGS, getDifficultyConfig } from '../domain/scoring/difficulty';

describe('難易度 Strategy パターン', () => {
  describe('getDifficultyConfig - 設定取得', () => {
    it('各難易度IDに対応する設定が取得できる', () => {
      // Arrange & Act & Assert
      const easy = getDifficultyConfig('easy');
      expect(easy.timeLimit).toBe(20);
      expect(easy.hasHint).toBe(true);

      const normal = getDifficultyConfig('normal');
      expect(normal.timeLimit).toBe(15);
      expect(normal.debtMultiplier).toBe(1.0);

      const hard = getDifficultyConfig('hard');
      expect(hard.timeLimit).toBe(10);
      expect(hard.gradeBonus).toBe(1.1);

      const extreme = getDifficultyConfig('extreme');
      expect(extreme.timeLimit).toBe(8);
      expect(extreme.missDebtPenalty).toBe(15);
    });

    it('不明な難易度IDはNormalにフォールバックする', () => {
      const fallback = getDifficultyConfig('unknown' as 'normal');
      expect(fallback.id).toBe('normal');
    });
  });

  describe('DIFFICULTY_CONFIGS - 設定一覧', () => {
    it('4つの難易度が定義されている', () => {
      expect(DIFFICULTY_CONFIGS).toHaveLength(4);
    });

    it('制限時間が難易度順に減少する', () => {
      const timeLimits = DIFFICULTY_CONFIGS.map(d => d.timeLimit);
      for (let i = 1; i < timeLimits.length; i++) {
        expect(timeLimits[i]).toBeLessThan(timeLimits[i - 1]);
      }
    });

    it('負債倍率が難易度順に増加する', () => {
      const multipliers = DIFFICULTY_CONFIGS.map(d => d.debtMultiplier);
      for (let i = 1; i < multipliers.length; i++) {
        expect(multipliers[i]).toBeGreaterThanOrEqual(multipliers[i - 1]);
      }
    });
  });
});
