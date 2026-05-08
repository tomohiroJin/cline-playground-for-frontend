// タイムランク判定（純粋関数）

import type { Stage } from './stage';

export type StageRank = 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE';

/**
 * ゴールタイムからランクを判定。
 * - goalTimeSec ≤ goldRankTimeSec → GOLD
 * - goldRankTimeSec < goalTimeSec ≤ silverRankTimeSec → SILVER
 * - silverRankTimeSec < goalTimeSec → BRONZE
 *
 * NONE は「未クリア」を表すため judgeRank では返さない。
 */
export const judgeRank = (
  goalTimeSec: number,
  stage: Pick<Stage, 'goldRankTimeSec' | 'silverRankTimeSec'>,
): Exclude<StageRank, 'NONE'> => {
  if (goalTimeSec <= stage.goldRankTimeSec) return 'GOLD';
  if (goalTimeSec <= stage.silverRankTimeSec) return 'SILVER';
  return 'BRONZE';
};
