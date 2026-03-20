// ドラフト状態管理・遷移ロジック
// 移行期間中: application/draft-processor.ts へ委譲

import type { Player, DeckState } from './types';
import { DraftCards } from './draft-cards';
import {
  startDraft as startDraftNew,
  updateDraftTimer as updateDraftTimerNew,
  moveCursor as moveCursorNew,
  confirmSelection as confirmSelectionNew,
} from './application/draft-processor';
import type { DraftProcessorState } from './application/draft-processor';

/** ドラフト状態の型定義（旧インターフェース互換） */
export type DraftState = DraftProcessorState;

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
export const initDraftState = (completedLap: number, now: number, triggerPlayer: number): DraftState =>
  startDraftNew(completedLap, triggerPlayer, now);

/** タイマー更新 */
export const updateDraftTimer = updateDraftTimerNew;

/** カーソル移動 */
export const moveDraftCursor = moveCursorNew;

/** キー入力マッピング（インフラ層の関心事のため旧実装を維持） */
export const mapDraftInput = (
  keys: Record<string, boolean>,
  playerIndex: number,
  mode: string,
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

/** キー状態クリア（副作用関数、インフラ層の関心事） */
export const clearDraftKeys = (
  keys: Record<string, boolean>,
  playerIndex: number,
  _mode: string,
  action: 'left' | 'right' | 'confirm',
): void => {
  if (playerIndex === 0) {
    if (action === 'left') { keys.a = false; keys.A = false; keys.ArrowLeft = false; }
    else if (action === 'right') { keys.d = false; keys.D = false; keys.ArrowRight = false; }
    else { keys.w = false; keys.W = false; keys.Enter = false; keys[' '] = false; }
  } else {
    if (action === 'left') keys.ArrowLeft = false;
    else if (action === 'right') keys.ArrowRight = false;
    else keys.Enter = false;
  }
};

/** カード効果適用 */
export const applyDraftResults = (
  players: Player[],
  decks: DeckState[],
  triggerPlayer?: number,
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
