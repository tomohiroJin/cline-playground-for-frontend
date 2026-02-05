import {
  createPatrolEnemy,
  createChargeEnemy,
  createSpecimenEnemy,
  createBoss,
  damageEnemy,
  isEnemyAlive,
  applyKnockbackToEnemy,
  resetEnemyIdCounter,
  SPECIMEN_DROP_RATE,
  DROP_ITEM_WEIGHTS,
  shouldDropItem,
  selectDropItemType,
  createDropItem,
  processEnemyDeath,
} from '../enemy';
import { resetItemIdCounter } from '../item';
import { EnemyState, Direction, ItemType } from '../types';

describe('enemy', () => {
  beforeEach(() => {
    resetEnemyIdCounter();
  });
  test('種類別の敵が正しく生成されること', () => {
    const patrol = createPatrolEnemy(1, 1);
    expect(patrol.hp).toBe(4);
    expect(patrol.damage).toBe(1);
    expect(patrol.speed).toBe(2);

    const charge = createChargeEnemy(2, 2);
    expect(charge.hp).toBe(3);
    expect(charge.damage).toBe(2);
    expect(charge.speed).toBe(5);

    const specimen = createSpecimenEnemy(3, 3);
    expect(specimen.hp).toBe(1);
    expect(specimen.damage).toBe(0);
    expect(specimen.speed).toBe(4);

    const boss = createBoss(4, 4);
    expect(boss.hp).toBe(12);
    expect(boss.damage).toBe(4);
    expect(boss.speed).toBe(1.5);
  });

  test('敵IDが一意であること', () => {
    const enemy1 = createPatrolEnemy(1, 1);
    const enemy2 = createPatrolEnemy(2, 2);
    expect(enemy1.id).not.toBe(enemy2.id);
  });

  test('ダメージでHPが減少すること', () => {
    const enemy = createPatrolEnemy(1, 1);
    const damaged = damageEnemy(enemy, 2);
    expect(damaged.hp).toBe(2); // HP 4 - 2 = 2
  });

  test('HP0で死亡判定になること', () => {
    const enemy = createPatrolEnemy(1, 1);
    const damaged = damageEnemy(enemy, 999);
    expect(isEnemyAlive(damaged)).toBe(false);
  });

  test('ノックバック状態が設定されること', () => {
    const enemy = createPatrolEnemy(1, 1);
    const knocked = applyKnockbackToEnemy(enemy, Direction.UP, 1234);
    expect(knocked.state).toBe(EnemyState.KNOCKBACK);
    expect(knocked.knockbackDirection).toBe(Direction.UP);
    expect(knocked.knockbackUntil).toBe(1234);
  });

  // ===== MVP4 SPECIMENドロップテスト =====

  describe('SPECIMENドロップ', () => {
    beforeEach(() => {
      resetItemIdCounter();
    });

    describe('SPECIMEN_DROP_RATE', () => {
      test('ドロップ率が0.3であること', () => {
        expect(SPECIMEN_DROP_RATE).toBe(0.3);
      });
    });

    describe('DROP_ITEM_WEIGHTS', () => {
      test('アイテム重みが正しく設定されていること', () => {
        expect(DROP_ITEM_WEIGHTS.HEALTH_SMALL).toBe(50);
        expect(DROP_ITEM_WEIGHTS.HEALTH_LARGE).toBe(30);
        expect(DROP_ITEM_WEIGHTS.LEVEL_UP).toBe(20);
      });
    });

    describe('shouldDropItem', () => {
      test('SPECIMENで確率未満の場合はtrueを返すこと', () => {
        const specimen = createSpecimenEnemy(1, 1);
        expect(shouldDropItem(specimen, 0.1)).toBe(true);
        expect(shouldDropItem(specimen, 0.29)).toBe(true);
      });

      test('SPECIMENで確率以上の場合はfalseを返すこと', () => {
        const specimen = createSpecimenEnemy(1, 1);
        expect(shouldDropItem(specimen, 0.3)).toBe(false);
        expect(shouldDropItem(specimen, 0.5)).toBe(false);
      });

      test('SPECIMEN以外の敵はfalseを返すこと', () => {
        const patrol = createPatrolEnemy(1, 1);
        const charge = createChargeEnemy(1, 1);
        const boss = createBoss(1, 1);

        expect(shouldDropItem(patrol, 0.1)).toBe(false);
        expect(shouldDropItem(charge, 0.1)).toBe(false);
        expect(shouldDropItem(boss, 0.1)).toBe(false);
      });
    });

    describe('selectDropItemType', () => {
      test('小回復アイテムを選択すること（0〜50未満）', () => {
        expect(selectDropItemType(0)).toBe('health_small');
        expect(selectDropItemType(0.49)).toBe('health_small');
      });

      test('大回復アイテムを選択すること（50〜80未満）', () => {
        expect(selectDropItemType(0.5)).toBe('health_large');
        expect(selectDropItemType(0.79)).toBe('health_large');
      });

      test('レベルアップアイテムを選択すること（80〜100）', () => {
        expect(selectDropItemType(0.8)).toBe('level_up');
        expect(selectDropItemType(0.99)).toBe('level_up');
      });
    });

    describe('createDropItem', () => {
      test('小回復アイテムを作成すること', () => {
        const specimen = createSpecimenEnemy(5, 7);
        const item = createDropItem(specimen, 0);

        expect(item).not.toBeNull();
        expect(item?.type).toBe(ItemType.HEALTH_SMALL);
        expect(item?.x).toBe(5);
        expect(item?.y).toBe(7);
      });

      test('大回復アイテムを作成すること', () => {
        const specimen = createSpecimenEnemy(3, 4);
        const item = createDropItem(specimen, 0.5);

        expect(item).not.toBeNull();
        expect(item?.type).toBe(ItemType.HEALTH_LARGE);
      });

      test('レベルアップアイテムを作成すること', () => {
        const specimen = createSpecimenEnemy(2, 3);
        const item = createDropItem(specimen, 0.9);

        expect(item).not.toBeNull();
        expect(item?.type).toBe(ItemType.LEVEL_UP);
      });
    });

    describe('processEnemyDeath', () => {
      test('生存中の敵は死亡処理しないこと', () => {
        const specimen = createSpecimenEnemy(1, 1);
        const result = processEnemyDeath(specimen, 0.1, 0);

        expect(result.isDead).toBe(false);
        expect(result.droppedItem).toBeNull();
      });

      test('死亡したSPECIMENでアイテムをドロップすること', () => {
        const specimen = damageEnemy(createSpecimenEnemy(3, 4), 999);
        const result = processEnemyDeath(specimen, 0.1, 0);

        expect(result.isDead).toBe(true);
        expect(result.droppedItem).not.toBeNull();
        expect(result.droppedItem?.x).toBe(3);
        expect(result.droppedItem?.y).toBe(4);
      });

      test('死亡したSPECIMENでドロップしない場合があること', () => {
        const specimen = damageEnemy(createSpecimenEnemy(1, 1), 999);
        const result = processEnemyDeath(specimen, 0.5, 0);

        expect(result.isDead).toBe(true);
        expect(result.droppedItem).toBeNull();
      });

      test('死亡したPATROL敵はアイテムをドロップしないこと', () => {
        const patrol = damageEnemy(createPatrolEnemy(1, 1), 999);
        const result = processEnemyDeath(patrol, 0.1, 0);

        expect(result.isDead).toBe(true);
        expect(result.droppedItem).toBeNull();
      });
    });
  });
});
