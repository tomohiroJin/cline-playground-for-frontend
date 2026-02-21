// ドラフト状態管理・遷移ロジック（純粋関数中心）

import type { Player, DeckState, CardEffect } from './types';
import { DraftCards } from './draft-cards';

/** ドラフト状態の型定義 */
export interface DraftState {
  active: boolean;
  currentPlayer: number;
  triggerPlayer: number;
  selectedIndex: number;
  confirmed: boolean;
  timer: number;
  lastTick: number;
  animStart: number;
  completedLap: number;
  pendingResume: boolean;
}

/** ドラフト状態の初期値 */
export const INITIAL_DRAFT_STATE: DraftState = {
  active: false,
  currentPlayer: 0,
  triggerPlayer: 0,
  selectedIndex: 0,
  confirmed: false,
  timer: 15,
  lastTick: 0,
  animStart: 0,
  completedLap: 0,
  pendingResume: false,
};

/** ドラフト開始状態を生成 */
export const initDraftState = (completedLap: number, now: number, triggerPlayer: number): DraftState => ({
  active: true,
  currentPlayer: triggerPlayer,
  triggerPlayer,
  selectedIndex: 1,
  confirmed: false,
  timer: 15,
  lastTick: now,
  animStart: now,
  completedLap,
  pendingResume: false,
});

/** タイマー更新（純粋関数） */
export const updateDraftTimer = (state: DraftState, now: number): DraftState => {
  const elapsed = (now - state.lastTick) / 1000;
  return {
    ...state,
    timer: state.timer - elapsed,
    lastTick: now,
  };
};

/** カーソル移動（純粋関数） */
export const moveDraftCursor = (
  index: number,
  direction: 'left' | 'right',
  handLength: number
): number =>
  direction === 'left'
    ? Math.max(0, index - 1)
    : Math.min(handLength - 1, index + 1);

/** キー入力マッピング → {left, right, confirm} 判定 */
export const mapDraftInput = (
  keys: Record<string, boolean>,
  playerIndex: number,
  mode: string
): { left: boolean; right: boolean; confirm: boolean } => {
  if (playerIndex === 0) {
    return {
      left: !!(keys.a || keys.A || (mode === 'cpu' && keys.ArrowLeft)),
      right: !!(keys.d || keys.D || (mode === 'cpu' && keys.ArrowRight)),
      confirm: !!(keys.w || keys.W || (mode === 'cpu' && (keys.Enter || keys[' ']))),
    };
  }
  return {
    left: !!keys.ArrowLeft,
    right: !!keys.ArrowRight,
    confirm: !!keys.Enter,
  };
};

/** キー状態クリア（副作用関数） */
export const clearDraftKeys = (
  keys: Record<string, boolean>,
  playerIndex: number,
  mode: string,
  action: 'left' | 'right' | 'confirm'
): void => {
  if (playerIndex === 0) {
    if (action === 'left') {
      keys.a = false;
      keys.A = false;
      keys.ArrowLeft = false;
    } else if (action === 'right') {
      keys.d = false;
      keys.D = false;
      keys.ArrowRight = false;
    } else {
      keys.w = false;
      keys.W = false;
      keys.Enter = false;
      keys[' '] = false;
    }
  } else {
    if (action === 'left') keys.ArrowLeft = false;
    else if (action === 'right') keys.ArrowRight = false;
    else keys.Enter = false;
  }
};

/** カード効果適用（純粋関数） */
export const applyDraftResults = (
  players: Player[],
  decks: DeckState[],
  triggerPlayer?: number
): Player[] =>
  players.map((p, i) => {
    if (triggerPlayer !== undefined && i !== triggerPlayer) return p;
    const effects = DraftCards.getActiveEffects(decks[i]);
    return {
      ...p,
      activeCards: decks[i].active,
      shieldCount: p.shieldCount + (effects.shieldCount ?? 0),
    };
  });
