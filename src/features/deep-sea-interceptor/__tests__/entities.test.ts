import { EntityFactory, randomChoice } from '../entities';

describe('EntityFactory', () => {
  describe('bullet', () => {
    test('通常弾を生成できること', () => {
      const bullet = EntityFactory.bullet(100, 200);
      expect(bullet.type).toBe('bullet');
      expect(bullet.x).toBe(100);
      expect(bullet.y).toBe(200);
      expect(bullet.charged).toBe(false);
      expect(bullet.damage).toBe(1);
      expect(bullet.size).toBe(6);
      expect(bullet.angle).toBe(-Math.PI / 2);
    });

    test('チャージ弾を生成できること', () => {
      const bullet = EntityFactory.bullet(100, 200, { charged: true });
      expect(bullet.charged).toBe(true);
      expect(bullet.damage).toBe(5);
      expect(bullet.size).toBe(22);
      expect(bullet.speed).toBe(9);
    });

    test('角度を指定して弾を生成できること', () => {
      const angle = -Math.PI / 4;
      const bullet = EntityFactory.bullet(100, 200, { angle });
      expect(bullet.angle).toBe(angle);
    });
  });

  describe('enemy', () => {
    test('basic敵を生成できること', () => {
      const enemy = EntityFactory.enemy('basic', 100, 50);
      expect(enemy.type).toBe('enemy');
      expect(enemy.enemyType).toBe('basic');
      expect(enemy.hp).toBe(1);
      expect(enemy.canShoot).toBe(false);
    });

    test('shooter敵は射撃能力を持つこと', () => {
      const enemy = EntityFactory.enemy('shooter', 100, 50);
      expect(enemy.canShoot).toBe(true);
      expect(enemy.fireRate).toBe(2000);
    });

    test('ボスのHPはステージに応じて増加すること', () => {
      const boss1 = EntityFactory.enemy('boss', 200, -60, 1);
      const boss2 = EntityFactory.enemy('boss', 200, -60, 2);
      expect(boss2.hp).toBeGreaterThan(boss1.hp);
      expect(boss1.hp).toBe(40 + 1 * 15);
      expect(boss2.hp).toBe(40 + 2 * 15);
    });

    test('無効な敵タイプでエラーが発生すること', () => {
      expect(() => EntityFactory.enemy('invalid', 0, 0)).toThrow('Invalid enemy type: invalid');
    });

    test('tank敵のサイズが大きいこと', () => {
      const tank = EntityFactory.enemy('tank', 100, 50);
      const basic = EntityFactory.enemy('basic', 100, 50);
      expect(tank.size).toBeGreaterThan(basic.size);
    });
  });

  describe('enemyBullet', () => {
    test('速度ベクトルで敵弾を生成できること', () => {
      const bullet = EntityFactory.enemyBullet(100, 50, { x: 2, y: 3 });
      expect(bullet.type).toBe('enemyBullet');
      expect(bullet.vx).toBe(2);
      expect(bullet.vy).toBe(3);
      expect(bullet.size).toBe(8);
    });
  });

  describe('item', () => {
    test('アイテムを生成できること', () => {
      const item = EntityFactory.item(100, 200, 'power');
      expect(item.type).toBe('item');
      expect(item.itemType).toBe('power');
      expect(item.size).toBe(24);
    });
  });

  describe('particle', () => {
    test('パーティクルを生成できること', () => {
      const particle = EntityFactory.particle(100, 200, { color: '#ff0000' });
      expect(particle.type).toBe('particle');
      expect(particle.color).toBe('#ff0000');
      expect(particle.life).toBe(15);
    });

    test('カスタム速度のパーティクルを生成できること', () => {
      const particle = EntityFactory.particle(100, 200, {
        color: '#ff0000',
        velocity: { x: 1, y: -2 },
      });
      expect(particle.vx).toBe(1);
      expect(particle.vy).toBe(-2);
    });
  });

  describe('bubble', () => {
    test('泡を生成できること', () => {
      const bubble = EntityFactory.bubble();
      expect(bubble.x).toBeGreaterThanOrEqual(0);
      expect(bubble.x).toBeLessThanOrEqual(400);
      expect(bubble.y).toBe(565);
      expect(bubble.opacity).toBeGreaterThan(0);
    });
  });
});

describe('randomChoice', () => {
  test('配列から要素を選択すること', () => {
    const arr = ['a', 'b', 'c'];
    const result = randomChoice(arr);
    expect(arr).toContain(result);
  });
});
