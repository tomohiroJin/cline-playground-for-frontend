/**
 * テスト用データファクトリ
 *
 * 各テストで使用するドメインオブジェクトを簡潔に生成するためのヘルパー関数群。
 * overrides パターンでデフォルト値を持ちつつ、テストごとに必要な値だけ上書きできる。
 */
import type {
  Question,
  AnswerResult,
  GameStats,
  SprintSummary,
  GameEvent,
  SavedGameResult,
  GameHistoryEntry,
  AchievementContext,
  TagStats,
  ClassifyStats,
} from '../types';

// ── Question ─────────────────────────────────────

/** テスト用の Question を生成 */
export function createQuestion(overrides: Partial<Question> = {}): Question {
  return {
    question: 'テスト問題',
    options: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
    answer: 0,
    tags: ['scrum'],
    explanation: '解説テキスト',
    ...overrides,
  };
}

// ── AnswerResult ─────────────────────────────────

/** テスト用の AnswerResult を生成 */
export function createAnswerResult(overrides: Partial<AnswerResult> = {}): AnswerResult {
  return {
    correct: true,
    speed: 5.0,
    eventId: 'planning',
    ...overrides,
  };
}

// ── GameStats ────────────────────────────────────

/** テスト用の GameStats を生成（初期状態ベース） */
export function createGameStats(overrides: Partial<GameStats> = {}): GameStats {
  return {
    totalCorrect: 0,
    totalQuestions: 0,
    speeds: [],
    debt: 0,
    emergencyCount: 0,
    emergencySuccess: 0,
    combo: 0,
    maxCombo: 0,
    ...overrides,
  };
}

// ── SprintSummary ───────────────────────────────

/** テスト用の SprintSummary を生成 */
export function createSprintSummaryData(overrides: Partial<SprintSummary> = {}): SprintSummary {
  return {
    sprintNumber: 1,
    correctRate: 70,
    correctCount: 5,
    totalCount: 7,
    averageSpeed: 6.0,
    debt: 0,
    hadEmergency: false,
    emergencySuccessCount: 0,
    categoryStats: {},
    ...overrides,
  };
}

// ── GameEvent ────────────────────────────────────

/** テスト用の GameEvent を生成 */
export function createGameEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'planning',
    name: '計画',
    icon: '📋',
    description: 'スプリント計画',
    color: '#4a90d9',
    ...overrides,
  };
}

// ── SavedGameResult ──────────────────────────────

/** テスト用の SavedGameResult を生成 */
export function createSavedGameResult(overrides: Partial<SavedGameResult> = {}): SavedGameResult {
  return {
    totalCorrect: 15,
    totalQuestions: 21,
    correctRate: 71,
    averageSpeed: 6.5,
    stability: 75,
    debt: 10,
    maxCombo: 4,
    tagStats: {},
    incorrectQuestions: [],
    sprintLog: [
      createSprintSummaryData({ sprintNumber: 1, correctRate: 70 }),
      createSprintSummaryData({ sprintNumber: 2, correctRate: 75 }),
      createSprintSummaryData({ sprintNumber: 3, correctRate: 70 }),
    ],
    grade: 'A',
    gradeLabel: 'High-Performing',
    teamTypeId: 'synergy',
    teamTypeName: 'シナジーチーム',
    timestamp: Date.now(),
    ...overrides,
  };
}

// ── GameHistoryEntry ─────────────────────────────

/** テスト用の GameHistoryEntry を生成 */
export function createHistoryEntry(overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry {
  return {
    totalCorrect: 15,
    totalQuestions: 21,
    correctRate: 71,
    averageSpeed: 6.5,
    stability: 75,
    debt: 10,
    maxCombo: 4,
    grade: 'A',
    gradeLabel: 'High-Performing',
    teamTypeId: 'synergy',
    teamTypeName: 'シナジーチーム',
    timestamp: Date.now(),
    ...overrides,
  };
}

// ── AchievementContext ───────────────────────────

/** テスト用の AchievementContext を生成 */
export function createAchievementContext(overrides: Partial<AchievementContext> = {}): AchievementContext {
  return {
    result: createSavedGameResult(),
    sprintCorrectRates: [70, 75, 70],
    unlockedIds: [],
    history: [],
    now: new Date('2025-06-15T14:00:00'),
    ...overrides,
  };
}

// ── ClassifyStats ────────────────────────────────

/** テスト用の ClassifyStats を生成 */
export function createClassifyStats(overrides: Partial<ClassifyStats> = {}): ClassifyStats {
  return {
    stab: 50,
    debt: 25,
    emSuc: 0,
    sc: [55, 55],
    tp: 55,
    spd: 7,
    ...overrides,
  };
}

// ── TagStats ─────────────────────────────────────

/** テスト用の TagStats を生成 */
export function createTagStats(entries: Record<string, { correct: number; total: number }> = {}): TagStats {
  return { ...entries };
}
