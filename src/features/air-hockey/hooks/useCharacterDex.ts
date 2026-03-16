/**
 * キャラクター図鑑カスタムフック（P2-02）
 *
 * 図鑑の状態管理（アンロック・未確認通知・コンプリート率）を提供する。
 */
import { useState, useCallback, useMemo } from 'react';
import type { DexEntry } from '../core/types';
import type { StoryProgress } from '../core/story';
import { getVisibleDexEntries } from '../core/dex-data';
import {
  loadDexProgress,
  saveDexProgress,
  checkNewUnlocks,
  markAsViewed as markAsViewedCore,
} from '../core/dex';

/** useCharacterDex フックの返り値の型 */
export type UseCharacterDexReturn = {
  dexEntries: DexEntry[];
  unlockedIds: string[];
  newlyUnlockedIds: string[];
  completionRate: number;
  checkAndUnlock: (storyProgress: StoryProgress) => string[];
  markViewed: (characterIds: string[]) => void;
  isUnlocked: (characterId: string) => boolean;
  getNewUnlockCount: () => number;
};

export const useCharacterDex = (): UseCharacterDexReturn => {
  const [dexProgress, setDexProgress] = useState(() => loadDexProgress());

  const dexEntries: DexEntry[] = useMemo(() => getVisibleDexEntries(), []);

  const unlockedIds = dexProgress.unlockedCharacterIds;
  const newlyUnlockedIds = dexProgress.newlyUnlockedIds;

  const completionRate = useMemo(
    () => unlockedIds.length / dexEntries.length,
    [unlockedIds.length, dexEntries.length]
  );

  /** アンロック判定を実行し、新規アンロックがあれば永続化する */
  const checkAndUnlock = useCallback(
    (storyProgress: StoryProgress): string[] => {
      const currentProgress = loadDexProgress();
      const newUnlocks = checkNewUnlocks(storyProgress, currentProgress);

      if (newUnlocks.length > 0) {
        const updated = {
          unlockedCharacterIds: [
            ...currentProgress.unlockedCharacterIds,
            ...newUnlocks,
          ],
          newlyUnlockedIds: [
            ...currentProgress.newlyUnlockedIds,
            ...newUnlocks,
          ],
        };
        saveDexProgress(updated);
        setDexProgress(updated);
      }

      return newUnlocks;
    },
    []
  );

  /** 未確認アンロック通知を既読にする */
  const markViewed = useCallback(
    (characterIds: string[]) => {
      const updated = markAsViewedCore(dexProgress, characterIds);
      saveDexProgress(updated);
      setDexProgress(updated);
    },
    [dexProgress]
  );

  /** 個別のアンロック判定 */
  const isUnlocked = useCallback(
    (characterId: string): boolean =>
      unlockedIds.includes(characterId),
    [unlockedIds]
  );

  /** 未確認の新規アンロック数を取得 */
  const getNewUnlockCount = useCallback(
    (): number => newlyUnlockedIds.length,
    [newlyUnlockedIds]
  );

  return {
    dexEntries,
    unlockedIds,
    newlyUnlockedIds,
    completionRate,
    checkAndUnlock,
    markViewed,
    isUnlocked,
    getNewUnlockCount,
  };
};
