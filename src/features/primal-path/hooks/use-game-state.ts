/**
 * 原始進化録 - PRIMAL PATH - useGameState フック
 *
 * メインの状態管理（useReducer + dispatch）
 */
import { useReducer } from 'react';
import type { GameState } from '../types';
import { FRESH_SAVE } from '../constants';
import { MetaStorage } from '../storage';
import { gameReducer } from './reducers/game-reducer';
import type { GameAction } from './actions';

/** 初期状態を生成する */
export function initialState(): GameState {
  return {
    phase: 'title',
    save: { ...FRESH_SAVE, tree: {}, best: {} },
    run: null,
    finalMode: false,
    battleSpd: 750,
    evoPicks: [],
    pendingAwk: null,
    reviveTargets: [],
    gameResult: null,
    currentEvent: undefined,
    runStats: [],
    aggregate: MetaStorage.loadAggregate(),
    achievementStates: [],
    newAchievements: [],
  };
}

/** メインの状態管理フック */
export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  return { state, dispatch };
}

export { gameReducer };
export type { GameAction };
