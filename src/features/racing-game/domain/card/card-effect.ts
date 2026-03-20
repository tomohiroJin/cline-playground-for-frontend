// カード効果計算（純粋関数・副作用なし）

import type { CardEffect } from './types';

/** 数値型のカード効果フィールド */
export type NumericCardField =
  | 'speedMultiplier'
  | 'accelMultiplier'
  | 'turnMultiplier'
  | 'driftBoostMultiplier'
  | 'wallDamageMultiplier'
  | 'heatGainMultiplier'
  | 'shieldCount'
  | 'duration';

/** カード効果配列から指定フィールドの乗算値を計算（デフォルト 1） */
export const getCardMultiplier = (
  cards: readonly CardEffect[],
  field: NumericCardField,
): number =>
  cards.reduce((acc, c) => acc * (c[field] ?? 1), 1);

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
  cards: readonly CardEffect[],
): ComputedCardEffects => ({
  speedMul: getCardMultiplier(cards, 'speedMultiplier'),
  accelMul: getCardMultiplier(cards, 'accelMultiplier'),
  turnMul: getCardMultiplier(cards, 'turnMultiplier'),
  driftBoostMul: getCardMultiplier(cards, 'driftBoostMultiplier'),
  heatGainMul: getCardMultiplier(cards, 'heatGainMultiplier'),
  wallDamageMul: getCardMultiplier(cards, 'wallDamageMultiplier'),
});
