// Bullet 値オブジェクトのテスト

import { BulletModel } from '../../domain/models/bullet';

describe('BulletModel', () => {
  describe('create', () => {
    test('デフォルト値で弾丸を生成すること', () => {
      // Arrange & Act
      const bullet = BulletModel.create({ x: 5, y: 10 });

      // Assert
      expect(bullet.position).toEqual({ x: 5, y: 10 });
      expect(bullet.direction).toEqual({ dx: 0, dy: -1 });
      expect(bullet.isPiercing).toBe(false);
      expect(bullet.id).toBeTruthy();
    });

    test('カスタム値で弾丸を生成すること', () => {
      // Arrange & Act
      const bullet = BulletModel.create({
        x: 3,
        y: 7,
        dx: 1,
        dy: -1,
        pierce: true,
      });

      // Assert
      expect(bullet.direction).toEqual({ dx: 1, dy: -1 });
      expect(bullet.isPiercing).toBe(true);
    });
  });

  describe('createSpread', () => {
    test('3方向の弾丸を生成すること', () => {
      // Act
      const bullets = BulletModel.createSpread(5, 10, false);

      // Assert
      expect(bullets.length).toBe(3);
      expect(bullets[0].direction.dx).toBe(0);
      expect(bullets[1].direction.dx).toBe(-1);
      expect(bullets[2].direction.dx).toBe(1);
    });
  });

  describe('createWithDownshot', () => {
    test('上方と下方の弾丸を生成すること', () => {
      // Act
      const bullets = BulletModel.createWithDownshot(5, 10, false);

      // Assert
      expect(bullets.length).toBe(2);
      expect(bullets[0].direction.dy).toBe(-1);
      expect(bullets[1].direction.dy).toBe(1);
    });
  });

  describe('createSpreadWithDownshot', () => {
    test('3方向+下方の弾丸を生成すること', () => {
      // Act
      const bullets = BulletModel.createSpreadWithDownshot(5, 10, false);

      // Assert
      expect(bullets.length).toBe(4);
    });
  });

  describe('move', () => {
    test('弾丸を移動させること', () => {
      // Arrange
      const bullet = BulletModel.create({ x: 5, y: 10, dx: 1, dy: -1 });

      // Act
      const moved = bullet.move();

      // Assert
      expect(moved.position).toEqual({ x: 6, y: 9 });
      // 元の弾丸は変更されない
      expect(bullet.position).toEqual({ x: 5, y: 10 });
    });
  });

  describe('isInBounds', () => {
    test('範囲内の弾丸はtrueを返すこと', () => {
      const bullet = BulletModel.create({ x: 5, y: 5 });
      expect(bullet.isInBounds(12, 18)).toBe(true);
    });

    test('範囲外の弾丸はfalseを返すこと', () => {
      const bullet = BulletModel.create({ x: -1, y: 5 });
      expect(bullet.isInBounds(12, 18)).toBe(false);
    });

    test('上端を超えた弾丸はfalseを返すこと', () => {
      const bullet = BulletModel.create({ x: 5, y: -1 });
      expect(bullet.isInBounds(12, 18)).toBe(false);
    });
  });

  describe('toBulletData', () => {
    test('旧 BulletData 形式に変換できること', () => {
      // Arrange
      const bullet = BulletModel.create({ x: 3, y: 7, dx: 1, dy: -1, pierce: true });

      // Act
      const data = bullet.toBulletData();

      // Assert
      expect(data.x).toBe(3);
      expect(data.y).toBe(7);
      expect(data.dx).toBe(1);
      expect(data.dy).toBe(-1);
      expect(data.pierce).toBe(true);
    });
  });
});
