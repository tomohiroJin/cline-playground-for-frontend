// キャンペーンの 1 フレーム分の状態更新 Use Case
//
// 設計方針: 既存 race-handler.ts には触れない。
// orchestrator が race-handler 実行の前後で本 Use Case を呼ぶことで、
// チェックポイント通過の検出と時間管理を実現する。
//
// 1 フレームの呼び出し順:
//   1) executeCampaignTickPre(runtime, prevCheckpointFlags = ...) を呼んで「直前のフラグ」を取る用意
//   2) 既存 race-handler を呼ぶ（プレイヤーの checkpointFlags が更新される）
//   3) executeCampaignTick(runtime, prevFlags, currentFlags, dt, hasFinished) を呼ぶ
//   → 戻り値で「ボーナス適用 + 時間進行 + 評価結果」が得られる

import type { CampaignRuntime } from '../campaign-runtime';
import type { StageOutcome } from '../../domain/race/stage-progress';
import { evaluateStage } from '../../domain/race/stage-progress';
import { advanceStageTime } from './advance-stage-time';
import { checkpointTimeBonus } from './checkpoint-time-bonus';

export type CampaignTickInput = {
  readonly runtime: CampaignRuntime;
  /** race-handler 実行前のチェックポイントフラグ */
  readonly prevCheckpointFlags: number;
  /** race-handler 実行後のチェックポイントフラグ */
  readonly currentCheckpointFlags: number;
  /** ゴールラインを通過したか（lap が確定したか） */
  readonly hasCrossedFinishLine: boolean;
  /** フレーム時間（秒） */
  readonly dt: number;
};

export type CampaignTickResult = {
  readonly runtime: CampaignRuntime;
  readonly outcome: StageOutcome;
  /** チェックポイントボーナスが適用されたなら、加算秒数（UI トースト用）。なければ undefined */
  readonly appliedBonusSec?: number;
};

/**
 * チェックポイントヒット = 「現フラグに、前フラグでは立っていなかったビットがある」
 */
const wasNewCheckpointPassed = (prev: number, current: number): boolean =>
  (current & ~prev) !== 0;

/**
 * 1 フレームのキャンペーン更新を実行する。
 *
 * 順序:
 *   1. チェックポイントヒットならボーナス加算
 *   2. 残時間を dt 減算（経過時間も加算）
 *   3. ゴール通過 or 時間切れの判定
 */
export const executeCampaignTick = (input: CampaignTickInput): CampaignTickResult => {
  let runtime = input.runtime;
  let appliedBonusSec: number | undefined;

  // 1. チェックポイントボーナス
  if (wasNewCheckpointPassed(input.prevCheckpointFlags, input.currentCheckpointFlags)) {
    const bonusResult = checkpointTimeBonus(runtime);
    runtime = bonusResult.runtime;
    appliedBonusSec = bonusResult.bonusSec;
  }

  // 2. 時間進行
  runtime = advanceStageTime(runtime, input.dt);

  // 3. 評価
  const outcome = evaluateStage(
    {
      stage: runtime.stage,
      timeRemainingSec: runtime.timeRemainingSec,
      elapsedSec: runtime.elapsedSec,
    },
    input.hasCrossedFinishLine,
  );

  return { runtime, outcome, appliedBonusSec };
};
