/**
 * Agile Quiz Sugoroku - ゲームロジック（後方互換用）
 *
 * 実体は domain/ 配下に分割済み。
 * 既存のインポートパスを壊さないよう再エクスポートを維持する。
 */

// 共通数学関数
export { shuffle, clamp, average, percentage } from '../../utils/math-utils';

// game サブドメイン
export { createEvents } from './domain/game';
export { createSprintSummary } from './domain/game';

/** @deprecated createEvents を使用してください */
export { createEvents as makeEvents } from './domain/game';

// quiz サブドメイン
export { pickQuestion } from './domain/quiz';
