/**
 * EntityFactory 統一インターフェースのテスト
 */
import { EntityFactory } from './entityFactory';
import { EnemyType, TrapType, WallType, ItemType } from '../types';
import { IdGenerator } from '../ports';

// テスト用モック
const mockIdGen: IdGenerator = {
  generateEnemyId: () => 'e1',
  generateTrapId: () => 't1',
  generateItemId: () => 'i1',
  generateFeedbackId: () => 'f1',
};

describe('EntityFactory', () => {
  describe('createEnemy', () => {
    it('タイプ指定で敵を生成する', () => {
      const enemy = EntityFactory.createEnemy(EnemyType.PATROL, 5, 3, mockIdGen);
      expect(enemy.type).toBe(EnemyType.PATROL);
      expect(enemy.x).toBe(5);
      expect(enemy.y).toBe(3);
      expect(enemy.hp).toBeGreaterThan(0);
    });

    it('全タイプの敵を生成できる', () => {
      const types = [
        EnemyType.PATROL, EnemyType.CHARGE, EnemyType.RANGED,
        EnemyType.SPECIMEN, EnemyType.BOSS, EnemyType.MINI_BOSS, EnemyType.MEGA_BOSS,
      ];
      for (const type of types) {
        const enemy = EntityFactory.createEnemy(type, 1, 1, mockIdGen);
        expect(enemy.type).toBe(type);
      }
    });
  });

  describe('createTrap', () => {
    it('タイプ指定で罠を生成する', () => {
      const trap = EntityFactory.createTrap(TrapType.DAMAGE, 2, 4, mockIdGen);
      expect(trap.type).toBe(TrapType.DAMAGE);
      expect(trap.x).toBe(2);
      expect(trap.y).toBe(4);
    });

    it('全タイプの罠を生成できる', () => {
      const types = [TrapType.DAMAGE, TrapType.SLOW, TrapType.TELEPORT];
      for (const type of types) {
        const trap = EntityFactory.createTrap(type, 1, 1, mockIdGen);
        expect(trap.type).toBe(type);
      }
    });
  });

  describe('createWall', () => {
    it('タイプ指定で壁を生成する', () => {
      const wall = EntityFactory.createWall(WallType.BREAKABLE, 3, 5);
      expect(wall.type).toBe(WallType.BREAKABLE);
      expect(wall.x).toBe(3);
      expect(wall.y).toBe(5);
    });

    it('全タイプの壁を生成できる', () => {
      const types = [WallType.NORMAL, WallType.BREAKABLE, WallType.PASSABLE, WallType.INVISIBLE];
      for (const type of types) {
        const wall = EntityFactory.createWall(type, 1, 1);
        expect(wall.type).toBe(type);
      }
    });
  });

  describe('createItem', () => {
    it('タイプ指定でアイテムを生成する', () => {
      const item = EntityFactory.createItem(ItemType.HEALTH_SMALL, 4, 6, mockIdGen);
      expect(item.type).toBe(ItemType.HEALTH_SMALL);
      expect(item.x).toBe(4);
      expect(item.y).toBe(6);
    });

    it('全タイプのアイテムを生成できる', () => {
      const types = [
        ItemType.HEALTH_SMALL, ItemType.HEALTH_LARGE, ItemType.HEALTH_FULL,
        ItemType.LEVEL_UP, ItemType.MAP_REVEAL, ItemType.KEY,
      ];
      for (const type of types) {
        const item = EntityFactory.createItem(type, 1, 1, mockIdGen);
        expect(item.type).toBe(type);
      }
    });
  });
});
