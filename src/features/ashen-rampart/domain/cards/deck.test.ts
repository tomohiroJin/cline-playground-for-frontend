import { shuffle, drawHand, HAND_SIZE, DeckState } from './deck';
import { SeededRandom } from '../../infrastructure/random/seeded-random';

const makeRandom = (seed: number) => {
  const rng = new SeededRandom(seed);
  return () => rng.random();
};

describe('shuffle', () => {
  it('同じシードなら同じ並びになる（決定性）', () => {
    const cards = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffle(cards, makeRandom(1))).toEqual(shuffle(cards, makeRandom(1)));
  });

  it('要素の集合は変わらない', () => {
    const cards = ['a', 'b', 'c', 'd', 'e'];
    expect([...shuffle(cards, makeRandom(9))].sort()).toEqual([...cards].sort());
  });

  it('元の配列を破壊しない', () => {
    const cards = ['a', 'b', 'c'];
    shuffle(cards, makeRandom(1));
    expect(cards).toEqual(['a', 'b', 'c']);
  });
});

describe('drawHand', () => {
  it('山札から5枚引く', () => {
    const deck: DeckState = {
      drawPile: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      hand: [],
      discardPile: [],
    };
    const next = drawHand(deck, makeRandom(1));
    expect(next.hand).toHaveLength(HAND_SIZE);
    expect(next.drawPile).toHaveLength(2);
  });

  it('現在の手札は捨札に送られる', () => {
    const deck: DeckState = {
      drawPile: ['a', 'b', 'c', 'd', 'e'],
      hand: ['x', 'y'],
      discardPile: [],
    };
    const next = drawHand(deck, makeRandom(1));
    expect(next.discardPile).toEqual(expect.arrayContaining(['x', 'y']));
  });

  it('山札不足時は捨札をシャッフルして補充する', () => {
    const deck: DeckState = {
      drawPile: ['a', 'b'],
      hand: [],
      discardPile: ['c', 'd', 'e', 'f'],
    };
    const next = drawHand(deck, makeRandom(1));
    expect(next.hand).toHaveLength(HAND_SIZE);
    expect(next.discardPile).toHaveLength(0);
    expect(next.drawPile).toHaveLength(1);
  });

  it('全カードが5枚未満なら引けるだけ引く', () => {
    const deck: DeckState = { drawPile: ['a', 'b'], hand: [], discardPile: ['c'] };
    const next = drawHand(deck, makeRandom(1));
    expect(next.hand).toHaveLength(3);
  });
});
