// 壁衝突物理計算（純粋関数・副作用なし）

import type { Point } from '../shared/types';
import { normalizeAngle } from '../shared/math-utils';
import { WALL } from './constants';
import { getWallNormal } from './track';

/** 段階的壁ペナルティ計算 */
export const calculateWallPenalty = (
  stuck: number,
  shieldCount: number,
  wallDamageMultiplier: number,
): { factor: number; wallStage: number; newShieldCount: number } => {
  let factor: number;
  let wallStage: number;

  if (stuck === 1) {
    factor = WALL.LIGHT_FACTOR;
    wallStage = 1;
  } else if (stuck <= 3) {
    factor = WALL.MEDIUM_FACTOR;
    wallStage = 2;
  } else {
    factor = WALL.HEAVY_FACTOR;
    wallStage = 3;
  }

  let newShieldCount = shieldCount;
  if (shieldCount > 0) {
    factor = 1.0;
    newShieldCount = shieldCount - 1;
  }

  const speedLoss = (1 - factor) * wallDamageMultiplier;
  const adjustedFactor = 1 - speedLoss;

  return { factor: adjustedFactor, wallStage, newShieldCount };
};

/** ワープ判定 */
export const shouldWarp = (stuck: number): boolean => stuck >= WALL.WARP_THRESHOLD;

/** ワープ先座標計算 */
export const calculateWarpDestination = (
  seg: number,
  pts: readonly Point[],
): { x: number; y: number; angle: number } => {
  const wi = (seg + 3) % pts.length;
  const wp = pts[wi];
  const nwi = (wi + 1) % pts.length;
  const nwp = pts[nwi];
  return { x: wp.x, y: wp.y, angle: Math.atan2(nwp.y - wp.y, nwp.x - wp.x) };
};

/** スライドベクトル計算 */
export const calculateSlideVector = (
  angle: number,
  vel: number,
  seg: number,
  pts: readonly Point[],
): { slideX: number; slideY: number; slideMag: number } => {
  const wallNormal = getWallNormal(seg, pts);
  const vx = Math.cos(angle) * vel;
  const vy = Math.sin(angle) * vel;
  const dot = vx * wallNormal.nx + vy * wallNormal.ny;
  const slideX = vx - dot * wallNormal.nx;
  const slideY = vy - dot * wallNormal.ny;
  const slideMag = Math.hypot(slideX, slideY);
  return { slideX, slideY, slideMag };
};

/** 壁接触時のスライド角度計算 */
export const calculateSlideAngle = (
  slideX: number,
  slideY: number,
  slideMag: number,
  px: number,
  py: number,
  infoX: number,
  infoY: number,
  stuck: number,
  seg: number,
  pts: readonly Point[],
): number => {
  if (slideMag > 0.01) {
    return Math.atan2(slideY, slideX);
  }
  const toCenterAngle = Math.atan2(infoY - py, infoX - px);
  const off = Math.min(stuck, 5) + 3;
  const ti = (seg + off) % pts.length;
  const tp = pts[ti];
  const toSegAngle = Math.atan2(tp.y - py, tp.x - px);
  return toCenterAngle + normalizeAngle(toSegAngle - toCenterAngle) * 0.3;
};

/** 壁接触時の最終位置計算 */
export const calculateWallSlidePosition = (
  infoPtX: number,
  infoPtY: number,
  seg: number,
  pts: readonly Point[],
  vel: number,
  stuck: number,
): { x: number; y: number } => {
  if (stuck < 2) {
    return { x: infoPtX, y: infoPtY };
  }
  const nextIdx = (seg + 1) % pts.length;
  const centerX = (pts[seg].x + pts[nextIdx].x) / 2;
  const centerY = (pts[seg].y + pts[nextIdx].y) / 2;
  const toCenterDir = Math.atan2(centerY - infoPtY, centerX - infoPtX);
  const pushDist = Math.max(3, vel * 0.5);
  return {
    x: infoPtX + Math.cos(toCenterDir) * pushDist,
    y: infoPtY + Math.sin(toCenterDir) * pushDist,
  };
};
