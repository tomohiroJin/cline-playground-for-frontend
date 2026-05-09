// キャンペーンステージ開始用の Use Case

import type { Stage } from '../../domain/race/stage';
import type { CpuDifficulty } from '../../domain/player/cpu-strategy';
import type { RaceConfig } from '../../domain/race/types';
import type { CampaignRuntime } from '../campaign-runtime';
import { createCampaignRuntime } from '../campaign-runtime';

export type StartCampaignStageInput = {
  readonly stage: Stage;
  readonly livesRemaining: number;
  /** ベース速度。既存の自由対戦と同様の値を渡す */
  readonly baseSpeed: number;
  /** 分岐ステージで選んだ側（spec §8）。未指定なら 'a' 既定（マイグレ規則） */
  readonly chosenBranch?: 'a' | 'b';
};

export type StartCampaignStageResult = {
  readonly runtime: CampaignRuntime;
  readonly raceConfig: RaceConfig;
};

const CAMPAIGN_CPU_DIFFICULTY: CpuDifficulty = 'normal';

/**
 * 分岐ステージで使うコース index を解決する純粋関数。
 *
 * 優先順位:
 * 1. `stage.courseIndex` が定義されていればそれを使う（通常ステージ）
 * 2. `stage.branch` があれば `chosenBranch` 側のコース（既定 'a'）
 * 3. どちらも無いケースは assertValidStage で弾かれる仕様だが、防御として 0
 *
 * F1 対応: 旧実装の `stage.courseIndex ?? 0` だと分岐ステージで Forest に
 * フォールバックしていたため、Stage 3/5/8 が Stage 1 と見た目が同じになっていた。
 */
export const resolveCourseIndex = (
  stage: Stage,
  chosenBranch: 'a' | 'b' = 'a',
): number => {
  if (stage.courseIndex !== undefined) return stage.courseIndex;
  if (stage.branch) return stage.branch[chosenBranch].courseIndex;
  return 0;
};

/**
 * ステージ開始用に CampaignRuntime と RaceConfig を生成。
 * cardsEnabled は false 固定（キャンペーンではドラフトカード無効）。
 */
export const startCampaignStage = (
  input: StartCampaignStageInput,
): StartCampaignStageResult => {
  const runtime = createCampaignRuntime(input.stage, input.livesRemaining);
  const raceConfig: RaceConfig = {
    mode: 'solo',
    courseIndex: resolveCourseIndex(input.stage, input.chosenBranch),
    maxLaps: input.stage.lapsToClear,
    baseSpeed: input.baseSpeed,
    cpuDifficulty: CAMPAIGN_CPU_DIFFICULTY,
    cardsEnabled: false,
    campaignStage: input.stage,
  };
  return { runtime, raceConfig };
};
