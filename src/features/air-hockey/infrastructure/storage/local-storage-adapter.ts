/**
 * localStorage アダプタ
 * - GameStoragePort の具象実装
 * - try-catch による破損時フォールバック
 * - JSON パース + バリデーション
 */
import type { GameStoragePort } from '../../domain/contracts/storage';
import type {
  StoryProgress,
  UnlockState,
  DexProgress,
  AudioSettings,
  DailyChallengeResult,
} from '../../domain/types';
import {
  DEFAULT_STORY_PROGRESS,
  DEFAULT_UNLOCK_STATE,
  DEFAULT_DEX_PROGRESS,
  DEFAULT_AUDIO_SETTINGS,
} from '../../domain/constants/defaults';

// ストレージキー定数
// 既存 core/ モジュールのキーと一致させてデータ互換性を維持する
const KEYS = {
  ACHIEVEMENTS: 'air_hockey_achievements',
  STORY_PROGRESS: 'ah_story_progress',
  UNLOCK_STATE: 'ah_unlock_state',
  DEX_PROGRESS: 'ah_dex_progress',
  AUDIO_SETTINGS: 'air_hockey_audio_settings',
  DAILY_CHALLENGE: 'ah_daily_challenge',
  HIGH_SCORES: 'ah_high_scores',
} as const;

// 型ガード
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item: unknown) => typeof item === 'string');

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item: unknown) => typeof item === 'number');

const isStoryProgress = (value: unknown): value is StoryProgress => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isStringArray(candidate.clearedStages);
};

const isDexProgress = (value: unknown): value is DexProgress => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isStringArray(candidate.unlockedCharacterIds) &&
    isStringArray(candidate.newlyUnlockedIds)
  );
};

const isAudioSettings = (value: unknown): value is AudioSettings => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.bgmVolume === 'number' &&
    typeof candidate.seVolume === 'number' &&
    typeof candidate.muted === 'boolean'
  );
};

/** JSON を安全にパースする（失敗時は undefined） */
const safeParse = (raw: string | null): unknown => {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export class LocalStorageAdapter implements GameStoragePort {
  // 実績
  loadAchievements(): string[] {
    const parsed = safeParse(localStorage.getItem(KEYS.ACHIEVEMENTS));
    return isStringArray(parsed) ? parsed : [];
  }

  saveAchievements(ids: string[]): void {
    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(ids));
  }

  // ストーリー
  loadStoryProgress(): StoryProgress {
    const parsed = safeParse(localStorage.getItem(KEYS.STORY_PROGRESS));
    return isStoryProgress(parsed) ? parsed : { ...DEFAULT_STORY_PROGRESS, clearedStages: [] };
  }

  saveStoryProgress(progress: StoryProgress): void {
    localStorage.setItem(KEYS.STORY_PROGRESS, JSON.stringify(progress));
  }

  // アンロック
  loadUnlockState(): UnlockState {
    const parsed = safeParse(localStorage.getItem(KEYS.UNLOCK_STATE));
    if (typeof parsed === 'object' && parsed !== null) {
      const candidate = parsed as Record<string, unknown>;
      if (
        Array.isArray(candidate.unlockedFields) &&
        Array.isArray(candidate.unlockedItems) &&
        typeof candidate.totalWins === 'number'
      ) {
        return parsed as UnlockState;
      }
    }
    return {
      unlockedFields: [...DEFAULT_UNLOCK_STATE.unlockedFields],
      unlockedItems: [...DEFAULT_UNLOCK_STATE.unlockedItems],
      totalWins: DEFAULT_UNLOCK_STATE.totalWins,
    };
  }

  saveUnlockState(state: UnlockState): void {
    localStorage.setItem(KEYS.UNLOCK_STATE, JSON.stringify(state));
  }

  // 図鑑
  loadDexProgress(): DexProgress {
    const parsed = safeParse(localStorage.getItem(KEYS.DEX_PROGRESS));
    if (isDexProgress(parsed)) return parsed;
    return {
      unlockedCharacterIds: [...DEFAULT_DEX_PROGRESS.unlockedCharacterIds],
      newlyUnlockedIds: [],
    };
  }

  saveDexProgress(progress: DexProgress): void {
    localStorage.setItem(KEYS.DEX_PROGRESS, JSON.stringify(progress));
  }

  // オーディオ設定
  loadAudioSettings(): AudioSettings {
    const parsed = safeParse(localStorage.getItem(KEYS.AUDIO_SETTINGS));
    return isAudioSettings(parsed) ? parsed : { ...DEFAULT_AUDIO_SETTINGS };
  }

  saveAudioSettings(settings: AudioSettings): void {
    localStorage.setItem(KEYS.AUDIO_SETTINGS, JSON.stringify(settings));
  }

  // デイリーチャレンジ
  loadDailyChallengeResult(date: string): DailyChallengeResult | undefined {
    const parsed = safeParse(localStorage.getItem(KEYS.DAILY_CHALLENGE));
    if (typeof parsed === 'object' && parsed !== null) {
      const results = parsed as Record<string, DailyChallengeResult>;
      return results[date];
    }
    return undefined;
  }

  saveDailyChallengeResult(date: string, result: DailyChallengeResult): void {
    let results: Record<string, DailyChallengeResult> = {};
    const parsed = safeParse(localStorage.getItem(KEYS.DAILY_CHALLENGE));
    if (typeof parsed === 'object' && parsed !== null) {
      results = parsed as Record<string, DailyChallengeResult>;
    }
    results[date] = result;
    localStorage.setItem(KEYS.DAILY_CHALLENGE, JSON.stringify(results));
  }

  // スコア
  loadHighScores(key: string): number[] {
    const parsed = safeParse(localStorage.getItem(KEYS.HIGH_SCORES));
    if (typeof parsed === 'object' && parsed !== null) {
      const all = parsed as Record<string, number[]>;
      const scores = all[key];
      return isNumberArray(scores) ? scores : [];
    }
    return [];
  }

  saveHighScore(key: string, score: number): void {
    let all: Record<string, number[]> = {};
    const parsed = safeParse(localStorage.getItem(KEYS.HIGH_SCORES));
    if (typeof parsed === 'object' && parsed !== null) {
      all = parsed as Record<string, number[]>;
    }
    const scores = all[key] ?? [];
    scores.push(score);
    scores.sort((a, b) => b - a);
    all[key] = scores;
    localStorage.setItem(KEYS.HIGH_SCORES, JSON.stringify(all));
  }
}
