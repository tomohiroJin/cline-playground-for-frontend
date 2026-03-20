import { Scoring } from './scoring';

describe('Scoring ドメインサービス', () => {
  describe('create', () => {
    it('初期スコアは0-0', () => {
      const score = Scoring.create();
      expect(score.player).toBe(0);
      expect(score.cpu).toBe(0);
    });
  });

  describe('addScore', () => {
    it('プレイヤーにスコアを加算する', () => {
      const score = Scoring.create();
      const result = Scoring.addScore(score, 'player');
      expect(result.player).toBe(1);
      expect(result.cpu).toBe(0);
    });

    it('CPU にスコアを加算する', () => {
      const score = Scoring.create();
      const result = Scoring.addScore(score, 'cpu');
      expect(result.player).toBe(0);
      expect(result.cpu).toBe(1);
    });
  });

  describe('getWinner', () => {
    it('プレイヤーが勝利スコアに達した場合', () => {
      const score = { player: 3, cpu: 1 };
      expect(Scoring.getWinner(score, 3)).toBe('player');
    });

    it('CPU が勝利スコアに達した場合', () => {
      const score = { player: 1, cpu: 3 };
      expect(Scoring.getWinner(score, 3)).toBe('cpu');
    });

    it('まだ決着がついていない場合', () => {
      const score = { player: 2, cpu: 1 };
      expect(Scoring.getWinner(score, 3)).toBeNull();
    });
  });
});
