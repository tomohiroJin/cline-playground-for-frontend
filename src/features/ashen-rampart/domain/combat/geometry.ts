/**
 * 灰燼の城壁 - 盤面の幾何（純粋）
 *
 * 貫通（step-tick.ts）と敵の射程（enemy-reach.ts）が同じ「線分への距離」を使う。
 */
import type { CellPos } from '../board/stage-map';

/** 点 p と線分 ab の距離 */
export const distanceToSegment = (
  p: { x: number; y: number },
  a: CellPos,
  b: { x: number; y: number }
): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};
