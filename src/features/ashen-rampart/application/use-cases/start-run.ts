/**
 * 灰燼の城壁 - ラン開始
 *
 * 乱数を使うのはここだけ。以後 stepTick は決定的に進むため、
 * シードを記録すればランを完全に再現できる。
 */
import type { RandomPort } from '../ports/random-port';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { createDeck } from '../../domain/cards/deck';
import { createCombatState, type CombatState } from '../../domain/combat/combat-state';
import { PLAINS_WAVES } from '../../domain/combat/waves';

export const startRun = (presetId: string, random: RandomPort): CombatState => {
  const preset = PRESET_DECKS[presetId];
  if (!preset) {
    throw new Error(`未知のプリセットデッキです: ${presetId}`);
  }
  const deck = createDeck(preset.cards, () => random.random());
  return createCombatState(deck, PLAINS_WAVES);
};
