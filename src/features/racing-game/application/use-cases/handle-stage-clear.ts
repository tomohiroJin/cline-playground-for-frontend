// ステージクリア処理 Use Case

import type { Stage } from '../../domain/race/stage';
import type { CampaignProgress } from '../../domain/race/campaign-progress';
import type { StageRank } from '../../domain/race/rank';
import {
  unlockNextStage,
  updateBestRecord,
} from '../../domain/race/campaign-progress';

export type HandleStageClearInput = {
  readonly progress: CampaignProgress;
  readonly stage: Stage;
  readonly goalTimeSec: number;
  readonly rank: Exclude<StageRank, 'NONE'>;
  /** 分岐ステージで選んだ側（あれば） */
  readonly chosenBranch?: 'a' | 'b';
};

/**
 * ステージクリア時の進捗更新:
 * - ベストタイム更新（より速ければ）
 * - 次ステージのアンロック
 *
 * 永続化（save）は呼び出し側で行う。本 Use Case は純粋関数で進捗を返すのみ。
 */
export const handleStageClear = (input: HandleStageClearInput): CampaignProgress => {
  const recordUpdated = updateBestRecord(input.progress, input.stage.id, {
    bestTimeSec: input.goalTimeSec,
    rank: input.rank,
    ...(input.chosenBranch ? { chosenBranch: input.chosenBranch } : {}),
  });
  return unlockNextStage(recordUpdated, input.stage.id);
};
