import { ALL_CARDS, createDeck, drawCards, selectCard, getActiveEffects, clearActiveEffects, cpuSelectCard, applyCardEffects } from '../draft-cards';
import type { DeckState, CardEffect } from '../types';

describe('ドラフトカードシステム', () => {
  describe('createDeck', () => {
    test('プールに全14枚が入り、hand/active/history は空', () => {
      const deck = createDeck();
      expect(deck.pool).toHaveLength(ALL_CARDS.length);
      expect(deck.hand).toEqual([]);
      expect(deck.active).toEqual([]);
      expect(deck.history).toEqual([]);
    });
  });

  describe('drawCards', () => {
    test('デフォルトで手札3枚がドローされる', () => {
      const deck = createDeck();
      const drawn = drawCards(deck);
      expect(drawn.hand).toHaveLength(3);
      expect(drawn.pool.length).toBeLessThan(deck.pool.length);
    });

    test('プール不足時にリシャッフルされる', () => {
      const deck: DeckState = { pool: [ALL_CARDS[0]], hand: [], active: [], history: [] };
      const drawn = drawCards(deck, 3);
      expect(drawn.hand).toHaveLength(3);
      // リシャッフル後のプールから3枚引いた残り
      expect(drawn.pool.length).toBe(ALL_CARDS.length - 3);
    });
  });

  describe('selectCard', () => {
    const baseDeck: DeckState = {
      pool: [],
      hand: [ALL_CARDS[0], ALL_CARDS[1], ALL_CARDS[2]],
      active: [],
      history: [],
    };

    test('選択カードが history に追加される', () => {
      const result = selectCard(baseDeck, ALL_CARDS[0].id);
      expect(result.history).toContainEqual(ALL_CARDS[0]);
    });

    test('残り2枚がプールに戻される', () => {
      const result = selectCard(baseDeck, ALL_CARDS[0].id);
      expect(result.pool).toEqual(expect.arrayContaining([ALL_CARDS[1], ALL_CARDS[2]]));
    });

    test('選択カードの効果が active に追加される', () => {
      const result = selectCard(baseDeck, ALL_CARDS[0].id);
      expect(result.active).toContainEqual(ALL_CARDS[0].effect);
      expect(result.hand).toEqual([]);
    });

    test('存在しない cardId の場合はデッキが変更されない', () => {
      const result = selectCard(baseDeck, 'NONEXISTENT');
      expect(result).toBe(baseDeck);
    });

    test('ワイルドカード(SPC_03)は2つの効果を生成する', () => {
      const wildcard = ALL_CARDS.find(c => c.id === 'SPC_03')!;
      const wildcardDeck: DeckState = {
        pool: [],
        hand: [wildcard, ALL_CARDS[0], ALL_CARDS[1]],
        active: [],
        history: [],
      };
      const result = selectCard(wildcardDeck, 'SPC_03');
      expect(result.active).toHaveLength(2);
      expect(result.history).toContainEqual(wildcard);
    });
  });

  describe('getActiveEffects', () => {
    test('active が空なら空オブジェクトを返す', () => {
      const deck: DeckState = { pool: [], hand: [], active: [], history: [] };
      expect(getActiveEffects(deck)).toEqual({});
    });

    test('speedMultiplier が加算合算される', () => {
      const deck: DeckState = {
        pool: [], hand: [], history: [],
        active: [{ speedMultiplier: 1.15 }, { speedMultiplier: 1.10 }],
      };
      // 1.0 + (1.15 - 1) + (1.10 - 1) = 1.25
      expect(getActiveEffects(deck).speedMultiplier).toBeCloseTo(1.25, 5);
    });

    test('shieldCount が加算される', () => {
      const deck: DeckState = {
        pool: [], hand: [], history: [],
        active: [{ shieldCount: 1 }, { shieldCount: 2 }],
      };
      expect(getActiveEffects(deck).shieldCount).toBe(3);
    });

    test('specialType は最後の値が採用される', () => {
      const deck: DeckState = {
        pool: [], hand: [], history: [],
        active: [{ specialType: 'slipstream' }, { specialType: 'aero' }],
      };
      expect(getActiveEffects(deck).specialType).toBe('aero');
    });
  });

  describe('clearActiveEffects', () => {
    test('active が空になり他のフィールドは保持される', () => {
      const deck: DeckState = {
        pool: [ALL_CARDS[0]],
        hand: [ALL_CARDS[1]],
        active: [{ speedMultiplier: 1.15 }],
        history: [ALL_CARDS[2]],
      };
      const cleared = clearActiveEffects(deck);
      expect(cleared.active).toEqual([]);
      expect(cleared.pool).toEqual(deck.pool);
      expect(cleared.hand).toEqual(deck.hand);
      expect(cleared.history).toEqual(deck.history);
    });
  });

  describe('cpuSelectCard', () => {
    test('手札が空の場合はデッキが変更されない', () => {
      const deck: DeckState = { pool: [], hand: [], active: [], history: [] };
      const result = cpuSelectCard(deck, 0.5);
      expect(result).toBe(deck);
    });
  });

  describe('applyCardEffects', () => {
    test('効果が未指定の場合はデフォルト値が返される', () => {
      const result = applyCardEffects({});
      expect(result).toEqual({
        speedMul: 1, accelMul: 1, turnMul: 1,
        driftBoostMul: 1, wallDamageMul: 1, heatGainMul: 1, shieldCount: 0,
      });
    });

    test('指定した効果値が反映される', () => {
      const effects: CardEffect = { speedMultiplier: 1.25, shieldCount: 2 };
      const result = applyCardEffects(effects);
      expect(result.speedMul).toBe(1.25);
      expect(result.shieldCount).toBe(2);
    });
  });
});
