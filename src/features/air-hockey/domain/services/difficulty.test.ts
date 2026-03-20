import { recordMatchResult, getSuggestedDifficulty, STREAK_THRESHOLD } from './difficulty';

describe('難易度調整ドメインサービス', () => {
  describe('recordMatchResult', () => {
    it('勝利で winStreak が増加し loseStreak がリセットされる', () => {
      const result = recordMatchResult({ winStreak: 1, loseStreak: 2 }, true);
      expect(result.winStreak).toBe(2);
      expect(result.loseStreak).toBe(0);
    });

    it('敗北で loseStreak が増加し winStreak がリセットされる', () => {
      const result = recordMatchResult({ winStreak: 2, loseStreak: 0 }, false);
      expect(result.winStreak).toBe(0);
      expect(result.loseStreak).toBe(1);
    });
  });

  describe('getSuggestedDifficulty', () => {
    it('連敗が閾値以上で難易度を下げる', () => {
      const result = getSuggestedDifficulty(
        { winStreak: 0, loseStreak: STREAK_THRESHOLD },
        'normal'
      );
      expect(result).toBe('easy');
    });

    it('連勝が閾値以上で難易度を上げる', () => {
      const result = getSuggestedDifficulty(
        { winStreak: STREAK_THRESHOLD, loseStreak: 0 },
        'normal'
      );
      expect(result).toBe('hard');
    });

    it('閾値未満なら提案なし', () => {
      const result = getSuggestedDifficulty(
        { winStreak: 1, loseStreak: 0 },
        'normal'
      );
      expect(result).toBeUndefined();
    });

    it('最低難易度で連敗しても下がらない', () => {
      const result = getSuggestedDifficulty(
        { winStreak: 0, loseStreak: STREAK_THRESHOLD },
        'easy'
      );
      expect(result).toBeUndefined();
    });

    it('最高難易度で連勝しても上がらない', () => {
      const result = getSuggestedDifficulty(
        { winStreak: STREAK_THRESHOLD, loseStreak: 0 },
        'hard'
      );
      expect(result).toBeUndefined();
    });
  });
});
