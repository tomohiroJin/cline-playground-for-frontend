/**
 * 契約モジュール barrel export
 *
 * DbC（Design by Contract）の事前条件・事後条件・不変条件を提供する。
 */
export { requireValidPlayer } from './player-contracts';
export { requireActiveBattle } from './battle-contracts';
export { requireValidEvolution } from './evolution-contracts';
export { assertRunInvariant } from './run-invariants';
export { ensureTickResult } from './tick-postconditions';
