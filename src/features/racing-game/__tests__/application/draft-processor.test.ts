// DraftProcessor のテスト

import { startDraft, updateDraftTimer, moveCursor, confirmSelection } from '../../application/draft-processor';
import type { DraftProcessorState } from '../../application/draft-processor';
import { createDeck, drawCards } from '../../domain/card/deck';
import { createTestPlayer } from '../helpers/test-factories';

describe('DraftProcessor', () => {
  describe('startDraft', () => {
    it('ドラフト状態を正しく初期化する', () => {
      const state = startDraft(2, 0, 1000);
      expect(state.active).toBe(true);
      expect(state.completedLap).toBe(2);
      expect(state.triggerPlayer).toBe(0);
      expect(state.currentPlayer).toBe(0);
      expect(state.confirmed).toBe(false);
      expect(state.timer).toBe(15);
    });
  });

  describe('updateDraftTimer', () => {
    it('経過時間分タイマーが減少する', () => {
      const state = startDraft(1, 0, 1000);
      const updated = updateDraftTimer(state, 2000);
      expect(updated.timer).toBeCloseTo(14);
    });

    it('タイマーが 0 以下にならない', () => {
      const state = startDraft(1, 0, 1000);
      const updated = updateDraftTimer(state, 20000);
      expect(updated.timer).toBeLessThanOrEqual(0);
    });
  });

  describe('moveCursor', () => {
    it('左で インデックスが減少する', () => {
      expect(moveCursor(1, 'left', 3)).toBe(0);
    });

    it('右で インデックスが増加する', () => {
      expect(moveCursor(1, 'right', 3)).toBe(2);
    });

    it('0 より下にはならない', () => {
      expect(moveCursor(0, 'left', 3)).toBe(0);
    });

    it('手札サイズ - 1 より上にはならない', () => {
      expect(moveCursor(2, 'right', 3)).toBe(2);
    });
  });

  describe('confirmSelection', () => {
    it('選択したカードがデッキに反映される', () => {
      // Arrange
      const state: DraftProcessorState = {
        active: true, currentPlayer: 0, triggerPlayer: 0,
        selectedIndex: 0, confirmed: false, timer: 10,
        lastTick: 0, animStart: 0, completedLap: 1, pendingResume: false,
      };
      const deck = drawCards(createDeck(), 3);
      const players = [createTestPlayer(), createTestPlayer({ isCpu: true, name: 'CPU' })];

      // Act
      const result = confirmSelection(state, [deck, createDeck()], players);

      // Assert
      expect(result.state.confirmed).toBe(true);
      expect(result.decks[0].history).toHaveLength(1);
    });
  });
});
