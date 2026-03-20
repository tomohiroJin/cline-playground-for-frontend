// 永続化ポートインターフェース

export interface StoragePort {
  /** スコアの保存 */
  saveScore(gameId: string, score: number, key: string): Promise<void>;
  /** ハイスコアの取得 */
  getHighScore(gameId: string, key: string, order: 'asc' | 'desc'): Promise<number>;
}
