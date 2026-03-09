/**
 * 原始進化録 - PRIMAL PATH - 進行アクション Reducer
 */
import type { GameState } from '../../types';
import type { ProgressionAction } from '../actions';
import {
  startRunState, startFinalBoss,
  applyBiomeSelection, applyChallenge,
} from '../../game-logic';
import { CHALLENGES } from '../../constants';
import { transitionAfterBiome, transitionToEvoPicks, setupInitialRun } from '../reducer-helpers';

export function progressionReducer(state: GameState, action: ProgressionAction): GameState {
  switch (action.type) {
    case 'START_RUN': {
      const save = { ...state.save, runs: state.save.runs + 1, loopCount: action.loopOverride };
      const run = startRunState(action.di, save);
      return setupInitialRun(state, run, save);
    }

    case 'GO_DIFF':
      return { ...state, phase: 'diff' };

    case 'GO_HOW':
      return { ...state, phase: 'how' };

    case 'GO_TREE':
      return { ...state, phase: 'tree' };

    case 'PREPARE_BIOME_SELECT': {
      if (!state.run) return state;
      return { ...state, phase: 'biome' };
    }

    case 'PICK_BIOME': {
      if (!state.run) return state;
      const next = applyBiomeSelection(state.run, action.biome);
      return transitionToEvoPicks(state, next);
    }

    case 'GO_FINAL_BOSS': {
      if (!state.run) return state;
      if (state.run.di >= 3 && !state.run.fe) {
        return { ...state, phase: 'over', gameResult: false };
      }
      const { nextRun } = startFinalBoss(state.run);
      return { ...state, run: nextRun, phase: 'battle', finalMode: true };
    }

    case 'BIOME_CLEARED': {
      if (!state.run) return state;
      return transitionAfterBiome(state, state.run);
    }

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'START_CHALLENGE': {
      const ch = CHALLENGES.find(c => c.id === action.challengeId);
      if (!ch) return state;
      const save = { ...state.save, runs: state.save.runs + 1 };
      let run = startRunState(action.di, save);
      run = applyChallenge(run, ch);
      run = { ...run, challengeId: ch.id };
      // タイマー付きチャレンジの場合、開始時刻を記録
      if (run.timeLimit) {
        run = { ...run, timerStart: Date.now() };
      }
      return setupInitialRun(state, run, save, { newAchievements: [] });
    }

    default:
      return state;
  }
}
