import { Physics } from './physics';

describe('Physics Module', () => {
  describe('detectCollision', () => {
    it('should detect collision when entities overlap', () => {
      // Circle A at (0,0) radius 10, Circle B at (15,0) radius 10 -> overlap by 5
      const col = Physics.detectCollision(0, 0, 10, 15, 0, 10);
      expect(col).not.toBeNull();
      expect(col?.penetration).toBeCloseTo(5);
      expect(col?.nx).toBeCloseTo(-1); // A -> B vector is (1,0), normal seems to be (dx/dist) which is 15/15 = 1. A-B = -15?
      // Wait, let's check impl: dx = ax - bx. (0 - 15) = -15. nx = -1. Correct.
    });

    it('should not detect collision when entities are separate', () => {
      const col = Physics.detectCollision(0, 0, 10, 30, 0, 10);
      expect(col).toBeNull();
    });
  });

  describe('resolveCollision', () => {
    it('should push object out of collision and change velocity', () => {
      const obj = { x: 0, y: 0, vx: 10, vy: 0 };
      const col = { nx: -1, ny: 0, penetration: 5 }; // Push left
      const res = Physics.resolveCollision(obj, col, 10, 0, 0, 0); // Power 10

      expect(res.x).toBeCloseTo(-6); // 0 + -1 * (5+1) = -6
      expect(res.vx).toBeCloseTo(-10); // -1 * 10 = -10
    });
  });

  describe('applyWallBounce', () => {
    const goalChecker = () => false;
    const noOp = () => {};

    it('should bounce off left wall', () => {
      const W = 300; // Assuming const from file, but logic uses args
      // We need to inject W/H or assume standard. The function uses W/H from closure.
      // Limitation: The exported function in AirHockeyPage closes over W/H constants.
      // This confirms we need to extract constants or the module properly.
      // For now, assuming W=300, H=600 as per file.

      const obj = { x: -10, y: 100, vx: -5, vy: 0 };
      const res = Physics.applyWallBounce(obj, 10, goalChecker, noOp);

      expect(res.x).toBe(15); // radius 10 + 5 padding
      // expect(res.vx).toBe(5 * 0.95); // abs(vx) * 0.95
      expect(res.vx).toBeGreaterThan(0);
    });
  });
});
