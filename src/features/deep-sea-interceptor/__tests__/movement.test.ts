import { MovementStrategies } from '../movement';

describe('MovementStrategies', () => {
  describe('straight', () => {
    test('下方向に直進すること', () => {
      const entity = { x: 100, y: 50, speed: 2 };
      const result = MovementStrategies.straight(entity);
      expect(result.x).toBe(100);
      expect(result.y).toBe(52);
    });
  });

  describe('sine', () => {
    test('サイン波で移動すること', () => {
      const entity = { x: 100, y: 50, speed: 2 };
      const result = MovementStrategies.sine(entity);
      expect(result.y).toBe(52);
      expect(result.x).not.toBe(100);
    });
  });

  describe('drift', () => {
    test('左側のエンティティは右にドリフトすること', () => {
      const entity = { x: 100, y: 50, speed: 2 };
      const result = MovementStrategies.drift(entity);
      expect(result.x).toBe(100.5);
      expect(result.y).toBe(52);
    });

    test('右側のエンティティは左にドリフトすること', () => {
      const entity = { x: 300, y: 50, speed: 2 };
      const result = MovementStrategies.drift(entity);
      expect(result.x).toBe(299.5);
    });
  });

  describe('boss', () => {
    test('上部に移動し左右に揺れること', () => {
      const entity = { x: 200, y: 50, speed: 0.5, angle: 0 };
      const result = MovementStrategies.boss(entity);
      expect(result.y).toBe(50.5);
      expect(result.angle).toBeCloseTo(0.015);
    });

    test('Y座標90を超えないこと', () => {
      const entity = { x: 200, y: 89.8, speed: 0.5, angle: 0 };
      const result = MovementStrategies.boss(entity);
      expect(result.y).toBe(90);
    });
  });

  describe('bullet', () => {
    test('角度に基づいて移動すること', () => {
      const entity = { x: 100, y: 200, angle: -Math.PI / 2, speed: 10 };
      const result = MovementStrategies.bullet(entity);
      expect(result.x).toBeCloseTo(100);
      expect(result.y).toBeCloseTo(190);
    });
  });

  describe('enemyBullet', () => {
    test('速度ベクトルに基づいて移動すること', () => {
      const entity = { x: 100, y: 200, vx: 2, vy: 3 };
      const result = MovementStrategies.enemyBullet(entity);
      expect(result.x).toBe(102);
      expect(result.y).toBe(203);
    });
  });

  describe('item', () => {
    test('下方向に移動すること', () => {
      const entity = { x: 100, y: 200, speed: 1.5 };
      const result = MovementStrategies.item(entity);
      expect(result.y).toBe(201.5);
    });
  });

  describe('particle', () => {
    test('速度ベクトルで移動し寿命が減少すること', () => {
      const entity = { x: 100, y: 200, vx: 1, vy: -1, life: 10 };
      const result = MovementStrategies.particle(entity);
      expect(result.x).toBe(101);
      expect(result.y).toBe(199);
      expect(result.life).toBe(9);
    });
  });

  describe('bubble', () => {
    test('上方向に移動し透明度が減少すること', () => {
      const entity = { x: 100, y: 200, speed: 0.5, opacity: 0.3 };
      const result = MovementStrategies.bubble(entity);
      expect(result.y).toBe(199.5);
      expect(result.opacity).toBeCloseTo(0.297);
    });
  });
});
