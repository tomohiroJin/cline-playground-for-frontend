// Racing Game トラック計算
// 移行期間中: domain/track/track.ts へ委譲

import type { Point, Player, StartLine } from './types';
import { Config } from './constants';
import {
  getTrackInfo,
  calculateStartLine,
  getWallNormal,
} from './domain/track/track';

export const Track = {
  getInfo: (px: number, py: number, points: Point[]) => {
    return getTrackInfo(px, py, points, Config.game.trackWidth);
  },

  getNormal: (seg: number, points: Point[]): { nx: number; ny: number } => {
    return getWallNormal(seg, points);
  },

  startLine: (pts: Point[]): StartLine => {
    return calculateStartLine(pts, Config.game.trackWidth);
  },

  crossedStart: (
    player: Player,
    sl: StartLine,
    currentSeg: number,
    prevSeg: number,
    totalSegs: number,
  ) => {
    if (totalSegs < 2) return false;
    const lastSeg = totalSegs - 1;
    const crossedFromEnd = prevSeg >= lastSeg - 1 && currentSeg <= 1;
    if (!crossedFromEnd) return false;
    const dx = player.x - sl.cx;
    const dy = player.y - sl.cy;
    const distAlongLine = Math.abs(dx * sl.px + dy * sl.py);
    const distFromLine = Math.abs(dx * sl.dx + dy * sl.dy);
    return distFromLine < 50 && distAlongLine < Config.game.trackWidth;
  },
};
