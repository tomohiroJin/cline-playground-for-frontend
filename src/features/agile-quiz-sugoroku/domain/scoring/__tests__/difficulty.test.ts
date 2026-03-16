/**
 * 難易度設定 - 単体テスト
 *
 * DIFFICULTY_CONFIGS がプラガブルな設定として機能することを検証
 */
import {
  DIFFICULTY_CONFIGS,
  getDifficultyConfig,
  calculateGradeWithDifficulty,
} from '../difficulty';
import { getGrade } from '../../../constants';

describe('difficulty', () => {
  describe('DIFFICULTY_CONFIGS - 設定一覧', () => {
    it('4つの難易度が定義されている', () => {
      expect(DIFFICULTY_CONFIGS).toHaveLength(4);
    });

    it('全難易度にIDがある', () => {
      const ids = DIFFICULTY_CONFIGS.map(d => d.id);
      expect(ids).toEqual(['easy', 'normal', 'hard', 'extreme']);
    });

    it('制限時間が難易度順に減少する', () => {
      // Arrange & Act
      const timeLimits = DIFFICULTY_CONFIGS.map(d => d.timeLimit);

      // Assert
      for (let i = 1; i < timeLimits.length; i++) {
        expect(timeLimits[i]).toBeLessThan(timeLimits[i - 1]);
      }
    });

    it('負債倍率が難易度順に増加する', () => {
      // Arrange & Act
      const multipliers = DIFFICULTY_CONFIGS.map(d => d.debtMultiplier);

      // Assert
      for (let i = 1; i < multipliers.length; i++) {
        expect(multipliers[i]).toBeGreaterThanOrEqual(multipliers[i - 1]);
      }
    });

    it('Easyは制限時間20秒でヒント付き', () => {
      const easy = getDifficultyConfig('easy');
      expect(easy.timeLimit).toBe(20);
      expect(easy.hasHint).toBe(true);
      expect(easy.debtMultiplier).toBe(0.5);
    });

    it('Normalは制限時間15秒', () => {
      const normal = getDifficultyConfig('normal');
      expect(normal.timeLimit).toBe(15);
      expect(normal.hasHint).toBe(false);
      expect(normal.debtMultiplier).toBe(1.0);
    });

    it('Hardは制限時間10秒で負債2倍', () => {
      const hard = getDifficultyConfig('hard');
      expect(hard.timeLimit).toBe(10);
      expect(hard.debtMultiplier).toBe(2.0);
      expect(hard.emergencyRateBonus).toBe(0.2);
      expect(hard.gradeBonus).toBe(1.1);
    });

    it('Extremeは制限時間8秒で負債3倍', () => {
      const extreme = getDifficultyConfig('extreme');
      expect(extreme.timeLimit).toBe(8);
      expect(extreme.debtMultiplier).toBe(3.0);
      expect(extreme.missDebtPenalty).toBe(15);
    });
  });

  describe('getDifficultyConfig - 設定取得', () => {
    it('各難易度IDに対応する設定が取得できる', () => {
      // Arrange & Act & Assert
      expect(getDifficultyConfig('easy').id).toBe('easy');
      expect(getDifficultyConfig('normal').id).toBe('normal');
      expect(getDifficultyConfig('hard').id).toBe('hard');
      expect(getDifficultyConfig('extreme').id).toBe('extreme');
    });

    it('不正なIDの場合はNormalを返す', () => {
      // Arrange & Act
      const config = getDifficultyConfig('unknown' as 'normal');

      // Assert
      expect(config.id).toBe('normal');
    });
  });

  describe('calculateGradeWithDifficulty - グレード計算', () => {
    it('Normalではボーナスなし', () => {
      // Arrange
      const baseGrade = getGrade(70, 70, 5);

      // Act
      const result = calculateGradeWithDifficulty(70, 70, 5, 'normal');

      // Assert
      expect(result.grade).toBe(baseGrade.grade);
    });

    it('Hard以上ではグレードが上がる可能性がある', () => {
      // Arrange & Act
      const normalResult = calculateGradeWithDifficulty(72, 70, 5, 'normal');
      const hardResult = calculateGradeWithDifficulty(72, 70, 5, 'hard');

      // Assert
      const gradeOrder = ['D', 'C', 'B', 'A', 'S'];
      expect(gradeOrder.indexOf(hardResult.grade)).toBeGreaterThanOrEqual(
        gradeOrder.indexOf(normalResult.grade),
      );
    });
  });
});
