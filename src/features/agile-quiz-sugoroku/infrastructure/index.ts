/**
 * インフラ層 - 統一エクスポート
 */

// Port インターフェース
export type { StoragePort } from './storage/storage-port';
export type { AudioPort } from './audio/audio-port';
export type { RandomPort } from './random/random-port';

// Storage Adapter
export { LocalStorageAdapter } from './storage/local-storage-adapter';
export { InMemoryStorageAdapter } from './storage/in-memory-storage-adapter';

// Repository
export { GameResultRepository } from './storage/game-repository';
export { HistoryRepository } from './storage/history-repository';
export { AchievementRepository } from './storage/achievement-repository';
export { SaveRepository } from './storage/save-repository';
export { ChallengeRepository } from './storage/challenge-repository';
export { DailyQuizRepository } from './storage/daily-quiz-repository';

// Audio Adapter
export { ToneAudioAdapter } from './audio/tone-audio-adapter';
export { SilentAudioAdapter } from './audio/silent-audio-adapter';

// Random Adapter
export { MathRandomAdapter } from './random/math-random-adapter';
export { SeededRandomAdapter } from './random/seeded-random-adapter';
