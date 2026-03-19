import { Puck, PuckState } from './puck';

describe('Puck エンティティ', () => {
  describe('create', () => {
    it('指定した座標と半径でパックを生成する', () => {
      const puck = Puck.create(225, 450, 21);
      expect(puck.x).toBe(225);
      expect(puck.y).toBe(450);
      expect(puck.radius).toBe(21);
      expect(puck.vx).toBe(0);
      expect(puck.vy).toBe(0);
      expect(puck.visible).toBe(true);
      expect(puck.hitCount).toBe(0);
    });
  });

  describe('applyVelocity', () => {
    it('速度に基づいて位置を更新する', () => {
      const puck = { ...Puck.create(100, 100, 21), vx: 5, vy: 3 };
      const result = Puck.applyVelocity(puck, 1);
      expect(result.x).toBe(105);
      expect(result.y).toBe(103);
    });

    it('dt を考慮して位置を更新する', () => {
      const puck = { ...Puck.create(100, 100, 21), vx: 10, vy: 0 };
      const result = Puck.applyVelocity(puck, 0.5);
      expect(result.x).toBe(105);
    });

    it('元のパックを変更しない', () => {
      const puck = { ...Puck.create(100, 100, 21), vx: 5, vy: 3 };
      Puck.applyVelocity(puck, 1);
      expect(puck.x).toBe(100);
    });
  });

  describe('applyFriction', () => {
    it('摩擦で速度が減衰する', () => {
      const puck = { ...Puck.create(100, 100, 21), vx: 10, vy: 0 };
      const result = Puck.applyFriction(puck, 0.998);
      expect(result.vx).toBeLessThan(10);
    });
  });

  describe('reflect', () => {
    it('法線方向に速度が反射する', () => {
      const puck: PuckState = { ...Puck.create(100, 100, 21), vx: 5, vy: 0 };
      const normal = { x: -1, y: 0 };
      const result = Puck.reflect(puck, normal);
      expect(result.vx).toBeLessThan(0);
    });
  });

  describe('クエリメソッド', () => {
    it('speed でパックの速度を取得する', () => {
      const puck = { ...Puck.create(100, 100, 21), vx: 3, vy: 4 };
      expect(Puck.speed(puck)).toBe(5);
    });

    it('isMoving で移動中かどうかを判定する', () => {
      const moving = { ...Puck.create(100, 100, 21), vx: 3, vy: 4 };
      const still = Puck.create(100, 100, 21);
      expect(Puck.isMoving(moving)).toBe(true);
      expect(Puck.isMoving(still)).toBe(false);
    });

    it('isInGoal でゴール内かどうかを判定する', () => {
      // プレイヤー側ゴール（y > canvasHeight - radius）
      const inPlayerGoal = { ...Puck.create(225, 895, 21), vx: 0, vy: 5 };
      expect(Puck.isInGoal(inPlayerGoal, 900, 120)).toBe('cpu');

      // CPU 側ゴール（y < radius）
      const inCpuGoal = { ...Puck.create(225, 5, 21), vx: 0, vy: -5 };
      expect(Puck.isInGoal(inCpuGoal, 900, 120)).toBe('player');

      // ゴール外
      const notInGoal = Puck.create(225, 450, 21);
      expect(Puck.isInGoal(notInGoal, 900, 120)).toBeNull();
    });
  });
});
