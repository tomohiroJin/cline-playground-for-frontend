/**
 * 灰燼の城壁 - デッキ操作（純粋関数）
 */
import type { RandomFn } from '../shared/random';

export interface DeckState {
  drawPile: string[];
  hand: string[];
  discardPile: string[];
}

export const HAND_SIZE = 5;

/** Fisher-Yates シャッフル（非破壊） */
export const shuffle = (cards: readonly string[], random: RandomFn): string[] => {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 手札を引き直す。
 * 現在の手札を捨札に送り、山札から5枚引く。
 * 山札が尽きたら捨札をシャッフルして山札に戻す。
 */
export const drawHand = (deck: DeckState, random: RandomFn): DeckState => {
  let drawPile = [...deck.drawPile];
  let discardPile = [...deck.discardPile, ...deck.hand];
  const hand: string[] = [];
  while (hand.length < HAND_SIZE) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      drawPile = shuffle(discardPile, random);
      discardPile = [];
    }
    const card = drawPile.shift();
    if (card === undefined) break;
    hand.push(card);
  }
  return { drawPile, hand, discardPile };
};
