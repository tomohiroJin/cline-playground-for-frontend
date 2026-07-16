import { startRun } from './start-run';
import { playCard } from './play-card';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../../domain/board/stage-map';
import { getCardDefinition } from '../../domain/cards/card-pool';
import { INITIAL_LIFE, INITIAL_MANA_MAX } from '../../domain/run/run-state';
import { HAND_SIZE } from '../../domain/cards/deck';

describe('startRun', () => {
  it('準備フェーズ・ライフ10・マナ4・手札5枚で開始する', () => {
    const state = startRun(new SeededRandom(42));
    expect(state.phase).toBe('preparation');
    expect(state.status).toBe('playing');
    expect(state.life).toBe(INITIAL_LIFE);
    expect(state.mana).toBe(INITIAL_MANA_MAX);
    expect(state.deck.hand).toHaveLength(HAND_SIZE);
    expect(state.waveIndex).toBe(0);
    expect(state.board.towers).toHaveLength(0);
  });
});

describe('playCard', () => {
  // シード探索用ヘルパ: 手札に指定タイプのカードが来るシードで開始する
  const startWithCardInHand = (type: string) => {
    for (let seed = 0; seed < 100; seed++) {
      const state = startRun(new SeededRandom(seed));
      const idx = state.deck.hand.findIndex(
        (id) => getCardDefinition(id).type === type
      );
      if (idx >= 0) return { state, idx };
    }
    throw new Error(`テスト用シードが見つかりません: ${type}`);
  };

  it('タワーカードを設置マスに使うとタワーが建ちマナが減る', () => {
    const { state, idx } = startWithCardInHand('tower');
    const cost = getCardDefinition(state.deck.hand[idx]).cost;
    const next = playCard(state, idx, PLAINS_MAP.buildSlots[0]);
    expect(next.board.towers).toHaveLength(1);
    expect(next.mana).toBe(state.mana - cost);
    expect(next.deck.hand).toHaveLength(state.deck.hand.length - 1);
  });

  it('タワーカードは捨札に行かない（盤面への永続投資）', () => {
    const { state, idx } = startWithCardInHand('tower');
    const next = playCard(state, idx, PLAINS_MAP.buildSlots[0]);
    expect(next.deck.discardPile).toHaveLength(state.deck.discardPile.length);
  });

  it('スペルカードは捨札に行く', () => {
    const { state, idx } = startWithCardInHand('spell');
    const cardId = state.deck.hand[idx];
    const next = playCard(state, idx);
    expect(next.deck.discardPile).toContain(cardId);
  });

  it('業火を使うと次ウェーブの openingDamage が積まれる', () => {
    for (let seed = 0; seed < 100; seed++) {
      const state = startRun(new SeededRandom(seed));
      const idx = state.deck.hand.findIndex((id) => id === 'fire-blast');
      if (idx < 0) continue;
      const next = playCard(state, idx);
      expect(next.pendingModifiers.openingDamage).toBe(8);
      return;
    }
    throw new Error('テスト用シードが見つかりません: fire-blast');
  });

  it('マナ不足なら例外を投げる', () => {
    const { state, idx } = startWithCardInHand('tower');
    const broke = { ...state, mana: 0 };
    expect(() => playCard(broke, idx, PLAINS_MAP.buildSlots[0])).toThrow();
  });

  it('タワーを経路マスに置こうとすると例外を投げる', () => {
    const { state, idx } = startWithCardInHand('tower');
    expect(() => playCard(state, idx, PLAINS_MAP.path[0])).toThrow();
  });

  it('準備フェーズ以外では使えない', () => {
    const { state, idx } = startWithCardInHand('tower');
    const combat = { ...state, phase: 'combat' as const };
    expect(() => playCard(combat, idx, PLAINS_MAP.buildSlots[0])).toThrow();
  });
});
