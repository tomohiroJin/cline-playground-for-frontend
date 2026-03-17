/**
 * 迷宮の残響 - ドメイン層 barrel export
 */

// 契約
export { invariant } from './contracts/invariants';

// モデル
export type { StatusEffectId, PlayerStats, Player } from './models/player';
export { createPlayer as createPlayerModel } from './models/player';
export type { DifficultyId, DifficultyModifiers, DifficultyRewards, DifficultyDef } from './models/difficulty';
export type { LastRunInfo, MetaState } from './models/meta-state';
export { createMetaState, FRESH_META } from './models/meta-state';
export type { StatusEffectVisual, StatusEffectTick, StatusEffectDef } from './models/status-effect';
export type {
  UnlockCategory, UnlockEffectKey, UnlockEffectValue,
  UnlockDef, FxState,
} from './models/unlock';
export { FX_DEFAULTS, FX_MULT, FX_BOOL } from './models/unlock';
export { isStatusEffectId } from './models/player';
export type { EndingDef } from './models/ending';
export type {
  GamePhase, DeathCause, MenuScreen, LogEntry, GameState,
} from './models/game-state';

// イベント
export type { ComparisonOp, Condition } from './events/condition';
export { evaluateCondition, parseCondition, evalCondCompat } from './events/condition';
export type { RandomSource } from './events/random';
export { DefaultRandomSource, SeededRandomSource, shuffleWith } from './events/random';
export type { GameEvent, Choice, Outcome, EventTypeDef } from './events/game-event';
export { pickEvent, findChainEvent } from './events/event-selector';

// サービス
export {
  applyModifiers, applyChangesToPlayer, computeDrain,
  classifyImpact, checkSecondLife,
} from './services/combat-service';
export {
  computeFx, createNewPlayer, canPurchaseUnlock, checkAutoUnlocks,
} from './services/unlock-service';
export { determineEnding, getDeathFlavor, getDeathTip } from './services/ending-service';
export { getUnlockedTitles, getActiveTitle } from './services/title-service';

// 定数
export { CFG } from './constants/config';
export { FLOOR_META } from './constants/floor-meta';
export { DIFFICULTY } from './constants/difficulty-defs';
export { UNLOCKS } from './constants/unlock-defs';
export { ENDINGS } from './constants/ending-defs';
export { TITLES } from './constants/title-defs';
export { STATUS_META } from './constants/status-effect-defs';
export { UNLOCK_CATS } from './constants/unlock-defs';
export { DEATH_FLAVORS, DEATH_TIPS } from './constants/ending-defs';
