/**
 * 実績に関するドメイン型定義
 */

import type { SavedGameResult, GameHistoryEntry } from './game-result-types';

/** 実績のレア度 */
export type AchievementRarity = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

/** 実績定義 */
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  /** 実績判定関数 */
  check: (context: AchievementContext) => boolean;
}

/** 実績判定に使用するコンテキスト */
export interface AchievementContext {
  /** 今回のゲーム結果 */
  result: SavedGameResult;
  /** スプリントごとの正答率 */
  sprintCorrectRates: number[];
  /** 過去の実績達成状況 */
  unlockedIds: string[];
  /** 過去の全ゲーム履歴 */
  history: GameHistoryEntry[];
  /** 現在時刻（テスト用に注入可能） */
  now: Date;
}

/** 実績の達成状況 */
export interface AchievementProgress {
  /** 達成済み実績IDと達成日時 */
  unlocked: Record<string, number>;
}
