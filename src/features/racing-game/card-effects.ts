// カード効果乗算の共通関数（DRY）

import type { CardEffect } from './types';

/** カード効果配列から指定フィールドの乗算値を計算（デフォルト1） */
export const getCardMultiplier = (
  cards: readonly CardEffect[],
  field: keyof CardEffect
): number =>
  cards.reduce((acc, c) => acc * ((c[field] as number | undefined) ?? 1), 1);

/** 全カード効果の乗算値を一括計算 */
export interface ComputedCardEffects {
  readonly speedMul: number;
  readonly accelMul: number;
  readonly turnMul: number;
  readonly driftBoostMul: number;
  readonly heatGainMul: number;
  readonly wallDamageMul: number;
}

export const computeAllCardEffects = (
  cards: readonly CardEffect[]
): ComputedCardEffects => ({
  speedMul: getCardMultiplier(cards, 'speedMultiplier'),
  accelMul: getCardMultiplier(cards, 'accelMultiplier'),
  turnMul: getCardMultiplier(cards, 'turnMultiplier'),
  driftBoostMul: getCardMultiplier(cards, 'driftBoostMultiplier'),
  heatGainMul: getCardMultiplier(cards, 'heatGainMultiplier'),
  wallDamageMul: getCardMultiplier(cards, 'wallDamageMultiplier'),
});
