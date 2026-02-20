import { calculateScore, determineRank } from './score-utils';

describe('score-utils', () => {
  describe('determineRank', () => {
    it('8000以上は★★★を返すこと', () => {
      expect(determineRank(8000)).toBe('★★★');
      expect(determineRank(10000)).toBe('★★★');
    });

    it('5000以上8000未満は★★☆を返すこと', () => {
      expect(determineRank(5000)).toBe('★★☆');
      expect(determineRank(7999)).toBe('★★☆');
    });

    it('2000以上5000未満は★☆☆を返すこと', () => {
      expect(determineRank(2000)).toBe('★☆☆');
      expect(determineRank(4999)).toBe('★☆☆');
    });

    it('2000未満はクリアを返すこと', () => {
      expect(determineRank(1999)).toBe('クリア');
      expect(determineRank(0)).toBe('クリア');
    });
  });

  describe('calculateScore', () => {
    it('最適手数・短時間・ヒントなし・4x4で高スコアを返すこと', () => {
      const score = calculateScore(32, 32, 30, false, 4);
      // (10000 - 0 - 300 - 0) * 1.0 = 9700
      expect(score.totalScore).toBe(9700);
      expect(score.rank).toBe('★★★');
      expect(score.moveCount).toBe(32);
      expect(score.elapsedTime).toBe(30);
      expect(score.hintUsed).toBe(false);
      expect(score.division).toBe(4);
      expect(score.shuffleMoves).toBe(32);
    });

    it('ヒント使用でペナルティが適用されること', () => {
      const withHint = calculateScore(32, 32, 30, true, 4);
      const withoutHint = calculateScore(32, 32, 30, false, 4);
      expect(withoutHint.totalScore - withHint.totalScore).toBe(1000);
    });

    it('超過手数にペナルティが適用されること', () => {
      const optimal = calculateScore(32, 32, 30, false, 4);
      const overMoves = calculateScore(42, 32, 30, false, 4);
      // 10手超過 * 50 = 500
      expect(optimal.totalScore - overMoves.totalScore).toBe(500);
    });

    it('手数が最適手数以下の場合はペナルティなしであること', () => {
      const underMoves = calculateScore(20, 32, 30, false, 4);
      const optimalMoves = calculateScore(32, 32, 30, false, 4);
      // 最適手数以下でも超過なしなので同じ
      expect(underMoves.totalScore).toBe(optimalMoves.totalScore);
    });

    it('難易度2x2で低い乗数が適用されること', () => {
      const score = calculateScore(8, 8, 10, false, 2);
      // (10000 - 0 - 100 - 0) * 0.3 = 2970
      expect(score.totalScore).toBe(2970);
      expect(score.rank).toBe('★☆☆');
    });

    it('難易度32x32で高い乗数が適用されること', () => {
      const score = calculateScore(2048, 2048, 300, false, 32);
      // (10000 - 0 - 3000 - 0) * 20.0 = 140000
      expect(score.totalScore).toBe(140000);
      expect(score.rank).toBe('★★★');
    });

    it('スコアが0未満にならないこと', () => {
      const score = calculateScore(1000, 32, 9999, true, 4);
      expect(score.totalScore).toBe(0);
      expect(score.rank).toBe('クリア');
    });

    it('未定義の難易度では乗数1.0が適用されること', () => {
      const score = calculateScore(32, 32, 30, false, 7);
      // (10000 - 0 - 300 - 0) * 1.0 = 9700
      expect(score.totalScore).toBe(9700);
    });
  });
});
