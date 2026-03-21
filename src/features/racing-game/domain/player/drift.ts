// ドリフト物理計算（純粋関数・副作用なし）

import type { DriftState } from './types';
import { DRIFT } from './constants';
import { clamp } from '../shared/math-utils';
import { assertPositive } from '../shared/assertions';

/** ドリフト状態の初期値を生成 */
export const createDriftState = (): DriftState => ({
  active: false,
  duration: 0,
  slipAngle: 0,
  boostRemaining: 0,
  boostPower: 0,
});

/** ドリフト開始判定 */
export const startDrift = (state: DriftState, speed: number): DriftState => {
  if (state.active) return state;
  if (speed < DRIFT.MIN_SPEED) return state;
  return { ...state, active: true, duration: 0, slipAngle: 0 };
};

/** ドリフト中のフレーム更新 */
export const updateDrift = (
  state: DriftState,
  steering: number,
  speed: number,
  dt: number,
): DriftState => {
  // 事前条件
  assertPositive(dt, 'dt');

  if (!state.active) {
    // ブースト残り時間の減衰のみ
    if (state.boostRemaining > 0) {
      const remaining = Math.max(0, state.boostRemaining - dt);
      return {
        ...state,
        boostRemaining: remaining,
        boostPower: remaining > 0 ? state.boostPower : 0,
      };
    }
    return state;
  }

  // 速度低下による自動終了
  if (speed < 0.2) {
    return endDrift(state);
  }

  const newDuration = state.duration + dt;

  // スリップ角の計算
  const targetSlip = steering !== 0 ? Math.sign(steering) * DRIFT.MAX_SLIP_ANGLE * 0.6 : 0;
  const slipLerp = clamp(dt * 3, 0, 1);
  const newSlipAngle = state.slipAngle + (targetSlip - state.slipAngle) * slipLerp;

  return { ...state, duration: newDuration, slipAngle: newSlipAngle };
};

/** ドリフト終了（通常） → ブースト付与 */
export const endDrift = (state: DriftState): DriftState => {
  if (!state.active) return state;

  const boostPower = Math.min(
    DRIFT.BOOST_BASE + state.duration * DRIFT.BOOST_PER_SEC,
    DRIFT.BOOST_MAX,
  );

  return {
    active: false,
    duration: 0,
    slipAngle: 0,
    boostRemaining: DRIFT.BOOST_DURATION,
    boostPower,
  };
};

/** ドリフトキャンセル（壁/衝突） → ブーストなし */
export const cancelDrift = (state: DriftState): DriftState => {
  if (!state.active) return state;
  return { active: false, duration: 0, slipAngle: 0, boostRemaining: 0, boostPower: 0 };
};

/** 現在のブースト値取得 */
export const getDriftBoost = (state: DriftState): number => {
  if (state.boostRemaining <= 0) return 0;
  const ratio = state.boostRemaining / DRIFT.BOOST_DURATION;
  return state.boostPower * ratio;
};

/** ドリフト中の速度維持率を取得 */
export const getDriftSpeedRetain = (): number => DRIFT.SPEED_RETAIN;
