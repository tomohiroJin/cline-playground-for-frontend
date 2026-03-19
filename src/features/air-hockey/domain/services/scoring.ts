/**
 * スコアリングドメインサービス
 * - スコア管理の純粋関数
 */

export type Score = Readonly<{
  player: number;
  cpu: number;
}>;

export const Scoring = {
  /** 初期スコアを生成する */
  create(): Score {
    return { player: 0, cpu: 0 };
  },

  /** スコアを加算する */
  addScore(score: Score, scorer: 'player' | 'cpu'): Score {
    return {
      ...score,
      [scorer]: score[scorer] + 1,
    };
  },

  /** 勝者を判定する */
  getWinner(score: Score, winScore: number): 'player' | 'cpu' | null {
    if (score.player >= winScore) return 'player';
    if (score.cpu >= winScore) return 'cpu';
    return null;
  },
} as const;
