/**
 * 灰燼の城壁 - ユースケース: ラン開始
 */
import type { RandomPort } from '../ports/random-port';
import { INITIAL_DECK } from '../../domain/cards/card-pool';
import { drawHand, shuffle } from '../../domain/cards/deck';
import { createBoard } from '../../domain/board/board-state';
import { PLAINS_MAP } from '../../domain/board/stage-map';
import { NO_MODIFIERS } from '../../domain/combat/simulate-wave';
import {
  INITIAL_LIFE,
  INITIAL_MANA_MAX,
  type RunState,
} from '../../domain/run/run-state';

export const startRun = (rng: RandomPort): RunState => {
  const random = () => rng.random();
  const drawPile = shuffle(INITIAL_DECK, random);
  const deck = drawHand({ drawPile, hand: [], discardPile: [] }, random);
  return {
    phase: 'preparation',
    status: 'playing',
    life: INITIAL_LIFE,
    mana: INITIAL_MANA_MAX,
    manaMax: INITIAL_MANA_MAX,
    deck,
    board: createBoard(PLAINS_MAP),
    waveIndex: 0,
    pendingModifiers: { ...NO_MODIFIERS },
    rewardChoices: [],
    score: 0,
    lastResult: null,
  };
};
