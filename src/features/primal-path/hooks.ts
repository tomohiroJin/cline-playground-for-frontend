/**
 * 原始進化録 - PRIMAL PATH - カスタムフック（barrel re-export）
 *
 * P4 リファクタリングにより hooks/ ディレクトリに分割。
 * 後方互換のため、全エクスポートを re-export する。
 */
export {
  gameReducer,
  initialState,
  useGameState,
  useBattle,
  useAudio,
  useOverlay,
  usePersistence,
} from './hooks/index';

export type {
  GameAction,
  OverlayState,
} from './hooks/index';
