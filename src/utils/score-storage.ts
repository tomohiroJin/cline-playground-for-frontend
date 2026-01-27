/**
 * スコア履歴の型定義
 */
export type ScoreRecord = {
  score: number;
  timestamp: number;
  difficulty?: string;
};

/**
 * スコアを保存する (Async interface for future IndexedDB compatibility)
 * @param gameId ゲームID
 * @param score スコア
 * @param difficulty 難易度（任意）
 */
export const saveScore = async (
  gameId: string,
  score: number,
  difficulty?: string
): Promise<void> => {
  try {
    const key = getStorageKey(gameId, difficulty);
    const scores = getScoresInternal(key);
    const newScore: ScoreRecord = {
      score,
      timestamp: Date.now(),
      difficulty,
    };

    scores.push(newScore);
    localStorage.setItem(key, JSON.stringify(scores));
  } catch (error) {
    console.error('Failed to save score:', error);
    throw error;
  }
};

/**
 * 指定されたゲーム（および難易度）のハイスコアを取得する
 * @param gameId ゲームID
 * @param difficulty 難易度（任意）
 * @param sortOrder ソート順 ('desc': 降順 [高スコア優先], 'asc': 昇順 [低タイム優先])
 * @returns ハイスコア（存在しない場合は0）
 */
export const getHighScore = async (
  gameId: string,
  difficulty?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<number> => {
  const scores = await getScores(gameId, undefined, difficulty, sortOrder); // 全件取得
  if (scores.length === 0) return 0;

  // getScoresでソート済み
  return scores[0].score;
};

/**
 * スコア履歴を取得する
 * @param gameId ゲームID
 * @param limit 取得件数制限
 * @param difficulty 難易度
 * @param sortOrder ソート順 ('desc': 降順, 'asc': 昇順)
 * @returns スコア履歴
 */
export const getScores = async (
  gameId: string,
  limit?: number,
  difficulty?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ScoreRecord[]> => {
  try {
    const key = getStorageKey(gameId, difficulty);
    const scores = getScoresInternal(key);

    // ソート
    scores.sort((a, b) => (sortOrder === 'desc' ? b.score - a.score : a.score - b.score));

    if (limit && limit > 0) {
      return scores.slice(0, limit);
    }
    return scores;
  } catch (error) {
    console.error('Failed to get scores:', error);
    return [];
  }
};

/**
 * スコア履歴をクリアする
 * @param gameId ゲームID
 * @param difficulty 難易度（任意）
 */
export const clearScores = async (gameId: string, difficulty?: string): Promise<void> => {
  const key = getStorageKey(gameId, difficulty);
  localStorage.removeItem(key);
};

/**
 * 内部用：ローカルストレージから配列を取得する
 */
const getScoresInternal = (key: string): ScoreRecord[] => {
  const json = localStorage.getItem(key);
  if (!json) return [];
  try {
    return JSON.parse(json) as ScoreRecord[];
  } catch {
    return [];
  }
};

/**
 * ストレージキーを生成する
 */
const getStorageKey = (gameId: string, difficulty?: string): string => {
  if (difficulty) {
    return `game_score_${gameId}_${difficulty}`;
  }
  return `game_score_${gameId}`;
};
