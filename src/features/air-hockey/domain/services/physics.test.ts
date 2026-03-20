import { DomainPhysics } from './physics';

describe('Physics ドメインサービス', () => {
  describe('detectCollision', () => {
    it('重なる2つの円の衝突を検出する', () => {
      const result = DomainPhysics.detectCollision(0, 0, 10, 15, 0, 10);
      expect(result).not.toBeNull();
      expect(result!.penetration).toBeGreaterThan(0);
    });

    it('離れた2つの円は衝突しない', () => {
      const result = DomainPhysics.detectCollision(0, 0, 10, 100, 0, 10);
      expect(result).toBeNull();
    });
  });

  describe('resolveCollision', () => {
    it('衝突解決後にオブジェクトが押し出される', () => {
      const obj = { x: 0, y: 0, vx: 0, vy: 0 };
      const collision = { nx: 1, ny: 0, penetration: 5 };
      const result = DomainPhysics.resolveCollision(obj, collision, 10);
      expect(result.x).toBeGreaterThan(obj.x);
      expect(result.vx).toBeGreaterThan(0);
    });
  });

  describe('reflectOffSurface', () => {
    it('衝突面で速度が反射する', () => {
      const obj = { x: 10, y: 10, vx: 5, vy: 0 };
      const collision = { nx: -1, ny: 0, penetration: 2 };
      const result = DomainPhysics.reflectOffSurface(obj, collision);
      expect(result.vx).toBeLessThan(0);
    });
  });

  describe('applyFriction', () => {
    it('摩擦で速度が減衰する', () => {
      const obj = { x: 0, y: 0, vx: 10, vy: 0 };
      const result = DomainPhysics.applyFriction(obj);
      expect(Math.abs(result.vx)).toBeLessThan(Math.abs(obj.vx));
    });
  });

  describe('applyWallBounce', () => {
    it('左壁を超えると跳ね返る', () => {
      const obj = { x: 0, y: 100, vx: -5, vy: 0 };
      const goalChecker = () => false;
      const onBounce = jest.fn();
      const result = DomainPhysics.applyWallBounce(obj, 21, goalChecker, onBounce);
      expect(result.vx).toBeGreaterThan(0);
      expect(onBounce).toHaveBeenCalled();
    });
  });
});
