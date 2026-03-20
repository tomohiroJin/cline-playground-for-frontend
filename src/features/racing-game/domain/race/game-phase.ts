// ゲームフェーズ遷移（値オブジェクト）

import type { GamePhase } from './types';
import { assert } from '../shared/assertions';

/** 有効な遷移マップ */
export const VALID_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  menu: ['countdown'],
  countdown: ['race'],
  race: ['draft', 'result'],
  draft: ['race'],
  result: ['menu'],
};

/** フェーズ遷移の妥当性チェック */
export const canTransition = (from: GamePhase, to: GamePhase): boolean => {
  return VALID_TRANSITIONS[from].includes(to);
};

/** 安全なフェーズ遷移（無効な遷移は例外） */
export const transition = (from: GamePhase, to: GamePhase): GamePhase => {
  assert(canTransition(from, to), `Invalid transition: ${from} → ${to}`);
  return to;
};
