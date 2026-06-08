// キャンペーン難易度（spec §3.2 / Phase 3.2）
//
// NORMAL: 仕様通りの暫定値
// HARD: 時間 0.8x、CPU 速度 1.1x、チェックポイントボーナス 0.85x

import type { Stage } from './stage';
import { assertValidStage } from './stage';

export type CampaignDifficulty = 'NORMAL' | 'HARD';

export interface DifficultyMultipliers {
  readonly initialTime: number;
  readonly checkpointBonus: number;
  readonly goldRankTime: number;
  readonly silverRankTime: number;
}

const NORMAL_MULTIPLIERS: DifficultyMultipliers = {
  initialTime: 1.0,
  checkpointBonus: 1.0,
  goldRankTime: 1.0,
  silverRankTime: 1.0,
};

const HARD_MULTIPLIERS: DifficultyMultipliers = {
  initialTime: 0.8,
  checkpointBonus: 0.85,
  goldRankTime: 0.85,
  silverRankTime: 0.85,
};

const TABLE: Record<CampaignDifficulty, DifficultyMultipliers> = {
  NORMAL: NORMAL_MULTIPLIERS,
  HARD: HARD_MULTIPLIERS,
};

export const getMultipliers = (d: CampaignDifficulty): DifficultyMultipliers => TABLE[d];

/**
 * 難易度を適用したステージを返す（純粋関数）。
 * NORMAL の場合は元ステージを返す（恒等関数）。
 */
export const applyDifficulty = (stage: Stage, difficulty: CampaignDifficulty): Stage => {
  if (difficulty === 'NORMAL') return stage;
  const m = getMultipliers(difficulty);
  const adjusted: Stage = {
    ...stage,
    initialTimeSec: stage.initialTimeSec * m.initialTime,
    checkpointBonusSec: stage.checkpointBonusSec * m.checkpointBonus,
    goldRankTimeSec: stage.goldRankTimeSec * m.goldRankTime,
    silverRankTimeSec: stage.silverRankTimeSec * m.silverRankTime,
  };
  assertValidStage(adjusted);
  return adjusted;
};
