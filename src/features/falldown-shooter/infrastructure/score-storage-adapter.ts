// ScoreStorageAdapter — スコア保存の抽象化（Repository パターン）

import { saveScore, getHighScore, getScores } from '../../../utils/score-storage';
import type { ScoreRecord } from '../../../utils/score-storage';
import type { Difficulty } from '../types';

/** スコアリポジトリインターフェース */
export interface IScoreRepository {
  saveScore(gameId: string, score: number, difficulty: Difficulty): Promise<void>;
  getHighScore(gameId: string, difficulty: Difficulty): Promise<number>;
  getScores(gameId: string, limit?: number, difficulty?: Difficulty): Promise<ScoreRecord[]>;
}

/** localStorage ベースのスコアリポジトリ実装 */
export class ScoreStorageAdapter implements IScoreRepository {
  async saveScore(gameId: string, score: number, difficulty: Difficulty): Promise<void> {
    return saveScore(gameId, score, difficulty);
  }

  async getHighScore(gameId: string, difficulty: Difficulty): Promise<number> {
    return getHighScore(gameId, difficulty);
  }

  async getScores(gameId: string, limit?: number, difficulty?: Difficulty): Promise<ScoreRecord[]> {
    return getScores(gameId, limit, difficulty);
  }
}
