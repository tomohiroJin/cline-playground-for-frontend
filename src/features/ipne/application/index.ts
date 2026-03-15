export { tickGameState, TickDisplayEffect, TickSoundEffect, TickSaveEffect } from './engine/tickGameState';
export type {
  TickGameStateInput,
  TickGameStateResult,
  TickSoundEffectValue,
  TickDisplayEffectValue,
  TickSaveEffectValue,
  GameTickEffect,
} from './engine/tickGameState';

export { resolveKnockback } from './usecases/resolveKnockback';
export { resolvePlayerDamage } from './usecases/resolvePlayerDamage';
export type { ResolvePlayerDamageResult } from './usecases/resolvePlayerDamage';
export { resolveItemPickupEffects } from './usecases/resolveItemPickupEffects';
export type { ItemPickupEffectEvent } from './usecases/resolveItemPickupEffects';
export { resolveEnemyUpdates } from './usecases/resolveEnemyUpdates';
export { resolveRegen, REGEN_CONFIG } from './usecases/resolveRegen';
export { resolveTraps } from './usecases/resolveTraps';
export type { ResolveTrapsInput, ResolveTrapsResult } from './usecases/resolveTraps';
