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
      expect(RATING_THRESHOLDS.S).toBe(120000);  // 2分
      expect(RATING_THRESHOLDS.A).toBe(180000);  // 3分
      expect(RATING_THRESHOLDS.B).toBe(300000);  // 5分
      expect(RATING_THRESHOLDS.C).toBe(480000);  // 8分
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
      test('1分(60000ms)でS評価になること', () => {
        expect(calculateRating(60000)).toBe(Rating.S);
      });

      test('2.5分(150000ms)でA評価になること', () => {
        expect(calculateRating(150000)).toBe(Rating.A);
      });

      test('4分(240000ms)でB評価になること', () => {
        expect(calculateRating(240000)).toBe(Rating.B);
      });

      test('6分(360000ms)でC評価になること', () => {
        expect(calculateRating(360000)).toBe(Rating.C);
      });

      test('10分(600000ms)でD評価になること', () => {
        expect(calculateRating(600000)).toBe(Rating.D);
      });
    });

    describe('境界値テスト', () => {
      test('2分(120000ms)ちょうどでS評価になること', () => {
        expect(calculateRating(120000)).toBe(Rating.S);
      });

      test('2分+1ms(120001ms)でA評価になること', () => {
        expect(calculateRating(120001)).toBe(Rating.A);
      });

      test('3分(180000ms)ちょうどでA評価になること', () => {
        expect(calculateRating(180000)).toBe(Rating.A);
      });

      test('3分+1ms(180001ms)でB評価になること', () => {
        expect(calculateRating(180001)).toBe(Rating.B);
      });

      test('5分(300000ms)ちょうどでB評価になること', () => {
        expect(calculateRating(300000)).toBe(Rating.B);
      });

      test('5分+1ms(300001ms)でC評価になること', () => {
        expect(calculateRating(300001)).toBe(Rating.C);
      });

      test('8分(480000ms)ちょうどでC評価になること', () => {
        expect(calculateRating(480000)).toBe(Rating.C);
      });

      test('8分+1ms(480001ms)でD評価になること', () => {
        expect(calculateRating(480001)).toBe(Rating.D);
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
      expect(result.title).toBe('伝説の英雄');
      expect(result.text).toContain('驚異的な速さ');
    });

    test('A評価のテキストが正しいこと', () => {
      const result = getEpilogueText(Rating.A);
      expect(result.title).toBe('熟練の冒険者');
      expect(result.text).toContain('見事な実力');
    });

    test('B評価のテキストが正しいこと', () => {
      const result = getEpilogueText(Rating.B);
      expect(result.title).toBe('確かな実力');
      expect(result.text).toContain('着実に');
    });

    test('C評価のテキストが正しいこと', () => {
      const result = getEpilogueText(Rating.C);
      expect(result.title).toBe('生還者');
      expect(result.text).toContain('無事に脱出');
    });

    test('D評価のテキストが正しいこと', () => {
      const result = getEpilogueText(Rating.D);
      expect(result.title).toBe('生存の証');
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
