// タイムランク判定 + 表示ユーティリティ（純粋関数）

import type { Stage } from './stage';

export type StageRank = 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE';

/**
 * ランクの表示用グリフ（spec §6.2.3）。
 * 形（埋まっている星の数）と色の両方で識別できるよう統一表記。
 *
 * - GOLD:   ★★★
 * - SILVER: ★★·
 * - BRONZE: ★··
 * - NONE:   ···
 */
export const rankGlyph = (rank: StageRank): string => {
  switch (rank) {
    case 'GOLD': return '★★★';
    case 'SILVER': return '★★·';
    case 'BRONZE': return '★··';
    case 'NONE': return '···';
  }
};

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
