// ============================================================================
// Deep Sea Interceptor - スコアリポジトリ
// ============================================================================

/** スコア永続化インターフェース */
export interface ScoreRepository {
  getHighScore(key: string): number;
  saveScore(key: string, score: number): void;
}

/** localStorage ベースのスコアリポジトリ */
export function createLocalScoreRepository(): ScoreRepository {
  return {
    getHighScore(key: string): number {
      try {
        const raw = localStorage.getItem(key);
        return raw ? parseInt(raw, 10) || 0 : 0;
      } catch {
        return 0;
      }
    },
    saveScore(key: string, score: number): void {
      try {
        localStorage.setItem(key, String(score));
      } catch {
        // ストレージエラーは無視
      }
    },
  };
}
