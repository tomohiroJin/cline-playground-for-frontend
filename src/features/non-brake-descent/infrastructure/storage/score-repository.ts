/**
 * スコア永続化のリポジトリインターフェース
 * アプリケーション層からスコアの保存・取得を行うための抽象化
 */
export interface ScoreRepository {
  /** 指定キーのハイスコアを取得する */
  getHighScore(key: string): Promise<number>;
  /** 指定キーにスコアを保存する */
  saveScore(key: string, score: number): Promise<void>;
}
