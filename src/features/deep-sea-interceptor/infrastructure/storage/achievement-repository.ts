// ============================================================================
// Deep Sea Interceptor - 実績リポジトリ
// ============================================================================

import type { SavedAchievementData } from '../../types';
import { loadAchievements, saveAchievements } from '../../achievements';

/** 実績永続化インターフェース */
export interface AchievementRepository {
  load(): SavedAchievementData;
  save(data: SavedAchievementData): void;
}

// 既存の関数を re-export
export { loadAchievements, saveAchievements };

/** localStorage ベースの実績リポジトリを生成 */
export function createLocalAchievementRepository(): AchievementRepository {
  return {
    load: () => loadAchievements(),
    save: (data: SavedAchievementData) => saveAchievements(data),
  };
}
