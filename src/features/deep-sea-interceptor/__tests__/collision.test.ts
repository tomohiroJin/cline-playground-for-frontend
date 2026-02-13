import { Collision, distance } from '../collision';
import { EntityFactory } from '../entities';

describe('distance', () => {
  test('同じ位置の距離は0であること', () => {
    expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });

  test('2点間の距離を正しく計算すること', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('Collision', () => {
  describe('circle', () => {
    test('重なる円は衝突すること', () => {
      expect(Collision.circle({ x: 0, y: 0 }, { x: 5, y: 0 }, 3, 3)).toBe(true);
    });

    test('離れた円は衝突しないこと', () => {
      expect(Collision.circle({ x: 0, y: 0 }, { x: 100, y: 0 }, 3, 3)).toBe(false);
    });
  });

  describe('bulletEnemy', () => {
    test('弾と敵が接触していれば衝突すること', () => {
      const bullet = EntityFactory.bullet(100, 100);
      const enemy = EntityFactory.enemy('basic', 103, 100);
      expect(Collision.bulletEnemy(bullet, enemy)).toBe(true);
    });

    test('弾と敵が離れていれば衝突しないこと', () => {
      const bullet = EntityFactory.bullet(100, 100);
      const enemy = EntityFactory.enemy('basic', 200, 200);
      expect(Collision.bulletEnemy(bullet, enemy)).toBe(false);
    });
  });

  describe('playerItem', () => {
    test('プレイヤーとアイテムが接触していれば衝突すること', () => {
      const item = EntityFactory.item(105, 100, 'power');
      expect(Collision.playerItem({ x: 100, y: 100 }, item)).toBe(true);
    });
  });

  describe('playerEnemyBullet', () => {
    test('プレイヤーと敵弾の衝突判定ができること', () => {
      const bullet = EntityFactory.enemyBullet(100, 100, { x: 0, y: 1 });
      expect(Collision.playerEnemyBullet({ x: 100, y: 100 }, bullet)).toBe(true);
    });

    test('離れた位置では衝突しないこと', () => {
      const bullet = EntityFactory.enemyBullet(200, 200, { x: 0, y: 1 });
      expect(Collision.playerEnemyBullet({ x: 100, y: 100 }, bullet)).toBe(false);
    });
  });

  describe('playerEnemy', () => {
    test('プレイヤーと敵が接触していれば衝突すること', () => {
      const enemy = EntityFactory.enemy('basic', 105, 100);
      expect(Collision.playerEnemy({ x: 100, y: 100 }, enemy)).toBe(true);
    });
  });
});
