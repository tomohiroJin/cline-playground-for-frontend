// ステージの残り時間を進める Use Case

import type { CampaignRuntime } from '../campaign-runtime';
import { tickTime } from '../../domain/race/time-limit';

/**
 * 経過時間 dt を残り時間から減算し、elapsedSec を加算した新しい runtime を返す。
 * 純粋関数。
 */
export const advanceStageTime = (
  runtime: CampaignRuntime,
  dt: number,
): CampaignRuntime => ({
  ...runtime,
  timeRemainingSec: tickTime(runtime.timeRemainingSec, dt),
  elapsedSec: runtime.elapsedSec + dt,
});
