import {
  detectPlayer,
  shouldChase,
  shouldStopChase,
  updatePatrolEnemy,
  updateFleeEnemy,
  generatePatrolPath,
} from '../enemyAI';
import { createPatrolEnemy, createSpecimenEnemy } from '../enemy';
import { EnemyState } from '../types';
import { createTestMap, createTestPlayer } from './testUtils';

describe('enemyAI', () => {
  test('視認判定が正しいこと', () => {
    const enemy = createPatrolEnemy(1, 1);
    const player = createTestPlayer(2, 2);
    expect(detectPlayer(enemy, player)).toBe(true);

    const farPlayer = createTestPlayer(10, 10);
    expect(detectPlayer(enemy, farPlayer)).toBe(false);
  });

  test('追跡開始条件が正しいこと', () => {
    const enemy = createPatrolEnemy(1, 1);
    const player = createTestPlayer(2, 2);
    expect(shouldChase(enemy, player)).toBe(true);
  });

  test('追跡中断条件が正しいこと（距離超過）', () => {
    const enemy = createPatrolEnemy(1, 1);
    const player = createTestPlayer(20, 20);
    expect(shouldStopChase(enemy, player, 0)).toBe(true);
  });

  test('巡回パスが生成されること', () => {
    const path = generatePatrolPath({ x: 1, y: 1 });
    expect(path.length).toBeGreaterThan(0);
  });

  test('巡回移動がパスに沿って進むこと', () => {
    const map = createTestMap();
    const enemy = {
      ...createPatrolEnemy(1, 1),
      patrolPath: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      patrolIndex: 1,
      state: EnemyState.PATROL,
    };
    const player = createTestPlayer(5, 5);

    const updated = updatePatrolEnemy(enemy, player, map, 0);
    expect(updated.x).toBe(2);
    expect(updated.y).toBe(1);
  });

  test('標本型移動がプレイヤーから離れること', () => {
    const map = createTestMap();
    const enemy = createSpecimenEnemy(3, 3);
    const player = createTestPlayer(2, 3);

    const updated = updateFleeEnemy(enemy, player, map, 0);
    expect(updated.x).toBeGreaterThan(3);
  });
});
