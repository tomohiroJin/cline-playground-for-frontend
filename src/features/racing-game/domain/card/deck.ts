// デッキ管理ロジック（純粋関数・副作用なし）

import type { Card, CardEffect, CardRarity, DeckState } from './types';
import { ALL_CARDS } from './card-catalog';
import { assertPositive } from '../shared/assertions';

/** レアリティのソート順 */
const RARITY_ORDER: Record<CardRarity, number> = { R: 1, SR: 2, SSR: 3 };

/** レアリティごとのドロー確率 */
const RARITY_PROB: Record<CardRarity, number> = {
  R: 0.6,
  SR: 0.3,
  SSR: 0.1,
};

/** Fisher-Yates シャッフル */
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** デッキの生成 */
export const createDeck = (): DeckState => ({
  pool: shuffle([...ALL_CARDS]),
  hand: [],
  active: [],
  history: [],
});

/** カードのドロー（確率ベース） */
export const drawCards = (deck: DeckState, count: number): DeckState => {
  // 事前条件
  assertPositive(count, 'count');

  const pool = deck.pool.length >= count ? [...deck.pool] : shuffle([...ALL_CARDS]);

  const hand: Card[] = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let targetRarity: CardRarity;
    if (roll < RARITY_PROB.SSR) {
      targetRarity = 'SSR';
    } else if (roll < RARITY_PROB.SSR + RARITY_PROB.SR) {
      targetRarity = 'SR';
    } else {
      targetRarity = 'R';
    }

    const idx = pool.findIndex(c => c.rarity === targetRarity);
    if (idx >= 0) {
      hand.push(pool[idx]);
      pool.splice(idx, 1);
    } else if (pool.length > 0) {
      hand.push(pool[0]);
      pool.splice(0, 1);
    }
  }

  return { ...deck, pool, hand };
};

/** カードの選択 */
export const selectCard = (deck: DeckState, cardId: string): DeckState => {
  const selected = deck.hand.find(c => c.id === cardId);
  if (!selected) return deck;

  // 残り手札はプールに戻す
  const remaining = deck.hand.filter(c => c.id !== cardId);
  const newPool = [...deck.pool, ...remaining];
  const pool = newPool.length < 3 ? shuffle([...ALL_CARDS]) : newPool;

  // ワイルドカード処理
  let effects: CardEffect[];
  if (selected.effect.specialType === 'wildcard') {
    const others = ALL_CARDS.filter(c => c.id !== 'SPC_03');
    const candidates = [...others];
    const picked: Card[] = [];
    for (let i = 0; i < 2 && candidates.length > 0; i++) {
      const idx = Math.floor(Math.random() * candidates.length);
      picked.push(candidates[idx]);
      candidates.splice(idx, 1);
    }
    effects = [...deck.active, ...picked.map(c => c.effect)];
  } else {
    effects = [...deck.active, selected.effect];
  }

  return {
    pool,
    hand: [],
    active: effects,
    history: [...deck.history, selected],
  };
};

/** CPU によるカード自動選択 */
export const cpuSelectCard = (deck: DeckState, skill: number): DeckState => {
  if (deck.hand.length === 0) return deck;

  const sorted = [...deck.hand].sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);

  const idx = Math.random() < skill ? 0 : Math.floor(Math.random() * sorted.length);
  return selectCard(deck, sorted[idx].id);
};

/** ラップ終了時の効果解除 */
export const clearActiveEffects = (deck: DeckState): DeckState => ({
  ...deck,
  active: [],
});
