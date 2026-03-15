/**
 * 実績リポジトリ
 *
 * 実績達成状況の永続化を管理する。
 */
import { AchievementProgress } from '../../domain/types';
import { StoragePort } from './storage-port';

const STORAGE_KEY = 'aqs_achievements';

const DEFAULT_PROGRESS: AchievementProgress = { unlocked: {} };

export class AchievementRepository {
  constructor(private readonly storage: StoragePort) {}

  /** 実績進捗を読み込む */
  loadProgress(): AchievementProgress {
    const data = this.storage.get<AchievementProgress>(STORAGE_KEY);
    if (!data) return { ...DEFAULT_PROGRESS, unlocked: {} };
    return { unlocked: { ...data.unlocked } };
  }

  /** 実績をアンロックして保存する（既にアンロック済みなら上書きしない） */
  saveUnlock(achievementId: string, timestamp: number): void {
    const progress = this.loadProgress();
    if (progress.unlocked[achievementId] !== undefined) return;
    progress.unlocked[achievementId] = timestamp;
    this.storage.set(STORAGE_KEY, progress);
  }

  /** アンロック済み実績の ID リストを返す */
  getUnlockedIds(): string[] {
    const progress = this.loadProgress();
    return Object.keys(progress.unlocked);
  }

  /** 実績進捗を全て削除する */
  clear(): void {
    this.storage.remove(STORAGE_KEY);
  }
}
