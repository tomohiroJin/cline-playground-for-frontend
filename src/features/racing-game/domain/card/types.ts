// Card ドメイン型定義

export type CardCategory = 'speed' | 'handling' | 'defense' | 'special';
export type CardRarity = 'R' | 'SR' | 'SSR';

/** カード特殊効果タイプ */
export type SpecialType = 'slipstream' | 'drift_master' | 'aero' | 'recovery_boost' | 'wildcard';

export interface CardEffect {
  speedMultiplier?: number;
  accelMultiplier?: number;
  turnMultiplier?: number;
  driftBoostMultiplier?: number;
  wallDamageMultiplier?: number;
  heatGainMultiplier?: number;
  shieldCount?: number;
  specialType?: SpecialType;
  duration?: number;
}

export interface Card {
  id: string;
  name: string;
  category: CardCategory;
  rarity: CardRarity;
  description: string;
  effect: CardEffect;
  icon: string;
}

export interface DeckState {
  pool: Card[];
  hand: Card[];
  active: CardEffect[];
  history: Card[];
}
