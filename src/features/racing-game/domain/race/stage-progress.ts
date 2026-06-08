// ステージ進行ロジック（純粋関数）

import type { Stage } from './stage';
import type { StageRank } from './rank';
import { judgeRank } from './rank';
import { isTimeUp } from './time-limit';

/**
 * ステージ評価のための最小ランタイム情報。
 * 完全な CampaignRuntime を渡さず、必要なフィールドだけにすることで純粋性を保つ。
 */
export type StageEvaluationInput = {
  readonly stage: Stage;
  readonly timeRemainingSec: number;
  readonly elapsedSec: number;
};

export type StageOutcome =
  | { readonly kind: 'cleared'; readonly goalTimeSec: number; readonly rank: Exclude<StageRank, 'NONE'> }
  | { readonly kind: 'time_up' }
  | { readonly kind: 'in_progress' };

/**
 * ステージの状態を評価する。
 * - ゴール到達（hasCrossedFinishLine = true）が最優先
 * - 次に時間切れ
 * - どちらでもなければ in_progress
 */
export const evaluateStage = (
  input: StageEvaluationInput,
  hasCrossedFinishLine: boolean,
): StageOutcome => {
  if (hasCrossedFinishLine) {
    const rank = judgeRank(input.elapsedSec, input.stage);
    return { kind: 'cleared', goalTimeSec: input.elapsedSec, rank };
  }
  if (isTimeUp(input.timeRemainingSec)) {
    return { kind: 'time_up' };
  }
  return { kind: 'in_progress' };
};
