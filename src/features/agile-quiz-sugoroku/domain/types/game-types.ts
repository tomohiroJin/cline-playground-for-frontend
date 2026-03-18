/**
 * ゲーム進行に関するドメイン型定義
 */

import type { AnswerResultWithDetail, TagStats } from './quiz-types';

/** ゲームのフェーズ */
export type GamePhase = 'title' | 'story' | 'sprint-start' | 'game' | 'retro' | 'ending' | 'result' | 'guide' | 'study-select' | 'study' | 'achievements' | 'history' | 'challenge' | 'challenge-result' | 'daily-quiz';

/** イベントID */
export type EventId = 'planning' | 'impl1' | 'test1' | 'refinement' | 'impl2' | 'test2' | 'review' | 'emergency';

/** イベント情報 */
export interface GameEvent {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

/** カテゴリ別統計 */
export interface CategoryStats {
  [key: string]: {
    correct: number;
    total: number;
  };
}

/** ゲーム状態 */
export interface GameStats {
  totalCorrect: number;
  totalQuestions: number;
  speeds: number[];
  debt: number;
  emergencyCount: number;
  emergencySuccess: number;
  combo: number;
  maxCombo: number;
}

/** スプリント集計 */
export interface SprintSummary {
  sprintNumber: number;
  correctRate: number;
  correctCount: number;
  totalCount: number;
  averageSpeed: number;
  debt: number;
  hadEmergency: boolean;
  emergencySuccessCount: number;
  categoryStats: CategoryStats;
}

/** ストーリーの1行 */
export interface StoryLine {
  /** 発言者キャラクターID（ナレーションの場合はundefined） */
  speakerId?: string;
  /** テキスト内容 */
  text: string;
}

/** ストーリーデータ */
export interface StoryEntry {
  /** 対応するスプリント番号（1始まり） */
  sprintNumber: number;
  /** ストーリータイトル */
  title: string;
  /** 語り手キャラクターID */
  narratorId: string;
  /** テキスト行 */
  lines: StoryLine[];
  /** 対応する画像キー */
  imageKey: string;
}

/** エンディングストーリーデータ */
export interface EndingEntry {
  /** 共通パートかエピローグか */
  phase: 'common' | 'epilogue';
  /** エピローグの場合のチームタイプID */
  teamTypeId?: string;
  /** エンディングタイトル */
  title: string;
  /** テキスト行（既存の StoryLine 型を再利用） */
  lines: StoryLine[];
  /** 対応する画像キー */
  imageKey: string;
}

/** ゲーム途中セーブ状態 */
export interface SaveState {
  version: number;
  timestamp: number;
  sprintCount: number;
  currentSprint: number;
  stats: GameStats;
  log: SprintSummary[];
  usedQuestions: Record<string, number[]>;
  tagStats: TagStats;
  incorrectQuestions: AnswerResultWithDetail[];
}
