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
import { assertRunInvariant } from '../../contracts/run-invariants';

export function gameReducer(state: GameState, action: GameAction): GameState {
  let next: GameState;
  if (isBattleAction(action)) next = battleReducer(state, action);
  else if (isEvolutionAction(action)) next = evolutionReducer(state, action);
  else if (isEventAction(action)) next = eventReducer(state, action);
  else if (isProgressionAction(action)) next = progressionReducer(state, action);
  else next = metaReducer(state, action);

  // 開発モードのみ: 状態遷移後に不変条件を検証
  if (process.env.NODE_ENV !== 'production' && next.run) {
    assertRunInvariant(next.run);
  }

  return next;
}
