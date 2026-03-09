/**
 * 原始進化録 - PRIMAL PATH - メイン Reducer（ルーター）
 *
 * アクションをドメイン別のサブ Reducer にディスパッチする。
 */
import type { GameState } from '../../types';
import type { GameAction } from '../actions';
import {
  isBattleAction,
  isEvolutionAction,
  isEventAction,
  isProgressionAction,
} from '../actions';
import { battleReducer } from './battle-reducer';
import { evolutionReducer } from './evolution-reducer';
import { eventReducer } from './event-reducer';
import { progressionReducer } from './progression-reducer';
import { metaReducer } from './meta-reducer';

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (isBattleAction(action)) return battleReducer(state, action);
  if (isEvolutionAction(action)) return evolutionReducer(state, action);
  if (isEventAction(action)) return eventReducer(state, action);
  if (isProgressionAction(action)) return progressionReducer(state, action);
  return metaReducer(state, action);
}
