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
  it('山札の先頭を手札に加える', () => {
    const deck = { drawPile: ['x', 'y'], hand: ['a'], graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBe('x');
    expect(result.overflowed).toBe(false);
    expect(result.deck.hand).toEqual(['a', 'x']);
    expect(result.deck.drawPile).toEqual(['y']);
  });

  it('手札が上限なら引いた札は墓地へ直行する', () => {
    const full = Array.from({ length: HAND_LIMIT }, (_, i) => `h${i}`);
    const deck = { drawPile: ['x'], hand: full, graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBe('x');
    expect(result.overflowed).toBe(true);
    expect(result.deck.hand).toEqual(full);
    expect(result.deck.graveyard).toEqual(['x']);
  });

  it('山札が空なら何も起きない', () => {
    const deck = { drawPile: [], hand: ['a'], graveyard: [] };
    const result = drawOne(deck);
    expect(result.drawn).toBeUndefined();
    expect(result.overflowed).toBe(false);
    expect(result.deck).toEqual(deck);
  });

  it('元の状態を変更しない', () => {
    const deck = { drawPile: ['x'], hand: ['a'], graveyard: [] };
    drawOne(deck);
    expect(deck.drawPile).toEqual(['x']);
    expect(deck.hand).toEqual(['a']);
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
