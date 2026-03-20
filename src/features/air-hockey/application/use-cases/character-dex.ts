/**
 * キャラクター図鑑ユースケース
 * - アンロック判定
 * - 図鑑進行管理
 * - 新規通知の既読処理
 */
import type { GameStoragePort } from '../../domain/contracts/storage';
import type { StoryProgress, DexProgress } from '../../domain/types';
import { checkNewUnlocks, markAsViewed } from '../../core/dex';

export class CharacterDexUseCase {
  constructor(private readonly storage: GameStoragePort) {}

  /** 図鑑進行を取得する */
  getProgress(): DexProgress {
    return this.storage.loadDexProgress();
  }

  /** ストーリー進行に基づいてアンロック判定を実行する */
  checkAndUnlock(storyProgress: StoryProgress): string[] {
    const currentProgress = this.storage.loadDexProgress();
    const newUnlocks = checkNewUnlocks(storyProgress, currentProgress);

    if (newUnlocks.length > 0) {
      const updated: DexProgress = {
        unlockedCharacterIds: [...currentProgress.unlockedCharacterIds, ...newUnlocks],
        newlyUnlockedIds: [...currentProgress.newlyUnlockedIds, ...newUnlocks],
      };
      this.storage.saveDexProgress(updated);
    }

    return newUnlocks;
  }

  /** 新規アンロック通知を既読にする */
  markViewed(characterIds: string[]): void {
    const progress = this.storage.loadDexProgress();
    const updated = markAsViewed(progress, characterIds);
    this.storage.saveDexProgress(updated);
  }

  /** 個別のアンロック判定 */
  isUnlocked(characterId: string): boolean {
    const progress = this.storage.loadDexProgress();
    return progress.unlockedCharacterIds.includes(characterId);
  }

  /** 未確認の新規アンロック数を取得する */
  getNewUnlockCount(): number {
    const progress = this.storage.loadDexProgress();
    return progress.newlyUnlockedIds.length;
  }
}
