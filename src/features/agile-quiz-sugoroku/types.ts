/**
 * Agile Quiz Sugoroku - 型定義
 */

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

/** クイズ問題 */
export interface Question {
  question: string;
  options: string[];
  answer: number;
  tags?: string[];
  explanation?: string;
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

/** ジャンル別統計 */
export interface TagStats {
  [tagId: string]: {
    correct: number;
    total: number;
  };
}

/** 回答結果の詳細（タグ・問題情報付き） */
export interface AnswerResultWithDetail {
  questionText: string;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  correct: boolean;
  tags: string[];
  explanation?: string;
  eventId: string;
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

/** ストーリーの1行 */
export interface StoryLine {
  /** 発言者キャラクターID（ナレーションの場合はundefined） */
  speakerId?: string;
  /** テキスト内容 */
  text: string;
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

/** 不正解問題の保存用 */
export interface SavedIncorrectQuestion {
  questionText: string;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  tags: string[];
  explanation?: string;
}

// ── フェーズ2: ゲーミフィケーション型定義 ──

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
