/**
 * ドメイン型定義 - 再エクスポート
 *
 * 全ドメイン型をこのファイルから一括インポート可能にする。
 */

export type {
  GamePhase,
  EventId,
  GameEvent,
  CategoryStats,
  GameStats,
  SprintSummary,
  StoryLine,
  StoryEntry,
  EndingEntry,
  SaveState,
} from './game-types';

export type {
  Question,
  QuestionsByCategory,
  AnswerResult,
  AnswerResultWithDetail,
  TagStats,
  ExplanationMap,
} from './quiz-types';

export type {
  DerivedStats,
  ClassifyStats,
  EngineerType,
  TeamType,
  Grade,
  RadarDataPoint,
  SavedIncorrectQuestion,
  SavedGameResult,
  GameHistoryEntry,
  AchievementRarity,
  AchievementDefinition,
  AchievementContext,
  AchievementProgress,
  Difficulty,
  DifficultyConfig,
  ChallengeResult,
} from './scoring-types';
