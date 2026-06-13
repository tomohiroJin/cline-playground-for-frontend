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
  ClassifyStats,
  TeamType,
} from './team-types';

export type {
  SavedIncorrectQuestion,
  SavedGameResult,
  GameHistoryEntry,
} from './game-result-types';

export type {
  AchievementRarity,
  AchievementDefinition,
  AchievementContext,
  AchievementProgress,
} from './achievement-types';

export type {
  DerivedStats,
  Grade,
  RadarDataPoint,
  Difficulty,
  DifficultyConfig,
  ChallengeResult,
} from './scoring-types';

export type { AppSettings } from './app-settings-types';
export { DEFAULT_APP_SETTINGS } from './app-settings-types';

export type { ReviewEntry } from './review-types';
