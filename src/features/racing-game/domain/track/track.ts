// トラック幾何学計算（純粋関数・副作用なし）

import type { Point } from '../shared/types';
import type { TrackInfo, StartLine } from './types';
import { clamp } from '../shared/math-utils';
import { assert, assertPositive } from '../shared/assertions';

/** トラック情報の取得（Config 依存を引数で注入） */
export const getTrackInfo = (
  px: number,
  py: number,
  points: readonly Point[],
  trackWidth: number,
): TrackInfo => {
  // 事前条件
  assert(points.length >= 2, `points.length = ${points.length} must be >= 2`);
  assertPositive(trackWidth, 'trackWidth');

  let best: TrackInfo = { dist: Infinity, seg: 0, pt: { x: px, y: py }, dir: 0, onTrack: false };

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;

    const t = clamp(((px - p1.x) * dx + (py - p1.y) * dy) / lenSq, 0, 1);
    const proj = { x: p1.x + t * dx, y: p1.y + t * dy };
    const dist = Math.hypot(px - proj.x, py - proj.y);

    if (dist < best.dist) {
      best = { dist, seg: i, pt: proj, dir: Math.atan2(dy, dx), onTrack: dist < trackWidth };
    }
  }

  return best;
};

/** スタートラインの計算 */
export const calculateStartLine = (pts: readonly Point[], trackWidth: number): StartLine => {
  if (pts.length < 2) return { cx: 0, cy: 0, px: 0, py: 1, dx: 1, dy: 0, len: 100 };
  const p0 = pts[0];
  const pL = pts[pts.length - 1];
  const dx = p0.x - pL.x;
  const dy = p0.y - pL.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    cx: p0.x,
    cy: p0.y,
    px: -dy / len,
    py: dx / len,
    dx: dx / len,
    dy: dy / len,
    len: trackWidth * 2,
  };
};

/** 壁法線ベクトルの計算 */
export const getWallNormal = (seg: number, points: readonly Point[]): { nx: number; ny: number } => {
  const p1 = points[seg];
  const p2 = points[(seg + 1) % points.length];
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  return { nx: -dy / len, ny: dx / len };
};
