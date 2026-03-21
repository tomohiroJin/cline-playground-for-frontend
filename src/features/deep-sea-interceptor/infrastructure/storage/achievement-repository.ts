// ============================================================================
// Deep Sea Interceptor - 実績リポジトリ
// ============================================================================

import type { SavedAchievementData } from '../../types';

/** 実績永続化インターフェース */
export interface AchievementRepository {
  load(): SavedAchievementData;
  save(data: SavedAchievementData): void;
}

// 既存の loadAchievements/saveAchievements を AchievementRepository として提供
export { loadAchievements, saveAchievements } from '../../achievements';

/** localStorage ベースの実績リポジトリを生成 */
export function createLocalAchievementRepository(): AchievementRepository {
  return {
    load: () => {
      const { loadAchievements: load } = require('../../achievements');
      return load();
    },
    save: (data: SavedAchievementData) => {
      const { saveAchievements: save } = require('../../achievements');
      save(data);
    },
  };
}
