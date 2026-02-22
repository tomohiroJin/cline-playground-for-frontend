/**
 * Agile Quiz Sugoroku - 型定義
 */

/** ゲームのフェーズ */
export type GamePhase = 'title' | 'sprint-start' | 'game' | 'retro' | 'result';

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

/** クイズ問題 */
export interface Question {
  question: string;
  options: string[];
  answer: number;
  tags?: string[];
}

/** カテゴリ別の問題データ */
export type QuestionsByCategory = {
  [key: string]: Question[];
};

/** 回答結果 */
export interface AnswerResult {
  correct: boolean;
  speed: number;
  eventId: string;
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

/** 派生データ */
export interface DerivedStats {
  correctRate: number;
  averageSpeed: number;
  stability: number;
  sprintCorrectRates: number[];
}

/** エンジニアタイプ */
export interface EngineerType {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  condition: (stats: ClassifyStats) => boolean;
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

/** 解説データ */
export type ExplanationMap = {
  [eventId: string]: {
    [questionIndex: number]: string;
  };
};
