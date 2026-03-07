/**
 * 難易度設定 - 単体テスト
 */
import {
  DIFFICULTY_CONFIGS,
  getDifficultyConfig,
  calculateGradeWithDifficulty,
} from '../difficulty';
import { getGrade } from '../constants';

describe('difficulty', () => {
  describe('DIFFICULTY_CONFIGS', () => {
    it('4つの難易度が定義されている', () => {
      expect(DIFFICULTY_CONFIGS).toHaveLength(4);
    });

    it('全難易度にIDがある', () => {
      const ids = DIFFICULTY_CONFIGS.map(d => d.id);
      expect(ids).toEqual(['easy', 'normal', 'hard', 'extreme']);
    });

    it('Easyは制限時間20秒でヒント付き', () => {
      const easy = DIFFICULTY_CONFIGS.find(d => d.id === 'easy')!;
      expect(easy.timeLimit).toBe(20);
      expect(easy.hasHint).toBe(true);
      expect(easy.debtMultiplier).toBe(0.5);
    });

    it('Normalは制限時間15秒', () => {
      const normal = DIFFICULTY_CONFIGS.find(d => d.id === 'normal')!;
      expect(normal.timeLimit).toBe(15);
      expect(normal.hasHint).toBe(false);
      expect(normal.debtMultiplier).toBe(1.0);
    });

    it('Hardは制限時間10秒で負債2倍', () => {
      const hard = DIFFICULTY_CONFIGS.find(d => d.id === 'hard')!;
      expect(hard.timeLimit).toBe(10);
      expect(hard.debtMultiplier).toBe(2.0);
      expect(hard.emergencyRateBonus).toBe(0.2);
    });

    it('Extremeは制限時間8秒で負債3倍', () => {
      const extreme = DIFFICULTY_CONFIGS.find(d => d.id === 'extreme')!;
      expect(extreme.timeLimit).toBe(8);
      expect(extreme.debtMultiplier).toBe(3.0);
      expect(extreme.missDebtPenalty).toBe(15);
    });
  });

  describe('getDifficultyConfig', () => {
    it('難易度IDから設定を取得できる', () => {
      const config = getDifficultyConfig('hard');
      expect(config.id).toBe('hard');
      expect(config.timeLimit).toBe(10);
    });

    it('不正なIDの場合はNormalを返す', () => {
      // TypeScript的にはエラーだが、ランタイム安全のため
      const config = getDifficultyConfig('unknown' as 'normal');
      expect(config.id).toBe('normal');
    });
  });

  describe('calculateGradeWithDifficulty', () => {
    it('Normalではボーナスなし', () => {
      const baseGrade = getGrade(70, 70, 5);
      const result = calculateGradeWithDifficulty(70, 70, 5, 'normal');
      expect(result.grade).toBe(baseGrade.grade);
    });

    it('Hard以上ではグレードが上がる可能性がある', () => {
      // ボーダー付近のスコアで確認
      const normalResult = calculateGradeWithDifficulty(72, 70, 5, 'normal');
      const hardResult = calculateGradeWithDifficulty(72, 70, 5, 'hard');
      // Hard のボーナスでグレードが上がるか同じ
      expect(['S', 'A', 'B', 'C', 'D']).toContain(hardResult.grade);
      // ボーナス係数1.1のため、Hardの方が同じかそれ以上のグレード
      const gradeOrder = ['D', 'C', 'B', 'A', 'S'];
      expect(gradeOrder.indexOf(hardResult.grade)).toBeGreaterThanOrEqual(
        gradeOrder.indexOf(normalResult.grade)
      );
    });
  });
});
