/**
 * Agile Quiz Sugoroku - 公開 API
 *
 * 外部(pages 等)はこのファイル経由でのみインポートする。
 * Feature 内部のモジュール間参照は各モジュールを直接参照する(このファイルを経由しない)。
 */

// 型定義
export type {
  SprintSummary,
  SaveState,
  StoryEntry,
  EndingEntry,
  Difficulty,
  AchievementDefinition,
} from './domain/types';

// 定数
export { CONFIG } from './constants';

// ドメインロジック
export { getDifficultyConfig, calculateGradeWithDifficulty } from './domain/scoring';
export { checkAchievements } from './domain/achievement';
export { classifyTeamType } from './domain/team';

// 復習モード(ドメイン)
export { buildReviewPool, makeQuestionKey } from './domain/quiz';
export type { ReviewSource } from './domain/quiz';

// 静的データ
export { getStoriesForSprintCount } from './data/story-data';
export { getEndingStories } from './data/ending-data';

// 音声
export { createDefaultAudioActions } from './infrastructure/audio/audio-actions';

// フック
export { useGame, useCountdown, useFade, useStudy, useChallenge } from './presentation/hooks';

// インフラストラクチャ(ストレージ)
export { LocalStorageAdapter } from './infrastructure/storage/local-storage-adapter';
export { GameResultRepository } from './infrastructure/storage/game-repository';
export { SaveRepository } from './infrastructure/storage/save-repository';
export { AchievementRepository } from './infrastructure/storage/achievement-repository';
export { HistoryRepository } from './infrastructure/storage/history-repository';
export { ChallengeRepository } from './infrastructure/storage/challenge-repository';
export { WrongAnswerRepository } from './infrastructure/storage/wrong-answer-repository';
export { BookmarkRepository } from './infrastructure/storage/bookmark-repository';
export { SettingsRepository } from './infrastructure/storage/settings-repository';

// UI コンポーネント
export {
  TitleScreen,
  SprintStartScreen,
  QuizScreen,
  RetrospectiveScreen,
  ResultScreen,
  StudySelectScreen,
  StudyScreen,
  StudyResultScreen,
  GuideScreen,
  StoryScreen,
  AchievementScreen,
  AchievementToast,
  HistoryScreen,
  ChallengeQuizScreen,
  ChallengeResultScreen,
  DailyQuizScreen,
  ReviewSelectScreen,
} from './presentation/components';
