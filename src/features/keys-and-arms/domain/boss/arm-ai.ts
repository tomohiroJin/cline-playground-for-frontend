/**
 * 腕 AI（純粋関数）
 *
 * ボスステージの 6 本の腕を独立制御する。
 * 各腕は stage 0-6 の進行と休息のサイクルを持つ。
 */
import { assert } from '../contracts/assertions';

/** 腕の最大ステージ */
export const ARM_MAX_STAGE = 6;

/** カウンター可能な最低ステージ */
const COUNTER_MIN_STAGE = 3;

/** 腕状態 */
export interface ArmState {
  readonly stage: number;
  readonly dir: number;
  readonly speed: number;
  readonly resting: boolean;
  readonly restTimer: number;
}

/** 腕の初期状態を生成 */
export function createArmState(speed: number, restTimer: number): ArmState {
  assert(speed > 0, '腕の速度は 1 以上');
  assert(restTimer >= 0, '休息タイマーは 0 以上');
  return { stage: 0, dir: 1, speed, resting: true, restTimer };
}

/** 腕を 1 ステージ進行 */
export function advanceArm(arm: ArmState): ArmState {
  return { ...arm, stage: Math.min(ARM_MAX_STAGE, arm.stage + 1) };
}

/** 腕を 1 ステージ後退 */
export function retreatArm(arm: ArmState): ArmState {
  return { ...arm, stage: Math.max(0, arm.stage - 1) };
}

/** 腕が攻撃到達地点にあるか */
export function isArmAtStrike(stage: number): boolean {
  return stage >= ARM_MAX_STAGE;
}

/** 腕が休眠中か */
export function isArmResting(resting: boolean): boolean {
  return resting;
}

/** 腕を休眠状態にリセット（共通処理） */
function resetArmToRest(arm: ArmState, restTime: number): ArmState {
  return { ...arm, stage: 0, resting: true, restTimer: restTime, dir: 1 };
}

/** 腕を休眠状態に移行 */
export function startArmRest(arm: ArmState, restTime: number): ArmState {
  return resetArmToRest(arm, restTime);
}

/** 休息タイマーを 1 減算 */
export function tickArmRest(arm: ArmState): ArmState {
  const nextTimer = arm.restTimer - 1;
  return { ...arm, restTimer: nextTimer, resting: nextTimer > 0 };
}

/** カウンターが可能か判定 */
export function isCounterPossible(armStage: number, armResting: boolean): boolean {
  return armStage >= COUNTER_MIN_STAGE && !armResting;
}

/** カウンター実行：腕をステージ 0 にリセット */
export function counterArm(arm: ArmState, restTime: number): ArmState {
  return resetArmToRest(arm, restTime);
}
