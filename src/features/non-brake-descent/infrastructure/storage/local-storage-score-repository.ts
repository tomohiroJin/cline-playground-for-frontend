import { getHighScore, saveScore } from '../../../../utils/score-storage';
import { ScoreRepository } from './score-repository';

/**
 * localStorage を使用したスコアリポジトリ実装
 * 既存の score-storage ユーティリティに委譲する
 */
export const createLocalStorageScoreRepository = (): ScoreRepository => ({
  getHighScore: (key: string) => getHighScore(key),
  saveScore: (key: string, score: number) => saveScore(key, score),
});
