import type { RuntimeStageConfig } from '../types';
import { ROWS, CALM_THRESHOLD_RATIO, CALM_SPEED_FACTOR, CYCLE_TAIL_STEPS } from '../constants';
import type { RngApi } from './phases/types';

/** サイクルのタイミング計算結果 */
export interface CycleTiming {
  /** アニメーション全体の所要時間(ms) */
  totalDur: number;
  /** 1ステップ（1行）あたりの時間(ms) */
  step: number;
}

/** フェイク障害物の出現確率 */
const FAKE_CHANCE = 0.2;

/** calcCycleTiming のパラメータ */
export interface CycleTimingParams {
  cfg: RuntimeStageConfig;
  /** ワープモディファイア値 */
  wm: number;
  speedMod: number;
  slowMod: number;
  cycle: number;
}

/**
 * サイクルのアニメーション速度を計算する純粋関数
 *
 * _calm モードでは終盤（サイクルが全体の70%超）に加速する。
 */
export function calcCycleTiming(params: CycleTimingParams): CycleTiming {
  const { cfg, wm, speedMod, slowMod, cycle } = params;
  // _calm モードの終盤加速
  const calmMultiplier = cfg._calm && cycle > cfg.cy * CALM_THRESHOLD_RATIO ? CALM_SPEED_FACTOR : 1;
  const totalDur =
    cfg.spd * (1 + wm + speedMod) * (1 + slowMod) * calmMultiplier;
  const step = totalDur / (ROWS + CYCLE_TAIL_STEPS);
  return { totalDur, step };
}

/**
 * フェイク障害物のレーンインデックスを選択する
 *
 * 条件を満たさない場合は -1 を返す。
 */
export function pickFakeObstacle(
  cfg: RuntimeStageConfig,
  obstacles: readonly number[],
  rng: RngApi,
): number {
  if (!cfg.fk || obstacles.length === 0 || !rng.chance(FAKE_CHANCE)) {
    return -1;
  }
  return rng.pick(obstacles);
}
