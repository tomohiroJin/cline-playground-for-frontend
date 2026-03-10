/**
 * Agile Quiz Sugoroku - 実績ストレージ
 *
 * localStorage による実績達成状況の永続化
 */
import { AchievementProgress } from './types';

const STORAGE_KEY = 'aqs_achievements';

/** デフォルトの実績進捗 */
const DEFAULT_PROGRESS: AchievementProgress = { unlocked: {} };

/** 実績進捗を読み込む */
export function loadAchievementProgress(): AchievementProgress {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { ...DEFAULT_PROGRESS, unlocked: {} };
    const parsed: AchievementProgress = JSON.parse(data);
    return { unlocked: { ...parsed.unlocked } };
  } catch {
    return { ...DEFAULT_PROGRESS, unlocked: {} };
  }
}

/** 実績をアンロックして保存（すでにアンロック済みなら上書きしない） */
export function saveAchievementUnlock(achievementId: string, timestamp: number): void {
  try {
    const progress = loadAchievementProgress();
    if (progress.unlocked[achievementId] !== undefined) return;
    progress.unlocked[achievementId] = timestamp;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage が利用できない場合は無視
  }
}

/** アンロック済み実績のIDリストを返す */
export function getUnlockedIds(): string[] {
  const progress = loadAchievementProgress();
  return Object.keys(progress.unlocked);
}

/** 実績進捗を削除する */
export function clearAchievementProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage が利用できない場合は無視
  }
}
