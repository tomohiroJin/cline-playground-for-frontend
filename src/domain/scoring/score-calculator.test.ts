import { calculateScore, SCORE_CONSTANTS, determineRank, RANK_THRESHOLDS } from './score-calculator';

describe('ScoreCalculator', () => {
  describe('calculateScore', () => {
    it('最小手数・最短時間・ヒント未使用で高スコアを返す', () => {
      const score = calculateScore({
        actualMoves: 10,
        optimalMoves: 10,
        elapsedSeconds: 0,
        hintUsed: false,
        division: 4,
      });
      expect(score.totalScore).toBe(SCORE_CONSTANTS.BASE_SCORE);
      expect(score.rank).toBe('★★★');
    });

    it('手数超過でペナルティが適用される', () => {
      const score = calculateScore({
        actualMoves: 20,
        optimalMoves: 10,
        elapsedSeconds: 0,
        hintUsed: false,
        division: 4,
      });
      const expectedPenalty = 10 * SCORE_CONSTANTS.MOVE_PENALTY_PER;
      expect(score.totalScore).toBe(SCORE_CONSTANTS.BASE_SCORE - expectedPenalty);
    });

    it('経過時間でペナルティが適用される', () => {
      const score = calculateScore({
        actualMoves: 10,
        optimalMoves: 10,
        elapsedSeconds: 60,
        hintUsed: false,
        division: 4,
      });
      const expectedPenalty = 60 * SCORE_CONSTANTS.TIME_PENALTY_PER;
      expect(score.totalScore).toBe(SCORE_CONSTANTS.BASE_SCORE - expectedPenalty);
    });

    it('ヒント使用でペナルティが適用される', () => {
      const score = calculateScore({
        actualMoves: 10,
        optimalMoves: 10,
        elapsedSeconds: 0,
        hintUsed: true,
        division: 4,
      });
      expect(score.totalScore).toBe(SCORE_CONSTANTS.BASE_SCORE - SCORE_CONSTANTS.HINT_PENALTY);
    });

    it('難易度倍率が適用される', () => {
      const scoreDiv2 = calculateScore({
        actualMoves: 10,
        optimalMoves: 10,
        elapsedSeconds: 0,
        hintUsed: false,
        division: 2,
      });
      const scoreDiv4 = calculateScore({
        actualMoves: 10,
        optimalMoves: 10,
        elapsedSeconds: 0,
        hintUsed: false,
        division: 4,
      });
      expect(scoreDiv4.totalScore).toBeGreaterThan(scoreDiv2.totalScore);
    });

    it('スコアは0未満にならない', () => {
      const score = calculateScore({
        actualMoves: 1000,
        optimalMoves: 10,
        elapsedSeconds: 10000,
        hintUsed: true,
        division: 2,
      });
      expect(score.totalScore).toBe(0);
    });

    it('返却値にすべてのフィールドが含まれる', () => {
      const score = calculateScore({
        actualMoves: 10,
        optimalMoves: 8,
        elapsedSeconds: 30,
        hintUsed: false,
        division: 4,
      });
      expect(score).toHaveProperty('totalScore');
      expect(score).toHaveProperty('moveCount', 10);
      expect(score).toHaveProperty('elapsedTime', 30);
      expect(score).toHaveProperty('hintUsed', false);
      expect(score).toHaveProperty('division', 4);
      expect(score).toHaveProperty('rank');
      expect(score).toHaveProperty('shuffleMoves', 8);
    });
  });

  describe('determineRank', () => {
    it('8000以上は★★★', () => {
      expect(determineRank(RANK_THRESHOLDS.THREE_STAR)).toBe('★★★');
      expect(determineRank(10000)).toBe('★★★');
    });

    it('5000〜7999は★★☆', () => {
      expect(determineRank(RANK_THRESHOLDS.TWO_STAR)).toBe('★★☆');
      expect(determineRank(7999)).toBe('★★☆');
    });

    it('2000〜4999は★☆☆', () => {
      expect(determineRank(RANK_THRESHOLDS.ONE_STAR)).toBe('★☆☆');
      expect(determineRank(4999)).toBe('★☆☆');
    });

    it('2000未満はクリア', () => {
      expect(determineRank(1999)).toBe('クリア');
      expect(determineRank(0)).toBe('クリア');
    });
  });
});
