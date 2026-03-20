/**
 * テスト用インメモリストレージアダプタ
 * - localStorage を使わずにテスト可能
 * - GameStoragePort の完全実装
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

export class InMemoryStorageAdapter implements GameStoragePort {
  private achievements: string[] = [];
  private storyProgress: StoryProgress = { ...DEFAULT_STORY_PROGRESS, clearedStages: [] };
  private unlockState: UnlockState = {
    ...DEFAULT_UNLOCK_STATE,
    unlockedFields: [...DEFAULT_UNLOCK_STATE.unlockedFields],
    unlockedItems: [...DEFAULT_UNLOCK_STATE.unlockedItems],
  };
  private dexProgress: DexProgress = {
    ...DEFAULT_DEX_PROGRESS,
    unlockedCharacterIds: [...DEFAULT_DEX_PROGRESS.unlockedCharacterIds],
    newlyUnlockedIds: [],
  };
  private audioSettings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  private dailyChallengeResults: Map<string, DailyChallengeResult> = new Map();
  private highScores: Map<string, number[]> = new Map();

  // 実績
  loadAchievements(): string[] {
    return [...this.achievements];
  }

  saveAchievements(ids: string[]): void {
    this.achievements = [...ids];
  }

  // ストーリー
  loadStoryProgress(): StoryProgress {
    return { clearedStages: [...this.storyProgress.clearedStages] };
  }

  saveStoryProgress(progress: StoryProgress): void {
    this.storyProgress = { clearedStages: [...progress.clearedStages] };
  }

  // アンロック
  loadUnlockState(): UnlockState {
    return {
      unlockedFields: [...this.unlockState.unlockedFields],
      unlockedItems: [...this.unlockState.unlockedItems],
      totalWins: this.unlockState.totalWins,
    };
  }

  saveUnlockState(state: UnlockState): void {
    this.unlockState = {
      unlockedFields: [...state.unlockedFields],
      unlockedItems: [...state.unlockedItems],
      totalWins: state.totalWins,
    };
  }

  // 図鑑
  loadDexProgress(): DexProgress {
    return {
      unlockedCharacterIds: [...this.dexProgress.unlockedCharacterIds],
      newlyUnlockedIds: [...this.dexProgress.newlyUnlockedIds],
    };
  }

  saveDexProgress(progress: DexProgress): void {
    this.dexProgress = {
      unlockedCharacterIds: [...progress.unlockedCharacterIds],
      newlyUnlockedIds: [...progress.newlyUnlockedIds],
    };
  }

  // オーディオ設定
  loadAudioSettings(): AudioSettings {
    return { ...this.audioSettings };
  }

  saveAudioSettings(settings: AudioSettings): void {
    this.audioSettings = { ...settings };
  }

  // デイリーチャレンジ
  loadDailyChallengeResult(date: string): DailyChallengeResult | undefined {
    const result = this.dailyChallengeResults.get(date);
    return result ? { ...result } : undefined;
  }

  saveDailyChallengeResult(date: string, result: DailyChallengeResult): void {
    this.dailyChallengeResults.set(date, { ...result });
  }

  // スコア
  loadHighScores(key: string): number[] {
    return [...(this.highScores.get(key) ?? [])];
  }

  saveHighScore(key: string, score: number): void {
    const scores = this.highScores.get(key) ?? [];
    scores.push(score);
    scores.sort((a, b) => b - a);
    this.highScores.set(key, scores);
  }
}
