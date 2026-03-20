// ドリフト物理計算モジュール
// 移行期間中: domain/player/drift.ts へ委譲

import type { DriftState } from './types';
import { Config, DRIFT } from './constants';
import {
  createDriftState,
  startDrift,
  updateDrift,
  endDrift,
  cancelDrift,
  getDriftBoost,
  getDriftSpeedRetain,
} from './domain/player/drift';

// 旧名での re-export（後方互換）
export const initDriftState = createDriftState;
export { startDrift, updateDrift, endDrift, cancelDrift, getDriftBoost, getDriftSpeedRetain };

/** ドリフト中の角速度倍率を取得 */
export const getDriftTurnRate = (): number => {
  return Config.game.turnRate * DRIFT.ANGLE_MULTIPLIER;
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

// 型の re-export
export type { DriftState };
