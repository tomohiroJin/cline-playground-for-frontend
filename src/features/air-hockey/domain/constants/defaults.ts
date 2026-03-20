/**
 * ストレージ関連のデフォルト値
 * - LocalStorageAdapter / InMemoryStorageAdapter が共通参照する
 * - 既存 core/ モジュールのデフォルト値と一致させること
 */
import type { StoryProgress, UnlockState, DexProgress, AudioSettings } from '../types';

/** ストーリー進行のデフォルト値 */
export const DEFAULT_STORY_PROGRESS: StoryProgress = { clearedStages: [] };

/** アンロック状態のデフォルト値 */
export const DEFAULT_UNLOCK_STATE: UnlockState = {
  unlockedFields: ['classic', 'wide'],
  unlockedItems: ['split', 'speed', 'invisible'],
  totalWins: 0,
};

/** 図鑑進行のデフォルト値 */
export const DEFAULT_DEX_PROGRESS: DexProgress = {
  unlockedCharacterIds: ['player'],
  newlyUnlockedIds: [],
};

/** オーディオ設定のデフォルト値 */
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  bgmVolume: 50,
  seVolume: 50,
  muted: false,
};
