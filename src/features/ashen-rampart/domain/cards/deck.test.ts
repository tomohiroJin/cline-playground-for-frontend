/**
 * デッキのテスト
 *
 * ドロー・手札上限・溢れ・墓地行きを検証する。手札上限の溢れは
 * 「引いた札がそのまま墓地へ落ちる」仕様（設計書 §4）であり、
 * プレイヤーは捨て札を選ばない。
 */
import {
  createDeck,
  drawOne,
  discardFromHand,
  shuffle,
  peekTop,
  takeFromPeek,
  HAND_LIMIT,
  INITIAL_HAND_SIZE,
} from './deck';
import type { RandomFn } from '../shared/random';

/** 常に 0 を返す＝Fisher-Yates が並びを変えない決定的な乱数 */
const zeroRng: RandomFn = () => 0;

describe('shuffle', () => {
  it('元の配列を変更しない', () => {
    const source = ['a', 'b', 'c'];
    shuffle(source, zeroRng);
    expect(source).toEqual(['a', 'b', 'c']);
  });

  it('要素の多重集合を保存する', () => {
    const result = shuffle(['a', 'b', 'b', 'c'], () => 0.5);
    expect([...result].sort()).toEqual(['a', 'b', 'b', 'c']);
  });
});

describe('createDeck', () => {
  it('初期手札を3枚配り、残りが山札になる', () => {
    const deck = createDeck(['a', 'b', 'c', 'd', 'e'], zeroRng);
    expect(deck.hand).toHaveLength(INITIAL_HAND_SIZE);
    expect(deck.drawPile).toHaveLength(2);
    expect(deck.graveyard).toEqual([]);
  });

  it('カードが初期手札より少なくても壊れない', () => {
    const deck = createDeck(['a'], zeroRng);
    expect(deck.hand).toEqual(['a']);
    expect(deck.drawPile).toEqual([]);
  });
});

describe('drawOne', () => {
  // 手札上限の判定にはカードのコストを見るため、実在するカードIDを使う
  // （'arrow-tower' 等はコスト0ではない＝有料札、'reactor' はコスト0＝魔力炉）
  it('山札の先頭を手札に加える', () => {
    const deck = { drawPile: ['arrow-tower', 'ballista'], hand: ['spike-trap'], graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBe('arrow-tower');
    expect(result.overflowed).toBe(false);
    expect(result.deck.hand).toEqual(['spike-trap', 'arrow-tower']);
    expect(result.deck.drawPile).toEqual(['ballista']);
  });

  it('手札が上限なら引いた有料札は墓地へ直行する', () => {
    const full = ['arrow-tower', 'ballista', 'cannon-tower', 'beacon', 'spike-trap'];
    expect(full).toHaveLength(HAND_LIMIT);
    const deck = { drawPile: ['mud-time'], hand: full, graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBe('mud-time');
    expect(result.overflowed).toBe(true);
    expect(result.deck.hand).toEqual(full);
    expect(result.deck.graveyard).toEqual(['mud-time']);
  });

  it('手札が上限でも、手札に魔力炉が無ければ引いた魔力炉は手札に入り、上限を1枚超える（マナ経済の唯一の源のため）', () => {
    const full = ['arrow-tower', 'ballista', 'cannon-tower', 'beacon', 'spike-trap'];
    expect(full).toHaveLength(HAND_LIMIT);
    const deck = { drawPile: ['reactor'], hand: full, graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBe('reactor');
    expect(result.overflowed).toBe(false);
    expect(result.deck.hand).toEqual([...full, 'reactor']);
    expect(result.deck.hand).toHaveLength(HAND_LIMIT + 1);
    expect(result.deck.graveyard).toEqual([]);
  });

  it('手札に魔力炉が既に1枚あるなら、追加で引いた魔力炉は上限超過を許さず墓地へ直行する（際限のない増加を防ぐ）', () => {
    // 前のテストで手札に入った魔力炉がそのまま残っている状態（6枚・うち魔力炉1枚）を想定
    const handWithOneReactor = [
      'arrow-tower',
      'ballista',
      'cannon-tower',
      'beacon',
      'spike-trap',
      'reactor',
    ];
    expect(handWithOneReactor).toHaveLength(HAND_LIMIT + 1);
    const deck = { drawPile: ['reactor'], hand: handWithOneReactor, graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBe('reactor');
    expect(result.overflowed).toBe(true);
    expect(result.deck.hand).toEqual(handWithOneReactor);
    expect(result.deck.hand).toHaveLength(HAND_LIMIT + 1);
    expect(result.deck.graveyard).toEqual(['reactor']);
  });

  it('山札が空なら何も起きない', () => {
    const deck = { drawPile: [], hand: ['arrow-tower'], graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBeUndefined();
    expect(result.overflowed).toBe(false);
    expect(result.deck).toEqual(deck);
  });

  it('元の状態を変更しない', () => {
    const deck = { drawPile: ['arrow-tower'], hand: ['spike-trap'], graveyard: [] };
    drawOne(deck);
    expect(deck.drawPile).toEqual(['arrow-tower']);
    expect(deck.hand).toEqual(['spike-trap']);
  });
});

describe('discardFromHand', () => {
  it('指定した手札を墓地へ移す', () => {
    const deck = { drawPile: [], hand: ['a', 'b', 'c'], graveyard: ['z'] };
    const next = discardFromHand(deck, 1);
    expect(next.hand).toEqual(['a', 'c']);
    expect(next.graveyard).toEqual(['z', 'b']);
  });

  it('範囲外のインデックスは何もしない', () => {
    const deck = { drawPile: [], hand: ['a'], graveyard: [] };
    expect(discardFromHand(deck, 5)).toEqual(deck);
  });
});

describe('peekTop / takeFromPeek（徴発）', () => {
  it('山札の上から n 枚を取り出し、山札から除く', () => {
    const deck = { drawPile: ['a', 'b', 'c', 'd'], hand: [], graveyard: [] };
    const { options, deck: next } = peekTop(deck, 3);
    expect(options).toEqual(['a', 'b', 'c']);
    expect(next.drawPile).toEqual(['d']);
  });

  it('山札が n 枚未満なら残り全部を取り出す', () => {
    const deck = { drawPile: ['a'], hand: [], graveyard: [] };
    const { options, deck: next } = peekTop(deck, 3);
    expect(options).toEqual(['a']);
    expect(next.drawPile).toEqual([]);
  });

  it('山札が空なら候補は空', () => {
    const deck = { drawPile: [], hand: [], graveyard: [] };
    expect(peekTop(deck, 3).options).toEqual([]);
  });

  it('元の状態を変更しない', () => {
    const deck = { drawPile: ['a', 'b'], hand: [], graveyard: [] };
    peekTop(deck, 2);
    expect(deck.drawPile).toEqual(['a', 'b']);
  });

  it('選んだ札は手札へ、残りは墓地へ', () => {
    const deck = { drawPile: [], hand: ['x'], graveyard: ['z'] };
    const next = takeFromPeek(deck, ['a', 'b', 'c'], 1);
    expect(next.hand).toEqual(['x', 'b']);
    expect(next.graveyard).toEqual(['z', 'a', 'c']);
  });

  it('範囲外のインデックスなら候補すべてを墓地へ送る', () => {
    const deck = { drawPile: [], hand: ['x'], graveyard: [] };
    const next = takeFromPeek(deck, ['a', 'b'], 9);
    expect(next.hand).toEqual(['x']);
    expect(next.graveyard).toEqual(['a', 'b']);
  });
});
