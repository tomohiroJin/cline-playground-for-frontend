/**
 * 図鑑アンロックシステム（P2-02）
 *
 * キャラクター図鑑の永続化・アンロック判定・既読処理を提供する。
 * ストレージキー: 'ah_dex_progress'
 */
import type { DexProgress } from './types';
import type { StoryProgress } from './story';
import { DEX_ENTRIES } from './dex-data';

export const DEX_STORAGE_KEY = 'ah_dex_progress';

/** デフォルトの初期状態（初期解放キャラを含む） */
export const DEFAULT_DEX_PROGRESS: DexProgress = {
  unlockedCharacterIds: ['player'],
  newlyUnlockedIds: [],
};

/** デフォルト状態のコピーを生成する（参照共有を防ぐ） */
const createDefaultProgress = (): DexProgress => ({
  unlockedCharacterIds: [...DEFAULT_DEX_PROGRESS.unlockedCharacterIds],
  newlyUnlockedIds: [...DEFAULT_DEX_PROGRESS.newlyUnlockedIds],
});

/** 型ガード: DexProgress の構造を検証する */
const isDexProgress = (value: unknown): value is DexProgress => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.unlockedCharacterIds) &&
    candidate.unlockedCharacterIds.every(
      (item: unknown) => typeof item === 'string'
    ) &&
    Array.isArray(candidate.newlyUnlockedIds) &&
    candidate.newlyUnlockedIds.every(
      (item: unknown) => typeof item === 'string'
    )
  );
};

/** localStorage から図鑑進行を読み込む（破損時はデフォルト値を返す） */
export const loadDexProgress = (): DexProgress => {
  const raw = localStorage.getItem(DEX_STORAGE_KEY);
  if (!raw) return createDefaultProgress();

  try {
    const parsed: unknown = JSON.parse(raw);
    return isDexProgress(parsed) ? parsed : createDefaultProgress();
  } catch {
    return createDefaultProgress();
  }
};

/** localStorage に図鑑進行を保存する */
export const saveDexProgress = (progress: DexProgress): void => {
  localStorage.setItem(DEX_STORAGE_KEY, JSON.stringify(progress));
};

/** 図鑑進行をリセットする */
export const resetDexProgress = (): void => {
  localStorage.removeItem(DEX_STORAGE_KEY);
};

/**
 * ストーリー進行状態から新規アンロック対象を判定する
 * @returns 新しくアンロックされたキャラID の配列
 */
export const checkNewUnlocks = (
  storyProgress: StoryProgress,
  currentDexProgress: DexProgress
): string[] => {
  const newUnlocks: string[] = [];

  for (const entry of DEX_ENTRIES) {
    const { characterId } = entry.profile;
    const { unlockCondition } = entry;

    // 既にアンロック済みならスキップ
    if (currentDexProgress.unlockedCharacterIds.includes(characterId)) {
      continue;
    }

    // 初期解放キャラはここには来ない（DEFAULT_DEX_PROGRESS に含まれるため）
    if (unlockCondition.type === 'story-clear') {
      if (storyProgress.clearedStages.includes(unlockCondition.stageId)) {
        newUnlocks.push(characterId);
      }
    }
  }

  return newUnlocks;
};

/**
 * 新規アンロック通知を既読にする
 * @returns 更新後の DexProgress
 */
export const markAsViewed = (
  progress: DexProgress,
  characterIds: string[]
): DexProgress => ({
  ...progress,
  newlyUnlockedIds: progress.newlyUnlockedIds.filter(
    (id) => !characterIds.includes(id)
  ),
});
