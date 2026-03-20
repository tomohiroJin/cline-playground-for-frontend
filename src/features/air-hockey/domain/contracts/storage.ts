/**
 * ストレージポート（インターフェース）
 * - ドメイン層で定義し、インフラ層で実装する
 * - 依存性逆転の原則（DIP）に基づく抽象化
 */
import type {
  StoryProgress,
  UnlockState,
  DexProgress,
  AudioSettings,
  DailyChallengeResult,
} from '../types';

export interface GameStoragePort {
  // 実績
  loadAchievements(): string[];
  saveAchievements(ids: string[]): void;

  // ストーリー
  loadStoryProgress(): StoryProgress;
  saveStoryProgress(progress: StoryProgress): void;

  // アンロック
  loadUnlockState(): UnlockState;
  saveUnlockState(state: UnlockState): void;

  // 図鑑
  loadDexProgress(): DexProgress;
  saveDexProgress(progress: DexProgress): void;

  // オーディオ設定
  loadAudioSettings(): AudioSettings;
  saveAudioSettings(settings: AudioSettings): void;

  // デイリーチャレンジ
  loadDailyChallengeResult(date: string): DailyChallengeResult | undefined;
  saveDailyChallengeResult(date: string, result: DailyChallengeResult): void;

  // スコア
  loadHighScores(key: string): number[];
  saveHighScore(key: string, score: number): void;
}
