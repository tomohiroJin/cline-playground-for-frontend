/**
 * スコアリング・分類に関するドメイン型定義
 */

import type { SprintSummary } from './game-types';
import type { TagStats } from './quiz-types';

/** 派生データ */
export interface DerivedStats {
  correctRate: number;
  averageSpeed: number;
  stability: number;
  sprintCorrectRates: number[];
}

/** タイプ分類用統計 */
export interface ClassifyStats {
  stab: number;
  debt: number;
  emSuc: number;
  sc: number[];
  tp: number;
  spd: number;
}

/** エンジニアタイプ（後方互換性のため残存） */
export interface EngineerType {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  condition: (stats: ClassifyStats) => boolean;
}

/** チームタイプ */
export interface TeamType {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  feedback: string;
  nextStep: string;
  condition: (stats: ClassifyStats) => boolean;
}

/** グレード情報 */
export interface Grade {
  min: number;
  grade: string;
  color: string;
  label: string;
}

/** レーダーチャートデータ */
export interface RadarDataPoint {
  label: string;
  value: number;
}

/** 不正解問題の保存用 */
export interface SavedIncorrectQuestion {
  questionText: string;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  tags: string[];
  explanation?: string;
}

/** localStorage 保存用のゲーム結果 */
export interface SavedGameResult {
  totalCorrect: number;
  totalQuestions: number;
  correctRate: number;
  averageSpeed: number;
  stability: number;
  debt: number;
  maxCombo: number;
  tagStats: TagStats;
  incorrectQuestions: SavedIncorrectQuestion[];
  sprintLog: SprintSummary[];
  grade: string;
  gradeLabel: string;
  teamTypeId: string;
  teamTypeName: string;
  /** @deprecated 後方互換性のため。読み込み時に teamTypeId にマッピング */
  engineerTypeId?: string;
  /** @deprecated 後方互換性のため。読み込み時に teamTypeName にマッピング */
  engineerTypeName?: string;
  timestamp: number;
}

/** ゲーム履歴の1エントリ */
export interface GameHistoryEntry {
  totalCorrect: number;
  totalQuestions: number;
  correctRate: number;
  averageSpeed: number;
  stability: number;
  debt: number;
  maxCombo: number;
  grade: string;
  gradeLabel: string;
  teamTypeId: string;
  teamTypeName: string;
  timestamp: number;
}

// ── ゲーミフィケーション型定義 ──

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

// ── 難易度・チャレンジ型定義 ──

/** 難易度レベル */
export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';

/** 難易度設定 */
export interface DifficultyConfig {
  id: Difficulty;
  name: string;
  timeLimit: number;
  debtMultiplier: number;
  hasHint: boolean;
  emergencyRateBonus: number;
  missDebtPenalty: number;
  gradeBonus: number;
  description: string;
}

/** チャレンジモードの結果 */
export interface ChallengeResult {
  correctCount: number;
  maxCombo: number;
  averageSpeed: number;
  timestamp: number;
}
