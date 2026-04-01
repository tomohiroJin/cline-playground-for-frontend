import { CONSTANTS, GameConstants } from './constants';
import { Entity } from './types';
import { distance, magnitude } from '../../../utils/math-utils';

/**
 * 打ち返し角度バイアスを衝突法線に適用する
 * bias > 0: 法線を壁方向（水平）に傾ける（バウンスショット）
 * bias < 0: 法線をゴール方向（垂直）に傾ける（ストレートショット）
 * 最大バイアス角度: ±30°
 */
export const applyDeflectionBias = (
  normalX: number,
  normalY: number,
  deflectionBias: number
): { nx: number; ny: number } => {
  if (deflectionBias === 0) return { nx: normalX, ny: normalY };
  const angle = Math.atan2(normalY, normalX);
  const biasAngle = deflectionBias * (Math.PI / 6);
  const newAngle = angle + biasAngle;
  return { nx: Math.cos(newAngle), ny: Math.sin(newAngle) };
};

/**
 * 衝突判定の早期リターン（S-1: 距離の二乗比較で sqrt を完全回避）
 * 距離が maxDist を超えている場合に true を返す
 */
export const quickReject = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  maxDist: number
): boolean => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy > maxDist * maxDist;
};

export const Physics = {
  detectCollision(ax: number, ay: number, ar: number, bx: number, by: number, br: number) {
    const dx = ax - bx,
      dy = ay - by;
    const dist = distance(ax, ay, bx, by);
    if (dist < ar + br && dist > 0) {
      return { nx: dx / dist, ny: dy / dist, penetration: ar + br - dist };
    }
    return null;
  },
  resolveCollision<T extends Entity>(
    obj: T,
    collision: { nx: number; ny: number; penetration: number },
    power: number,
    sourceVx = 0,
    sourceVy = 0,
    factor = 0.3
  ): T {
    const { nx, ny, penetration } = collision;
    return {
      ...obj,
      x: obj.x + nx * (penetration + 1),
      y: obj.y + ny * (penetration + 1),
      vx: nx * power + sourceVx * factor,
      vy: ny * power + sourceVy * factor,
    };
  },
  reflectOffSurface<T extends Entity>(
    obj: T,
    collision: { nx: number; ny: number; penetration: number }
  ): T {
    const { nx, ny, penetration } = collision;
    const dot = obj.vx * nx + obj.vy * ny;
    return {
      ...obj,
      x: obj.x + nx * (penetration + 1),
      y: obj.y + ny * (penetration + 1),
      vx: (obj.vx - 2 * dot * nx) * 0.9,
      vy: (obj.vy - 2 * dot * ny) * 0.9,
    };
  },
  applyWallBounce<T extends Entity>(
    obj: T,
    radius: number,
    goalChecker: (x: number) => boolean,
    onBounce: () => void,
    consts: GameConstants = CONSTANTS
  ): T {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    let { x, y, vx, vy } = obj;
    let bounced = false;

    if (x < radius + 5) {
      x = radius + 5;
      vx = Math.abs(vx) * 0.95;
      bounced = true;
    }
    if (x > W - radius - 5) {
      x = W - radius - 5;
      vx = -Math.abs(vx) * 0.95;
      bounced = true;
    }
    if (y < radius + 5 && !goalChecker(x)) {
      y = radius + 5;
      vy = Math.abs(vy) * 0.95;
      bounced = true;
    }
    if (y > H - radius - 5 && !goalChecker(x)) {
      y = H - radius - 5;
      vy = -Math.abs(vy) * 0.95;
      bounced = true;
    }

    if (bounced && onBounce) onBounce();
    return { ...obj, x, y, vx, vy };
  },
  applyFriction<T extends Entity>(obj: T, consts: GameConstants = CONSTANTS): T {
    let { vx, vy } = obj;
    vx *= consts.PHYSICS.FRICTION;
    vy *= consts.PHYSICS.FRICTION;

    const speed = magnitude(vx, vy);
    if (speed > 0 && speed < consts.PHYSICS.MIN_SPEED) {
      vx = (vx / speed) * consts.PHYSICS.MIN_SPEED;
      vy = (vy / speed) * consts.PHYSICS.MIN_SPEED;
    }
    return { ...obj, vx, vy };
  },
};
