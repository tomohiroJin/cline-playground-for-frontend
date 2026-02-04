import {
  createPatrolEnemy,
  createChargeEnemy,
  createSpecimenEnemy,
  createBoss,
  damageEnemy,
  isEnemyAlive,
  applyKnockbackToEnemy,
  resetEnemyIdCounter,
} from '../enemy';
import { EnemyState, Direction } from '../types';

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
});
