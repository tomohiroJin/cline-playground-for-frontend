import { MatchStats } from './match-stats';

describe('MatchStats 値オブジェクト', () => {
  describe('create', () => {
    it('初期値は全て0', () => {
      const stats = MatchStats.create();
      expect(stats.playerHits).toBe(0);
      expect(stats.cpuHits).toBe(0);
      expect(stats.maxPuckSpeed).toBe(0);
      expect(stats.matchDuration).toBe(0);
    });
  });

  describe('recordPlayerHit', () => {
    it('プレイヤーヒット数が増加する', () => {
      const stats = MatchStats.create();
      const result = MatchStats.recordPlayerHit(stats);
      expect(result.playerHits).toBe(1);
    });

    it('元のオブジェクトを変更しない', () => {
      const stats = MatchStats.create();
      MatchStats.recordPlayerHit(stats);
      expect(stats.playerHits).toBe(0);
    });
  });

  describe('updateMaxSpeed', () => {
    it('より速い速度で更新される', () => {
      const stats = MatchStats.create();
      const result = MatchStats.updateMaxSpeed(stats, 10);
      expect(result.maxPuckSpeed).toBe(10);
    });

    it('より遅い速度では更新されない', () => {
      const stats = { ...MatchStats.create(), maxPuckSpeed: 10 };
      const result = MatchStats.updateMaxSpeed(stats, 5);
      expect(result.maxPuckSpeed).toBe(10);
    });
  });
});
