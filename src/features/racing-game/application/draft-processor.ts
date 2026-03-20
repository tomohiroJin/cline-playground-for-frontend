// ドラフトフロー処理

import type { Player } from '../domain/player/types';
import type { DeckState } from '../domain/card/types';
import { selectCard } from '../domain/card/deck';

/** ドラフトタイマーの初期値（秒） */
const DRAFT_TIMER = 15;

/** ドラフト処理状態 */
export interface DraftProcessorState {
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

/** ドラフトの開始 */
export const startDraft = (completedLap: number, triggerPlayer: number, now: number): DraftProcessorState => ({
  active: true,
  currentPlayer: triggerPlayer,
  triggerPlayer,
  selectedIndex: 1,
  confirmed: false,
  timer: DRAFT_TIMER,
  lastTick: now,
  animStart: now,
  completedLap,
  pendingResume: false,
});

/** ドラフトタイマーの更新 */
export const updateDraftTimer = (state: DraftProcessorState, now: number): DraftProcessorState => {
  const elapsed = (now - state.lastTick) / 1000;
  return {
    ...state,
    timer: state.timer - elapsed,
    lastTick: now,
  };
};

/** カーソル移動 */
export const moveCursor = (currentIndex: number, direction: 'left' | 'right', handSize: number): number =>
  direction === 'left'
    ? Math.max(0, currentIndex - 1)
    : Math.min(handSize - 1, currentIndex + 1);

/** ドラフト確定処理 */
export const confirmSelection = (
  state: DraftProcessorState,
  decks: readonly DeckState[],
  players: readonly Player[],
): { state: DraftProcessorState; decks: readonly DeckState[]; players: readonly Player[] } => {
  const pi = state.currentPlayer;
  const deck = decks[pi];
  if (deck.hand.length === 0 || state.confirmed) {
    return { state, decks, players };
  }

  const cardId = deck.hand[state.selectedIndex]?.id;
  if (!cardId) return { state, decks, players };

  const newDeck = selectCard(deck, cardId);
  const newDecks = decks.map((d, i) => (i === pi ? newDeck : d));

  // カード効果をプレイヤーに適用
  const newPlayers = players.map((p, i) => {
    if (i !== pi) return p;
    return {
      ...p,
      activeCards: newDeck.active,
      shieldCount: p.shieldCount + (newDeck.active.reduce((acc, e) => acc + (e.shieldCount ?? 0), 0)),
    };
  });

  return {
    state: { ...state, confirmed: true },
    decks: newDecks,
    players: newPlayers,
  };
};
