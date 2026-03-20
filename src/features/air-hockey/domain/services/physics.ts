/**
 * 物理演算ドメインサービス
 * - core/physics.ts のロジックを移行（API 変更なし）
 * - 純粋関数のみ
 */
import type { Entity } from '../types';
import { PHYSICS_CONSTANTS } from '../constants/physics';
import { distance, magnitude } from '../../../../utils/math-utils';

/** 反射時の反発係数（0-1、1で完全弾性衝突） */
const RESTITUTION = PHYSICS_CONSTANTS.RESTITUTION;

/** 壁衝突時の速度減衰率 */
const WALL_DAMPING = PHYSICS_CONSTANTS.WALL_DAMPING;

/** 壁との衝突判定マージン（px） */
const WALL_MARGIN = PHYSICS_CONSTANTS.WALL_MARGIN;

export const DomainPhysics = {
  detectCollision(ax: number, ay: number, ar: number, bx: number, by: number, br: number) {
    const dx = ax - bx;
    const dy = ay - by;
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
      vx: (obj.vx - 2 * dot * nx) * RESTITUTION,
      vy: (obj.vy - 2 * dot * ny) * RESTITUTION,
    };
  },

  applyWallBounce<T extends Entity>(
    obj: T,
    radius: number,
    goalChecker: (x: number) => boolean,
    onBounce: () => void,
    canvasWidth = PHYSICS_CONSTANTS.CANVAS_WIDTH,
    canvasHeight = PHYSICS_CONSTANTS.CANVAS_HEIGHT
  ): T {
    let { x, y, vx, vy } = obj;
    let bounced = false;

    if (x < radius + WALL_MARGIN) {
      x = radius + WALL_MARGIN;
      vx = Math.abs(vx) * WALL_DAMPING;
      bounced = true;
    }
    if (x > canvasWidth - radius - WALL_MARGIN) {
      x = canvasWidth - radius - WALL_MARGIN;
      vx = -Math.abs(vx) * WALL_DAMPING;
      bounced = true;
    }
    if (y < radius + WALL_MARGIN && !goalChecker(x)) {
      y = radius + WALL_MARGIN;
      vy = Math.abs(vy) * WALL_DAMPING;
      bounced = true;
    }
    if (y > canvasHeight - radius - WALL_MARGIN && !goalChecker(x)) {
      y = canvasHeight - radius - WALL_MARGIN;
      vy = -Math.abs(vy) * WALL_DAMPING;
      bounced = true;
    }

    if (bounced && onBounce) onBounce();
    return { ...obj, x, y, vx, vy };
  },

  applyFriction<T extends Entity>(
    obj: T,
    friction = PHYSICS_CONSTANTS.FRICTION,
    minSpeed = PHYSICS_CONSTANTS.MIN_SPEED
  ): T {
    let { vx, vy } = obj;
    vx *= friction;
    vy *= friction;

    const speed = magnitude(vx, vy);
    if (speed > 0 && speed < minSpeed) {
      vx = (vx / speed) * minSpeed;
      vy = (vy / speed) * minSpeed;
    }
    return { ...obj, vx, vy };
  },
};
