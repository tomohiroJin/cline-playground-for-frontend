import { Physics } from './physics';
import { CONSTANTS } from './constants';

describe('Physics Module', () => {
  describe('detectCollision', () => {
    it('should detect collision when entities overlap', () => {
      const col = Physics.detectCollision(0, 0, 10, 15, 0, 10);
      expect(col).not.toBeNull();
      expect(col?.penetration).toBeCloseTo(5);
      expect(col?.nx).toBeCloseTo(-1);
    });

    it('should not detect collision when entities are separate', () => {
      const col = Physics.detectCollision(0, 0, 10, 30, 0, 10);
      expect(col).toBeNull();
    });
  });

  describe('resolveCollision', () => {
    it('should push object out of collision and change velocity', () => {
      const obj = { x: 0, y: 0, vx: 10, vy: 0 };
      const col = { nx: -1, ny: 0, penetration: 5 };
      const res = Physics.resolveCollision(obj, col, 10, 0, 0, 0);

      expect(res.x).toBeCloseTo(-6);
      expect(res.vx).toBeCloseTo(-10);
    });
  });

  describe('applyWallBounce', () => {
    const goalChecker = () => false;
    const noOp = () => {};

    it('should bounce off left wall', () => {
      const obj = { x: -10, y: 100, vx: -5, vy: 0 };
      const res = Physics.applyWallBounce(obj, 10, goalChecker, noOp);

      expect(res.x).toBe(15);
      expect(res.vx).toBeGreaterThan(0);
    });

    it('右壁バウンスが正しく動作する', () => {
      const W = CONSTANTS.CANVAS.WIDTH;
      const obj = { x: W + 10, y: 100, vx: 5, vy: 0 };
      const res = Physics.applyWallBounce(obj, 10, goalChecker, noOp);

      // W - 10 - 5 = W - 15
      expect(res.x).toBe(W - 15);
      expect(res.vx).toBeLessThan(0);
    });
  });

  describe('reflectOffSurface - 面での反射', () => {
    it('法線方向に押し出されて速度が反転する', () => {
      const obj = { x: 10, y: 10, vx: 5, vy: 0 };
      const collision = { nx: -1, ny: 0, penetration: 3 };
      const result = Physics.reflectOffSurface(obj, collision);

      expect(result.x).toBeCloseTo(6);
      expect(result.vx).toBeCloseTo(-4.5);
    });

    it('元のオブジェクトを変更しない', () => {
      const obj = { x: 10, y: 10, vx: 5, vy: 0 };
      const collision = { nx: -1, ny: 0, penetration: 3 };
      Physics.reflectOffSurface(obj, collision);
      expect(obj.x).toBe(10);
      expect(obj.vx).toBe(5);
    });

    it('斜めの法線でも正しく反射する', () => {
      const nx = Math.sqrt(2) / 2;
      const ny = Math.sqrt(2) / 2;
      const obj = { x: 0, y: 0, vx: 5, vy: 5 };
      const collision = { nx, ny, penetration: 2 };
      const result = Physics.reflectOffSurface(obj, collision);
      expect(result.x).toBeGreaterThan(obj.x);
      expect(result.y).toBeGreaterThan(obj.y);
    });
  });

  describe('applyFriction - 摩擦の適用', () => {
    it('速度に摩擦係数が適用される', () => {
      const obj = { x: 100, y: 100, vx: 10, vy: 10 };
      const result = Physics.applyFriction(obj);
      expect(result.vx).toBeCloseTo(10 * CONSTANTS.PHYSICS.FRICTION);
      expect(result.vy).toBeCloseTo(10 * CONSTANTS.PHYSICS.FRICTION);
    });

    it('位置は変更されない', () => {
      const obj = { x: 100, y: 200, vx: 10, vy: 10 };
      const result = Physics.applyFriction(obj);
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('最低速度以下にならない', () => {
      const obj = { x: 0, y: 0, vx: 0.5, vy: 0.5 };
      const result = Physics.applyFriction(obj);
      const speed = Math.sqrt(result.vx ** 2 + result.vy ** 2);
      expect(speed).toBeGreaterThanOrEqual(CONSTANTS.PHYSICS.MIN_SPEED);
    });

    it('元のオブジェクトを変更しない', () => {
      const obj = { x: 0, y: 0, vx: 10, vy: 10 };
      Physics.applyFriction(obj);
      expect(obj.vx).toBe(10);
    });
  });
});
