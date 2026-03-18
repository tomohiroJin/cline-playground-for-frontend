/**
 * ゲーム結果の永続化に関するドメイン型定義
 */

import type { SprintSummary } from './game-types';
import type { TagStats } from './quiz-types';

/** 不正解問題の保存用 */
export interface SavedIncorrectQuestion {
  questionText: string;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  tags: string[];
  explanation?: string;
}

/** 保存用のゲーム結果 */
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
