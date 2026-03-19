/**
 * MatchStats 値オブジェクト
 * - 試合統計の不変管理
 */
export type MatchStatsData = Readonly<{
  playerHits: number;
  cpuHits: number;
  maxPuckSpeed: number;
  playerItemsCollected: number;
  cpuItemsCollected: number;
  playerSaves: number;
  cpuSaves: number;
  matchDuration: number;
}>;

export const MatchStats = {
  /** 初期値を生成する */
  create(): MatchStatsData {
    return {
      playerHits: 0,
      cpuHits: 0,
      maxPuckSpeed: 0,
      playerItemsCollected: 0,
      cpuItemsCollected: 0,
      playerSaves: 0,
      cpuSaves: 0,
      matchDuration: 0,
    };
  },

  /** プレイヤーヒットを記録する */
  recordPlayerHit(stats: MatchStatsData): MatchStatsData {
    return { ...stats, playerHits: stats.playerHits + 1 };
  },

  /** CPU ヒットを記録する */
  recordCpuHit(stats: MatchStatsData): MatchStatsData {
    return { ...stats, cpuHits: stats.cpuHits + 1 };
  },

  /** 最大パック速度を更新する */
  updateMaxSpeed(stats: MatchStatsData, speed: number): MatchStatsData {
    if (speed <= stats.maxPuckSpeed) return stats;
    return { ...stats, maxPuckSpeed: speed };
  },
} as const;
