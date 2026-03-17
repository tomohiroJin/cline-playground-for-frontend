/**
 * Agile Quiz Sugoroku - メインエクスポート
 */

// 型定義
export * from './domain/types';

// 定数
export * from './constants';

// クイズデータ
export { QUESTIONS } from './questions';

// タグマスタ
export { TAG_MASTER, VALID_TAG_IDS, TAG_MAP } from './questions/tag-master';
export type { TagDefinition } from './questions/tag-master';

// ゲームロジック
export { createEvents, createSprintSummary } from './domain/game';
export { pickQuestion, computeAnswerResult, computeDebtDelta, nextGameStats } from './domain/quiz';
export type { AnswerInput } from './domain/quiz';
export { shuffle, clamp, average, percentage } from '../../utils/math-utils';
export { classifyTeamType, TEAM_TYPES } from './team-classifier';
export { getComboColor } from './domain/quiz';

// ジャンル別統計
export { getTagColor, computeTagStatEntries, getWeakGenres, getWeakGenreIds } from './domain/quiz';
export type { TagStatEntry } from './domain/quiz';

// ゲーム結果保存
export { GameResultRepository } from './infrastructure/storage/game-repository';

// 履歴
export { HistoryRepository, MAX_HISTORY_COUNT } from './infrastructure/storage/history-repository';

// 実績
export { ACHIEVEMENTS, checkAchievements } from './domain/achievement';
export { AchievementRepository } from './infrastructure/storage/achievement-repository';

// 難易度
export { DIFFICULTY_CONFIGS, getDifficultyConfig, calculateGradeWithDifficulty } from './domain/scoring';

// チャレンジモード
export { ChallengeRepository } from './infrastructure/storage/challenge-repository';

// デイリークイズ
export * from './daily-quiz';

// キャラクターナラティブ
export * from './character-narrative';

// セーブ/ロード
export { SaveRepository } from './infrastructure/storage/save-repository';

// ストーリーデータ
export { STORY_ENTRIES, getStoriesForSprintCount } from './story-data';

// エンディングストーリーデータ
export { ENDING_COMMON, ENDING_EPILOGUES, getEndingStories } from './ending-data';

// 勉強会モード
export { buildStudyPool, countStudyQuestions } from './domain/quiz';

// 音声
export * from './audio/sound';
export * from './audio/audio-actions';

// フック
export * from './hooks';

// コンポーネント
export * from './components';
