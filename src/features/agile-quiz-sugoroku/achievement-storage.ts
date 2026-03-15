/**
 * Agile Quiz Sugoroku - 実績ストレージ
 *
 * 後方互換用の再エクスポート。
 * 実装は infrastructure/storage/achievement-repository.ts に移行済み。
 */
import { AchievementProgress } from './types';
import { LocalStorageAdapter } from './infrastructure/storage/local-storage-adapter';
import { AchievementRepository } from './infrastructure/storage/achievement-repository';

const repository = new AchievementRepository(new LocalStorageAdapter());

/** 実績進捗を読み込む */
export function loadAchievementProgress(): AchievementProgress {
  return repository.loadProgress();
}

/** 実績をアンロックして保存（すでにアンロック済みなら上書きしない） */
export function saveAchievementUnlock(achievementId: string, timestamp: number): void {
  repository.saveUnlock(achievementId, timestamp);
}

/** アンロック済み実績のIDリストを返す */
export function getUnlockedIds(): string[] {
  return repository.getUnlockedIds();
}

/** 実績進捗を削除する */
export function clearAchievementProgress(): void {
  repository.clear();
}
