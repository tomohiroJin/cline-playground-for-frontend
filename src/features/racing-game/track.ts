// Racing Game トラック計算

import type { Point, Player, StartLine } from './types';
import { Config } from './constants';
import { Utils } from './utils';

export const Track = {
  getInfo: (px: number, py: number, points: Point[]) => {
    const { trackWidth } = Config.game;
    let best = { dist: Infinity, seg: 0, pt: { x: px, y: py }, dir: 0 };

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const dx = p2.x - p1.x,
        dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      const t = Utils.clamp(((px - p1.x) * dx + (py - p1.y) * dy) / lenSq, 0, 1);
      const proj = { x: p1.x + t * dx, y: p1.y + t * dy };
      const dist = Math.hypot(px - proj.x, py - proj.y);

      if (dist < best.dist) {
        best = { dist, seg: i, pt: proj, dir: Math.atan2(dy, dx) };
      }
    }

    return { ...best, onTrack: best.dist < trackWidth };
  },

  startLine: (pts: Point[]): StartLine => {
    if (pts.length < 2) return { cx: 0, cy: 0, px: 0, py: 1, dx: 1, dy: 0, len: 100 };
    const p0 = pts[0],
      pL = pts[pts.length - 1];
    const dx = p0.x - pL.x,
      dy = p0.y - pL.y;
    const len = Math.hypot(dx, dy) || 1;
    return {
      cx: p0.x,
      cy: p0.y,
      px: -dy / len,
      py: dx / len,
      dx: dx / len,
      dy: dy / len,
      len: Config.game.trackWidth * 2,
    };
  },

  crossedStart: (
    player: Player,
    sl: StartLine,
    currentSeg: number,
    prevSeg: number,
    totalSegs: number
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
