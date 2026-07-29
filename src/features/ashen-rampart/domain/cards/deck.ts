/**
 * 灰燼の城壁 - デッキ（山札・手札・墓地）
 *
 * 使ったカードは墓地へ行き戻らない（有限）。山札はラン開始時に
 * 一度だけシャッフルし、以後は先頭から引くだけ。これにより
 * stepTick は乱数を必要とせず完全に決定的になる（設計書 §8.1）。
 */
import type { RandomFn } from '../shared/random';
import { getCardDefinition } from './card-pool';

export interface DeckState {
  drawPile: string[];
  hand: string[];
  graveyard: string[];
}

/** 手札上限。超えて引いた札は墓地へ直行する */
export const HAND_LIMIT = 5;

/** ラン開始時に配る枚数 */
export const INITIAL_HAND_SIZE = 3;

/** Fisher-Yates。元配列は変更しない */
export const shuffle = (cards: readonly string[], rng: RandomFn): string[] => {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = result[i];
    const b = result[j];
    if (a !== undefined && b !== undefined) {
      result[i] = b;
      result[j] = a;
    }
  }
  return result;
};

/** シャッフルして初期手札を配る */
export const createDeck = (cardIds: readonly string[], rng: RandomFn): DeckState => {
  const shuffled = shuffle(cardIds, rng);
  return {
    hand: shuffled.slice(0, INITIAL_HAND_SIZE),
    drawPile: shuffled.slice(INITIAL_HAND_SIZE),
    graveyard: [],
  };
};

export interface DrawOutcome {
  deck: DeckState;
  /** 引いた札。山札が空なら undefined */
  drawn?: string;
  /** 手札上限のため墓地へ直行したか */
  overflowed: boolean;
}

/**
 * 山札から1枚引く
 *
 * 手札が上限なら、引いた札はそのまま墓地へ落ちる。
 * 「出さないと引けない」という圧力がこの仕様から生まれる（設計書 §4.1）。
 *
 * 例外: コスト0の札（魔力炉）は手札上限を超えても手札に入る。
 * コスト0札は唯一のマナ源であり、これが墓地へ落ちるとマナが二度と増えず
 * 詰む（Task 9 のバランス較正で発見）。上限超過を1枚許容してでも
 * 経済を回復不能にしないことを優先する。
 */
export const drawOne = (deck: DeckState): DrawOutcome => {
  const [drawn, ...rest] = deck.drawPile;
  if (drawn === undefined) {
    return { deck, overflowed: false };
  }
  const isFreeManaSource = getCardDefinition(drawn).cost === 0;
  if (deck.hand.length >= HAND_LIMIT && !isFreeManaSource) {
    return {
      deck: { ...deck, drawPile: rest, graveyard: [...deck.graveyard, drawn] },
      drawn,
      overflowed: true,
    };
  }
  return {
    deck: { ...deck, drawPile: rest, hand: [...deck.hand, drawn] },
    drawn,
    overflowed: false,
  };
};

/** 手札の1枚を墓地へ移す（カードを使ったとき） */
export const discardFromHand = (deck: DeckState, handIndex: number): DeckState => {
  const card = deck.hand[handIndex];
  if (card === undefined) return deck;
  return {
    ...deck,
    hand: deck.hand.filter((_, i) => i !== handIndex),
    graveyard: [...deck.graveyard, card],
  };
};
