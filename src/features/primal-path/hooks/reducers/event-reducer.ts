/**
 * 原始進化録 - PRIMAL PATH - イベントアクション Reducer
 */
import type { GameState } from '../../types';
import type { EventAction } from '../actions';
import { applyEventChoice } from '../../game-logic';
import { transitionToEvoPicks } from '../reducer-helpers';

/** イベント完了後に進化選択へ遷移する */
function finishEvent(state: GameState, nextRun: GameState['run']): GameState {
  if (!nextRun) return state;
  return { ...transitionToEvoPicks(state, nextRun), currentEvent: undefined };
}

export function eventReducer(state: GameState, action: EventAction): GameState {
  switch (action.type) {
    case 'TRIGGER_EVENT': {
      if (!state.run) return state;
      return { ...state, phase: 'event', currentEvent: action.event };
    }

    case 'CHOOSE_EVENT': {
      if (!state.run || state.phase !== 'event') return state;
      // イベント効果の適用（コストの消費。防御的に下限チェック）
      let nextRun = state.run;
      if (action.choice.cost?.type === 'bone') {
        nextRun = { ...nextRun, bE: Math.max(0, nextRun.bE - action.choice.cost.amount) };
      } else if (action.choice.cost?.type === 'hp_damage') {
        nextRun = { ...nextRun, hp: Math.max(1, nextRun.hp - action.choice.cost.amount) };
      }
      nextRun = applyEventChoice(nextRun, action.choice);
      return finishEvent(state, nextRun);
    }

    case 'APPLY_EVENT_RESULT': {
      if (!state.run || state.phase !== 'event') return state;
      return finishEvent(state, action.nextRun);
    }

    default:
      return state;
  }
}
