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
};

export type StartCampaignStageResult = {
  readonly runtime: CampaignRuntime;
  readonly raceConfig: RaceConfig;
};

const CAMPAIGN_CPU_DIFFICULTY: CpuDifficulty = 'normal';

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
    courseIndex: input.stage.courseIndex ?? 0,
    maxLaps: input.stage.lapsToClear,
    baseSpeed: input.baseSpeed,
    cpuDifficulty: CAMPAIGN_CPU_DIFFICULTY,
    cardsEnabled: false,
    campaignStage: input.stage,
  };
  return { runtime, raceConfig };
};
