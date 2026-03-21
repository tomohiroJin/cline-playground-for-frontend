// ラップカウンター（純粋関数・副作用なし）

import type { Player } from '../player/types';
import type { StartLine } from '../track/types';
import { allCheckpointsPassed } from './checkpoint';

/** ラップ完了チェック結果 */
export interface LapCheckResult {
  readonly completed: boolean;
  readonly lapTime: number;
}

/** スタートラインの横切り判定 */
const crossedStart = (
  player: Player,
  sl: StartLine,
  currentSeg: number,
  prevSeg: number,
  totalSegs: number,
  trackWidth: number,
): boolean => {
  if (totalSegs < 2) return false;
  const lastSeg = totalSegs - 1;
  const crossedFromEnd = prevSeg >= lastSeg - 1 && currentSeg <= 1;
  if (!crossedFromEnd) return false;
  const dx = player.x - sl.cx;
  const dy = player.y - sl.cy;
  const distAlongLine = Math.abs(dx * sl.px + dy * sl.py);
  const distFromLine = Math.abs(dx * sl.dx + dy * sl.dy);
  return distFromLine < 50 && distAlongLine < trackWidth;
};

/** ラップ完了判定 */
export const checkLapComplete = (
  player: Player,
  startLine: StartLine,
  currentSeg: number,
  prevSeg: number,
  totalSegs: number,
  totalCheckpoints: number,
  trackWidth: number,
  now: number,
): LapCheckResult => {
  const crossed = crossedStart(player, startLine, currentSeg, prevSeg, totalSegs, trackWidth);
  if (!crossed) return { completed: false, lapTime: 0 };

  const passed = allCheckpointsPassed(player.checkpointFlags, totalCheckpoints);
  if (!passed) return { completed: false, lapTime: 0 };

  return {
    completed: true,
    lapTime: calculateLapTime(now, player.lapStart),
  };
};

/** ラップタイム計算 */
export const calculateLapTime = (now: number, lapStart: number): number =>
  Math.max(0, now - lapStart);
