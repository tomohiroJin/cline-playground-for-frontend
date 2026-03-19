/**
 * プレゼンテーション層フック（再エクスポート）
 *
 * 実体は ../../hooks/ に配置。
 * presentation/hooks/ からのインポートを可能にする。
 */
export { useGame } from '../../hooks';
export type { UseGameReturn } from '../../hooks';
export { gameReducer, createInitialGameState } from '../../hooks';
export type { GameState, GameAction } from '../../hooks';
export { useCountdown } from '../../hooks';
export { useFade } from '../../hooks';
export { useKeys } from '../../hooks';
export { useStudy } from '../../hooks';
export type { UseStudyReturn } from '../../hooks';
export { useChallenge } from '../../hooks';
