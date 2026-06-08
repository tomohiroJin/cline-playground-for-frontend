// ゲームフェーズ遷移（値オブジェクト）

import type { GamePhase } from './types';
import { assert } from '../shared/assertions';

/** 有効な遷移マップ */
export const VALID_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  // 既存（自由対戦・2P・CPU 戦のフロー）
  menu: ['countdown', 'stage_select'],
  countdown: ['race'],
  race: ['draft', 'result', 'stage_clear', 'game_over'],
  draft: ['race'],
  result: ['menu'],
  // キャンペーン用（spec §1.1）
  stage_select: ['countdown', 'menu', 'ending'],
  stage_clear: ['stage_select', 'countdown', 'ending'],
  game_over: ['stage_select'],
  ending: ['stage_select'],
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
