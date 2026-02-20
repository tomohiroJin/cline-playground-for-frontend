/**
 * エンディング分岐システムのテスト
 */
import {
  calculateRating,
  getEpilogueText,
  getGameOverText,
  getRatingColor,
  getEndingImage,
  getGameOverImage,
  RATING_THRESHOLDS,
  RATING_COLORS,
} from '../ending';
import { Rating } from '../types';

describe('ending', () => {
  describe('RATING_THRESHOLDS', () => {
    test('閾値が正しく設定されていること', () => {
      expect(RATING_THRESHOLDS.S).toBe(600000);   // 10分
      expect(RATING_THRESHOLDS.A).toBe(900000);   // 15分
      expect(RATING_THRESHOLDS.B).toBe(1500000);  // 25分
      expect(RATING_THRESHOLDS.C).toBe(2400000);  // 40分
    });
  });

  describe('RATING_COLORS', () => {
    test('色が正しく設定されていること', () => {
      expect(RATING_COLORS.s).toBe('#fbbf24'); // 金色
      expect(RATING_COLORS.a).toBe('#94a3b8'); // 銀色
      expect(RATING_COLORS.b).toBe('#b45309'); // 銅色
      expect(RATING_COLORS.c).toBe('#3b82f6'); // 青色
      expect(RATING_COLORS.d).toBe('#6b7280'); // 灰色
    });
  });

  describe('calculateRating', () => {
    describe('評価計算', () => {
      test('5分(300000ms)でS評価になること', () => {
        expect(calculateRating(300000)).toBe(Rating.S);
      });

      test('12分(720000ms)でA評価になること', () => {
        expect(calculateRating(720000)).toBe(Rating.A);
      });

      test('20分(1200000ms)でB評価になること', () => {
        expect(calculateRating(1200000)).toBe(Rating.B);
      });

      test('30分(1800000ms)でC評価になること', () => {
        expect(calculateRating(1800000)).toBe(Rating.C);
      });

      test('50分(3000000ms)でD評価になること', () => {
        expect(calculateRating(3000000)).toBe(Rating.D);
      });
    });

    describe('境界値テスト', () => {
      test('10分(600000ms)ちょうどでS評価になること', () => {
        expect(calculateRating(600000)).toBe(Rating.S);
      });

      test('10分+1ms(600001ms)でA評価になること', () => {
        expect(calculateRating(600001)).toBe(Rating.A);
      });

      test('15分(900000ms)ちょうどでA評価になること', () => {
        expect(calculateRating(900000)).toBe(Rating.A);
      });

      test('15分+1ms(900001ms)でB評価になること', () => {
        expect(calculateRating(900001)).toBe(Rating.B);
      });

      test('25分(1500000ms)ちょうどでB評価になること', () => {
        expect(calculateRating(1500000)).toBe(Rating.B);
      });

      test('25分+1ms(1500001ms)でC評価になること', () => {
        expect(calculateRating(1500001)).toBe(Rating.C);
      });

      test('40分(2400000ms)ちょうどでC評価になること', () => {
        expect(calculateRating(2400000)).toBe(Rating.C);
      });

      test('40分+1ms(2400001ms)でD評価になること', () => {
        expect(calculateRating(2400001)).toBe(Rating.D);
      });
    });

    describe('エッジケース', () => {
      test('0msでS評価になること', () => {
        expect(calculateRating(0)).toBe(Rating.S);
      });

      test('非常に長い時間でもD評価になること', () => {
        expect(calculateRating(999999999)).toBe(Rating.D);
      });
    });
  });

  describe('getEpilogueText', () => {
    test('S評価のテキストが正しいこと', () => {
      const result = getEpilogueText(Rating.S);
      expect(result.title).toBe('伝説の調査記録');
      expect(result.text).toContain('驚異的な速さ');
    });

    test('A評価のテキストが正しいこと', () => {
      const result = getEpilogueText(Rating.A);
      expect(result.title).toBe('優秀な調査報告');
      expect(result.text).toContain('確かな実力');
    });

    test('B評価のテキストが正しいこと', () => {
      const result = getEpilogueText(Rating.B);
      expect(result.title).toBe('堅実な踏破記録');
      expect(result.text).toContain('着実に');
    });

    test('C評価のテキストが正しいこと', () => {
      const result = getEpilogueText(Rating.C);
      expect(result.title).toBe('生還報告');
      expect(result.text).toContain('幾度も危機');
    });

    test('D評価のテキストが正しいこと', () => {
      const result = getEpilogueText(Rating.D);
      expect(result.title).toBe('辛勝の脱出記録');
      expect(result.text).toContain('長い戦いの末');
    });

    test('各評価でtitleとtextが存在すること', () => {
      const ratings = [Rating.S, Rating.A, Rating.B, Rating.C, Rating.D];
      for (const rating of ratings) {
        const result = getEpilogueText(rating);
        expect(result.title).toBeTruthy();
        expect(result.text).toBeTruthy();
        expect(typeof result.title).toBe('string');
        expect(typeof result.text).toBe('string');
      }
    });

    test('各評価でparagraphsが存在すること', () => {
      const ratings = [Rating.S, Rating.A, Rating.B, Rating.C, Rating.D];
      for (const rating of ratings) {
        const result = getEpilogueText(rating);
        expect(result.paragraphs).toBeDefined();
        expect(Array.isArray(result.paragraphs)).toBe(true);
        expect(result.paragraphs!.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('getGameOverText', () => {
    test('ゲームオーバーのテキストが正しいこと', () => {
      const result = getGameOverText();
      expect(result.title).toBe('冒険の終わり');
      expect(result.text).toContain('迷宮の闇に飲み込まれた');
    });

    test('titleとtextが存在すること', () => {
      const result = getGameOverText();
      expect(result.title).toBeTruthy();
      expect(result.text).toBeTruthy();
    });

    test('paragraphsが存在すること', () => {
      const result = getGameOverText();
      expect(result.paragraphs).toBeDefined();
      expect(Array.isArray(result.paragraphs)).toBe(true);
      expect(result.paragraphs!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getRatingColor', () => {
    test('S評価の色が金色であること', () => {
      expect(getRatingColor(Rating.S)).toBe('#fbbf24');
    });

    test('A評価の色が銀色であること', () => {
      expect(getRatingColor(Rating.A)).toBe('#94a3b8');
    });

    test('B評価の色が銅色であること', () => {
      expect(getRatingColor(Rating.B)).toBe('#b45309');
    });

    test('C評価の色が青色であること', () => {
      expect(getRatingColor(Rating.C)).toBe('#3b82f6');
    });

    test('D評価の色が灰色であること', () => {
      expect(getRatingColor(Rating.D)).toBe('#6b7280');
    });

    test('各評価で有効な色コードが返ること', () => {
      const ratings = [Rating.S, Rating.A, Rating.B, Rating.C, Rating.D];
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      for (const rating of ratings) {
        const color = getRatingColor(rating);
        expect(color).toMatch(hexColorRegex);
      }
    });
  });

  describe('getEndingImage', () => {
    test('S評価の画像パスが返ること', () => {
      // Jestではアセットがモックされるため、文字列が返ることを確認
      expect(typeof getEndingImage(Rating.S)).toBe('string');
    });

    test('A評価の画像パスが返ること', () => {
      expect(typeof getEndingImage(Rating.A)).toBe('string');
    });

    test('B評価の画像パスが返ること', () => {
      expect(typeof getEndingImage(Rating.B)).toBe('string');
    });

    test('C評価の画像パスが返ること', () => {
      expect(typeof getEndingImage(Rating.C)).toBe('string');
    });

    test('D評価の画像パスが返ること', () => {
      expect(typeof getEndingImage(Rating.D)).toBe('string');
    });

    test('各評価で画像パスが返ること', () => {
      const ratings = [Rating.S, Rating.A, Rating.B, Rating.C, Rating.D];
      for (const rating of ratings) {
        const path = getEndingImage(rating);
        expect(typeof path).toBe('string');
        expect(path.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getGameOverImage', () => {
    test('ゲームオーバー画像パスが返ること', () => {
      // Jestではアセットがモックされるため、文字列が返ることを確認
      expect(typeof getGameOverImage()).toBe('string');
    });

    test('有効な画像パスが返ること', () => {
      const path = getGameOverImage();
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    });
  });
});
