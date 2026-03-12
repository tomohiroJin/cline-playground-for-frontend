/**
 * コンボシステム（純粋関数）
 *
 * 草原ステージのコンボ管理とスウィープ判定を担当する。
 */
import { assert } from '../contracts/assertions';

/** コンボ状態 */
export interface ComboState {
  readonly count: number;
  readonly maxCombo: number;
  readonly sweepReady: boolean;
}

/** スウィープ発動に必要なコンボ数 */
const SWEEP_THRESHOLD = 4;

/** コンボ初期状態 */
export function createComboState(): ComboState {
  return { count: 0, maxCombo: 0, sweepReady: false };
}

/** キル時のコンボ更新 */
export function incrementCombo(state: ComboState): ComboState {
  const next = state.count + 1;
  return {
    count: next,
    maxCombo: Math.max(state.maxCombo, next),
    sweepReady: next >= SWEEP_THRESHOLD,
  };
}

/** コンボリセット */
export function resetCombo(state: ComboState): ComboState {
  return { ...state, count: 0, sweepReady: false };
}

/** スウィープ実行後のコンボ更新 */
export function afterSweep(state: ComboState): ComboState {
  assert(state.sweepReady, 'スウィープはコンボ到達後のみ実行可能');
  return { ...state, count: 0, sweepReady: false };
}

/** コンボボーナスポイント計算 */
export function comboBonus(comboCount: number): number {
  assert(comboCount >= 0, 'コンボ数は 0 以上');
  if (comboCount <= 1) return 0;
  return (comboCount - 1) * 50;
}
