import { Bullet } from '../bullet';

describe('Bullet', () => {
  describe('create', () => {
    test('デフォルト値で弾丸を生成すること', () => {
      const bullet = Bullet.create(5, 10);
      expect(bullet.x).toBe(5);
      expect(bullet.y).toBe(10);
      expect(bullet.dx).toBe(0);
      expect(bullet.dy).toBe(-1);
      expect(bullet.pierce).toBe(false);
      expect(bullet.id).toBeTruthy();
    });

    test('カスタム値で弾丸を生成すること', () => {
      const bullet = Bullet.create(3, 7, 1, -1, true);
      expect(bullet.dx).toBe(1);
      expect(bullet.dy).toBe(-1);
      expect(bullet.pierce).toBe(true);
    });
  });

  describe('createSpread', () => {
    test('3方向の弾丸を生成すること', () => {
      const bullets = Bullet.createSpread(5, 10, false);
      expect(bullets.length).toBe(3);
      expect(bullets[0].dx).toBe(0);
      expect(bullets[1].dx).toBe(-1);
      expect(bullets[2].dx).toBe(1);
    });
  });

  describe('createWithDownshot', () => {
    test('上方と下方の弾丸を生成すること', () => {
      const bullets = Bullet.createWithDownshot(5, 10, false);
      expect(bullets.length).toBe(2);
      expect(bullets[0].dy).toBe(-1);
      expect(bullets[1].dy).toBe(1);
    });
  });

  describe('createSpreadWithDownshot', () => {
    test('3方向+下方の弾丸を生成すること', () => {
      const bullets = Bullet.createSpreadWithDownshot(5, 10, false);
      expect(bullets.length).toBe(4);
    });
  });

  describe('move', () => {
    test('弾丸を移動させること', () => {
      const bullet = Bullet.create(5, 10, 1, -1);
      const moved = Bullet.move(bullet);
      expect(moved.x).toBe(6);
      expect(moved.y).toBe(9);
    });
  });

  describe('isValid', () => {
    test('範囲内の弾丸はtrueを返すこと', () => {
      const bullet = Bullet.create(5, 5);
      expect(Bullet.isValid(bullet, 12, 18)).toBe(true);
    });

    test('範囲外の弾丸はfalseを返すこと', () => {
      const bullet = Bullet.create(-1, 5);
      expect(Bullet.isValid(bullet, 12, 18)).toBe(false);
    });

    test('上端を超えた弾丸はfalseを返すこと', () => {
      const bullet = Bullet.create(5, -1);
      expect(Bullet.isValid(bullet, 12, 18)).toBe(false);
    });
  });
});
