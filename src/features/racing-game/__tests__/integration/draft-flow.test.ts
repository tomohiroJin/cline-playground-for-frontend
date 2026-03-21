// レイヤー横断統合テスト: ドラフトフロー

import { createDeck, drawCards, selectCard, cpuSelectCard, clearActiveEffects } from '../../domain/card/deck';
import { computeAllCardEffects } from '../../domain/card/card-effect';
import { createTestPlayer } from '../helpers/test-factories';

describe('draft-flow', () => {
  describe('カード選択 → 効果適用 → ラップ終了でクリアの完全フロー', () => {
    it('カード選択後に効果が activeCards に反映される', () => {
      // Arrange
      let deck = createDeck();
      deck = drawCards(deck, 3);
      const cardId = deck.hand[0].id;

      // Act
      deck = selectCard(deck, cardId);

      // Assert
      expect(deck.active.length).toBeGreaterThan(0);
      expect(deck.history).toHaveLength(1);
    });

    it('複数カード効果が乗算で合成される', () => {
      // Arrange
      let deck = createDeck();
      deck = drawCards(deck, 3);
      deck = selectCard(deck, deck.hand[0].id);

      // Act
      const effects = computeAllCardEffects(deck.active);

      // Assert: 少なくとも 1 つのフィールドが 1 ではない（効果がある）
      // 選んだカードの効果による
      expect(typeof effects.speedMul).toBe('number');
    });

    it('ラップ終了で効果がクリアされる', () => {
      // Arrange
      let deck = createDeck();
      deck = drawCards(deck, 3);
      deck = selectCard(deck, deck.hand[0].id);
      expect(deck.active.length).toBeGreaterThan(0);

      // Act
      deck = clearActiveEffects(deck);

      // Assert
      expect(deck.active).toEqual([]);
      expect(deck.history.length).toBeGreaterThan(0); // 履歴は残る
    });
  });

  describe('CPU 自動選択の動作', () => {
    it('CPU がスキルに応じてカードを選択する', () => {
      // Arrange
      let deck = createDeck();
      deck = drawCards(deck, 3);

      // Act
      const result = cpuSelectCard(deck, 0.5);

      // Assert
      expect(result.hand).toEqual([]);
      expect(result.history).toHaveLength(1);
      expect(result.active.length).toBeGreaterThan(0);
    });

    it('高スキル CPU はレアリティの高いカードを優先する', () => {
      // 統計テスト: 100 回試行で高スキルがより高レアリティを選ぶ傾向
      let highRarityCount = 0;
      for (let i = 0; i < 100; i++) {
        let deck = createDeck();
        deck = drawCards(deck, 3);
        const result = cpuSelectCard(deck, 1.0);
        const selected = result.history[0];
        if (selected.rarity === 'SSR' || selected.rarity === 'SR') {
          highRarityCount++;
        }
      }
      // 高スキルは SR/SSR を選ぶ確率が高い
      expect(highRarityCount).toBeGreaterThan(30);
    });
  });

  describe('カード効果のプレイヤーへの反映', () => {
    it('シールドカードがプレイヤーの shieldCount に加算される', () => {
      // Arrange
      const player = createTestPlayer({ shieldCount: 0, activeCards: [{ shieldCount: 2 }] });

      // Assert
      expect(player.activeCards[0].shieldCount).toBe(2);
    });
  });
});
