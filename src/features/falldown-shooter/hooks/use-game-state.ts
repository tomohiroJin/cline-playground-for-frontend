// ゲーム状態管理フック

import { useState, useCallback, useRef } from 'react';
import type { GameState } from '../types';
import { Stage } from '../stage';
import { CONFIG } from '../constants';

export interface UseGameStateReturn {
  state: GameState;
  stateRef: React.MutableRefObject<GameState>;
  updateState: (changes: Partial<GameState>) => void;
  resetState: (stage: number, score: number) => void;
}

const { width: W, height: H } = CONFIG.grid;

export const useGameState = (): UseGameStateReturn => {
  const stateRef = useRef<GameState>(Stage.create(1, 0, W, H));
  const [, forceUpdate] = useState<number>(0);

  const updateState = useCallback((changes: Partial<GameState>) => {
    Object.assign(stateRef.current, changes);
    forceUpdate(n => n + 1);
  }, []);

  const resetState = useCallback((stage: number, score: number) => {
    stateRef.current = Stage.create(stage, score, W, H);
    forceUpdate(n => n + 1);
  }, []);

  return {
    state: stateRef.current,
    stateRef,
    updateState,
    resetState,
  };
};
