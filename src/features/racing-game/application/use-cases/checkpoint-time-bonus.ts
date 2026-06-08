// チェックポイント通過時に時間延長を適用する Use Case

import type { CampaignRuntime } from '../campaign-runtime';
import { applyCheckpointBonus } from '../../domain/race/checkpoint-bonus';

export type CheckpointTimeBonusResult = {
  readonly runtime: CampaignRuntime;
  /** 加算された秒数（UI トースト表示用） */
  readonly bonusSec: number;
};

/**
 * 残り時間に stage.checkpointBonusSec を加算した新しい runtime を返す。
 * checkpointsHit カウンタもインクリメントする。
 */
export const checkpointTimeBonus = (runtime: CampaignRuntime): CheckpointTimeBonusResult => {
  const bonusSec = runtime.stage.checkpointBonusSec;
  return {
    runtime: {
      ...runtime,
      timeRemainingSec: applyCheckpointBonus(runtime.timeRemainingSec, bonusSec),
      checkpointsHit: runtime.checkpointsHit + 1,
    },
    bonusSec,
  };
};
