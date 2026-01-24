import { CONSTANTS } from './constants';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;

// Pure utils
const distance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
const magnitude = (vx: number, vy: number) => Math.sqrt(vx ** 2 + vy ** 2);

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
  resolveCollision(
    obj: any,
    collision: any,
    power: number,
    sourceVx = 0,
    sourceVy = 0,
    factor = 0.3
  ) {
    const { nx, ny, penetration } = collision;
    return {
      ...obj,
      x: obj.x + nx * (penetration + 1),
      y: obj.y + ny * (penetration + 1),
      vx: nx * power + sourceVx * factor,
      vy: ny * power + sourceVy * factor,
    };
  },
  reflectOffSurface(obj: any, collision: any) {
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
  applyWallBounce(
    obj: any,
    radius: number,
    goalChecker: (x: number) => boolean,
    onBounce: () => void
  ) {
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
  applyFriction(obj: any) {
    let { vx, vy } = obj;
    vx *= CONSTANTS.PHYSICS.FRICTION;
    vy *= CONSTANTS.PHYSICS.FRICTION;

    const speed = magnitude(vx, vy);
    if (speed > 0 && speed < CONSTANTS.PHYSICS.MIN_SPEED) {
      vx = (vx / speed) * CONSTANTS.PHYSICS.MIN_SPEED;
      vy = (vy / speed) * CONSTANTS.PHYSICS.MIN_SPEED;
    }
    return { ...obj, vx, vy };
  },
};
