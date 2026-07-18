/**
 * 灰燼の城壁 - ユースケース: 報酬選択（スキップ可）
 */
import type { RandomPort } from '../ports/random-port';
import { drawHand } from '../../domain/cards/deck';
import type { RunState } from '../../domain/run/run-state';

export const chooseReward = (
  state: RunState,
  choiceIndex: number | null,
  rng: RandomPort
): RunState => {
  if (state.phase !== 'reward') {
    throw new Error('報酬フェーズ以外では報酬を選択できません');
  }
  let discardPile = state.deck.discardPile;
  if (choiceIndex !== null) {
    const cardId = state.rewardChoices[choiceIndex];
    if (cardId === undefined) {
      throw new Error(`報酬の選択が不正です: ${choiceIndex}`);
    }
    discardPile = [...discardPile, cardId];
  }
  const random = () => rng.random();
  const deck = drawHand({ ...state.deck, discardPile }, random);
  return {
    ...state,
    deck,
    mana: state.manaMax,
    phase: 'preparation',
    rewardChoices: [],
    lastResult: null,
  };
};
