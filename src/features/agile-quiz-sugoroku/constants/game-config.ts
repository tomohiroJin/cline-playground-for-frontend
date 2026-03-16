/**
 * Agile Quiz Sugoroku - ゲーム設定定数
 *
 * CONFIG, スプリント設定, 負債設定, フォント, マッピング等のゲーム設定を集約
 */
import { GameStats } from '../types';

/** ゲーム設定 */
export const CONFIG = Object.freeze({
  /** スプリント数 */
  sprintCount: 3,
  /** 制限時間（秒） */
  timeLimit: 15,
  /** 技術的負債の設定 */
  debt: Object.freeze({
    impl: 5,
    test: 3,
    refinement: 4,
  }),
  /** 緊急対応の発生確率設定 */
  emergency: Object.freeze({
    base: 0.1,
    debtMultiplier: 0.004,
    maxProbability: 0.5,
    minPosition: 1,
    maxPosition: 4,
  }),
});

/** スプリント数の選択肢（フィボナッチ数列） */
export const SPRINT_OPTIONS = Object.freeze([1, 2, 3, 5, 8] as const);

/** イベント別の負債ポイント */
const DEBT_POINTS: Readonly<Record<string, number>> = Object.freeze({
  impl1: CONFIG.debt.impl,
  impl2: CONFIG.debt.impl,
  test1: CONFIG.debt.test,
  test2: CONFIG.debt.test,
  refinement: CONFIG.debt.refinement,
});

/** 負債が発生するイベント */
export const DEBT_EVENTS: Readonly<Record<string, number>> = Object.freeze({
  impl1: 1,
  impl2: 1,
  test1: 1,
  test2: 1,
  refinement: 1,
});

/** イベントに応じた負債ポイントを計算 */
export function getDebtPoints(eventId: string): number {
  return DEBT_POINTS[eventId] ?? 0;
}

/** フォント設定 */
export const FONTS = Object.freeze({
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  jp: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
});

/** 初期ゲーム状態 */
export const INITIAL_GAME_STATS: Readonly<GameStats> = Object.freeze({
  totalCorrect: 0,
  totalQuestions: 0,
  speeds: [] as number[],
  debt: 0,
  emergencyCount: 0,
  emergencySuccess: 0,
  combo: 0,
  maxCombo: 0,
});

/** カテゴリ名マッピング */
export const CATEGORY_NAMES: Readonly<Record<string, string>> = Object.freeze({
  planning: '計画',
  impl1: '実装1',
  test1: 'テスト1',
  refinement: 'リファ',
  impl2: '実装2',
  test2: 'テスト2',
  review: 'レビュー',
  emergency: '緊急',
});

/** 選択肢ラベル */
export const OPTION_LABELS = Object.freeze(['A', 'B', 'C', 'D'] as const);

/** スプリント工程とジャンルのマッピング */
export const PHASE_GENRE_MAP: Readonly<Record<string, string[]>> = Object.freeze({
  planning: ['scrum', 'agile', 'estimation', 'backlog'],
  impl1: ['design-principles', 'design-patterns', 'data-structures', 'programming'],
  impl2: ['design-principles', 'design-patterns', 'data-structures', 'programming'],
  test1: ['testing', 'code-quality', 'ci-cd'],
  test2: ['testing', 'code-quality', 'ci-cd'],
  refinement: ['refactoring', 'code-quality', 'backlog'],
  review: ['release', 'team', 'scrum'],
  emergency: ['incident', 'sre'],
});

/** イベントIDと背景画像IDのマッピング */
export const EVENT_BACKGROUND_MAP: Readonly<Record<string, string>> = Object.freeze({
  planning: 'planning',
  impl1: 'dev',
  test1: 'dev',
  refinement: 'planning',
  impl2: 'dev',
  test2: 'dev',
  review: 'planning',
  emergency: 'emergency',
});
