// StoragePort の localStorage 実装（既存 score-storage のアダプター）

import type { StoragePort } from '../../application/ports/storage-port';
import { saveScore as saveFn, getHighScore as getHighFn } from '../../../../utils/score-storage';

/** 既存 score-storage ユーティリティを StoragePort として公開 */
export const createLocalStorageRepository = (): StoragePort => ({
  async saveScore(gameId: string, score: number, key: string): Promise<void> {
    await saveFn(gameId, score, key);
  },

  async getHighScore(gameId: string, key: string, order: 'asc' | 'desc'): Promise<number> {
    return getHighFn(gameId, key, order);
  },
});
