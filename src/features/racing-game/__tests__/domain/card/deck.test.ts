// デッキ管理ロジックのテスト

import {
  createDeck,
  drawCards,
  selectCard,
  cpuSelectCard,
  clearActiveEffects,
} from '../../../domain/card/deck';
import { ALL_CARDS } from '../../../domain/card/card-catalog';

describe('deck', () => {
  describe('createDeck', () => {
    it('全カードからシャッフルされたデッキを生成する', () => {
      const deck = createDeck();
      expect(deck.pool.length).toBe(ALL_CARDS.length);
      expect(deck.hand).toEqual([]);
      expect(deck.active).toEqual([]);
      expect(deck.history).toEqual([]);
    });

    it('プールに全カードが含まれる', () => {
      const deck = createDeck();
      const ids = deck.pool.map(c => c.id).sort();
      const allIds = [...ALL_CARDS].map(c => c.id).sort();
      expect(ids).toEqual(allIds);
    });
  });

  describe('drawCards', () => {
    it('指定枚数の手札をドローする', () => {
      const deck = createDeck();
      const drawn = drawCards(deck, 3);
      expect(drawn.hand).toHaveLength(3);
    });

    it('ドロー後のプールサイズが減少する', () => {
      const deck = createDeck();
      const drawn = drawCards(deck, 3);
      // 手札 3 枚 + 残りプール = 元のプール数
      expect(drawn.hand.length + drawn.pool.length).toBeGreaterThanOrEqual(ALL_CARDS.length - 3);
    });

    it('count が 0 以下の場合はアサーションエラーになる', () => {
      const deck = createDeck();
      expect(() => drawCards(deck, 0)).toThrow();
    });
  });

  describe('selectCard', () => {
    it('手札からカードを選択し効果を適用する', () => {
      const deck = createDeck();
      const drawn = drawCards(deck, 3);
      const cardId = drawn.hand[0].id;
      const selected = selectCard(drawn, cardId);

      expect(selected.hand).toEqual([]);
      expect(selected.active.length).toBeGreaterThan(0);
      expect(selected.history).toHaveLength(1);
      expect(selected.history[0].id).toBe(cardId);
    });

    it('存在しないカード ID の場合はそのまま返す', () => {
      const deck = createDeck();
      const drawn = drawCards(deck, 3);
      const result = selectCard(drawn, 'NONEXISTENT');
      expect(result).toBe(drawn);
    });

    it('残り手札はプールに戻される', () => {
      const deck = createDeck();
      const drawn = drawCards(deck, 3);
      const selected = selectCard(drawn, drawn.hand[0].id);
      // 選択されなかった 2 枚がプールに戻る
      expect(selected.pool.length).toBeGreaterThanOrEqual(drawn.pool.length + 2);
    });
  });

  describe('cpuSelectCard', () => {
    it('手札からカードを自動選択する', () => {
      const deck = createDeck();
      const drawn = drawCards(deck, 3);
      const result = cpuSelectCard(drawn, 0.5);

      expect(result.hand).toEqual([]);
      expect(result.history).toHaveLength(1);
    });

    it('手札が空の場合はそのまま返す', () => {
      const deck = createDeck();
      const result = cpuSelectCard(deck, 0.5);
      expect(result).toBe(deck);
    });
  });

  describe('clearActiveEffects', () => {
    it('適用中の効果をクリアする', () => {
      const deck = createDeck();
      const drawn = drawCards(deck, 3);
      const selected = selectCard(drawn, drawn.hand[0].id);
      expect(selected.active.length).toBeGreaterThan(0);

      const cleared = clearActiveEffects(selected);
      expect(cleared.active).toEqual([]);
      // 他のフィールドは変更されない
      expect(cleared.pool).toBe(selected.pool);
      expect(cleared.history).toBe(selected.history);
    });
  });
});
