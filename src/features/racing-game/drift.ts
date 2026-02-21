// ドリフト物理計算モジュール

import type { DriftState } from './types';
import { Config, DRIFT } from './constants';
import { Utils } from './utils';

/** ドリフト状態の初期値を生成 */
export const initDriftState = (): DriftState => ({
  active: false,
  duration: 0,
  slipAngle: 0,
  boostRemaining: 0,
  boostPower: 0,
});

/** ドリフト開始判定（条件を満たせばドリフト状態に遷移） */
export const startDrift = (state: DriftState, speed: number): DriftState => {
  // 既にドリフト中なら何もしない
  if (state.active) return state;
  // 最低速度チェック
  if (speed < DRIFT.MIN_SPEED) return state;
  return {
    ...state,
    active: true,
    duration: 0,
    slipAngle: 0,
  };
};

/** ドリフト中のフレーム更新 */
export const updateDrift = (
  state: DriftState,
  steering: number,
  speed: number,
  dt: number
): DriftState => {
  if (!state.active) {
    // ドリフト中でない場合はブースト残り時間の減衰のみ処理
    // （getDriftBoost が ratio ベースの線形減衰を適用するため、boostPower は変更しない）
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
  const slipLerp = Utils.clamp(dt * 3, 0, 1);
  const newSlipAngle = state.slipAngle + (targetSlip - state.slipAngle) * slipLerp;

  return {
    ...state,
    duration: newDuration,
    slipAngle: newSlipAngle,
  };
};

/** ドリフト終了・ブースト計算 */
export const endDrift = (state: DriftState): DriftState => {
  if (!state.active) return state;

  // ブースト量の計算
  const boostPower = Math.min(
    DRIFT.BOOST_BASE + state.duration * DRIFT.BOOST_PER_SEC,
    DRIFT.BOOST_MAX
  );

  return {
    active: false,
    duration: 0,
    slipAngle: 0,
    boostRemaining: DRIFT.BOOST_DURATION,
    boostPower,
  };
};

/** 壁/衝突時のドリフト強制終了（ブーストなし） */
export const cancelDrift = (state: DriftState): DriftState => {
  if (!state.active) return state;
  return {
    active: false,
    duration: 0,
    slipAngle: 0,
    boostRemaining: 0,
    boostPower: 0,
  };
};

/** 現在のブースト値取得 */
export const getDriftBoost = (state: DriftState): number => {
  if (state.boostRemaining <= 0) return 0;
  // ブースト時間に比例して線形減衰
  const ratio = state.boostRemaining / DRIFT.BOOST_DURATION;
  return state.boostPower * ratio;
};

/** ドリフト中の角速度倍率を取得 */
export const getDriftTurnRate = (): number => {
  return Config.game.turnRate * DRIFT.ANGLE_MULTIPLIER;
};

/** ドリフト中の速度維持率を取得 */
export const getDriftSpeedRetain = (): number => {
  return DRIFT.SPEED_RETAIN;
};

export const Drift = {
  initState: initDriftState,
  start: startDrift,
  update: updateDrift,
  end: endDrift,
  cancel: cancelDrift,
  getBoost: getDriftBoost,
  getTurnRate: getDriftTurnRate,
  getSpeedRetain: getDriftSpeedRetain,
};
