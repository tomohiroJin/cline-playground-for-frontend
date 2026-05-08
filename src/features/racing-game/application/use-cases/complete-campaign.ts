// キャンペーン完了処理 Use Case

import type { CampaignProgress } from '../../domain/race/campaign-progress';
import { isCampaignCompleted } from '../../domain/race/campaign-progress';

export type CompleteCampaignResult = {
  /** ENDING フェーズに遷移すべきか */
  readonly shouldShowEnding: boolean;
};

/**
 * 進捗を見てエンディング遷移すべきかを返す。
 * isCampaignCompleted の値をそのまま使う薄いラッパだが、
 * 「呼び出し意図」を明示するために Use Case 化する。
 */
export const completeCampaign = (
  progress: CampaignProgress,
): CompleteCampaignResult => ({
  shouldShowEnding: isCampaignCompleted(progress),
});
