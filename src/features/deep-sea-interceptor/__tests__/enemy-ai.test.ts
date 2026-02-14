import { EnemyAI } from '../enemy-ai';
import { EntityFactory } from '../entities';

describe('EnemyAI', () => {
  describe('shouldShoot', () => {
    test('射撃可能な敵が発射間隔を超えたら射撃すること', () => {
      const enemy = EntityFactory.enemy('shooter', 100, 50);
      enemy.lastShotAt = 0;
      const now = 3000;
      expect(EnemyAI.shouldShoot(enemy, now)).toBe(true);
    });

    test('射撃できない敵は射撃しないこと', () => {
      const enemy = EntityFactory.enemy('basic', 100, 50);
      expect(EnemyAI.shouldShoot(enemy, 3000)).toBe(false);
    });

    test('画面外（y<=0）の敵は射撃しないこと', () => {
      const enemy = EntityFactory.enemy('shooter', 100, -10);
      expect(EnemyAI.shouldShoot(enemy, 3000)).toBe(false);
    });

    test('発射間隔内では射撃しないこと', () => {
      const enemy = EntityFactory.enemy('shooter', 100, 50);
      enemy.lastShotAt = 2000;
      expect(EnemyAI.shouldShoot(enemy, 2500)).toBe(false);
    });
  });

  describe('createBullets', () => {
    test('通常の敵は1発の弾を生成すること', () => {
      const enemy = EntityFactory.enemy('shooter', 100, 50);
      const bullets = EnemyAI.createBullets(enemy, { x: 100, y: 400 });
      expect(bullets).toHaveLength(1);
      expect(bullets[0].type).toBe('enemyBullet');
    });

    test('ボスは5発の弾を生成すること', () => {
      const boss = EntityFactory.enemy('boss', 200, 90);
      const bullets = EnemyAI.createBullets(boss, { x: 200, y: 400 });
      expect(bullets).toHaveLength(5);
    });

    test('弾の速度がターゲット方向であること', () => {
      const enemy = EntityFactory.enemy('shooter', 100, 0);
      const bullets = EnemyAI.createBullets(enemy, { x: 100, y: 100 });
      // ターゲットが真下なので vy > 0
      expect(bullets[0].vy).toBeGreaterThan(0);
    });
  });
});
