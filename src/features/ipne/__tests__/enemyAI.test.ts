import {
  detectPlayer,
  shouldChase,
  shouldStopChase,
  updatePatrolEnemy,
  updateFleeEnemy,
  updateRangedEnemy,
  generatePatrolPath,
} from '../enemyAI';
import { createPatrolEnemy, createSpecimenEnemy, createRangedEnemy } from '../enemy';
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

  describe('遠隔攻撃型敵', () => {
    test('遠隔攻撃型敵が正しく生成されること', () => {
      const enemy = createRangedEnemy(3, 3);
      expect(enemy.attackRange).toBe(4);
      expect(enemy.detectionRange).toBe(7);
    });

    test('プレイヤーが近すぎる場合は後退すること', () => {
      const map = createTestMap(10, 10); // 大きいマップを使用
      const enemy = createRangedEnemy(4, 4);
      const player = createTestPlayer(3, 4); // 距離1（近すぎる）

      const updated = updateRangedEnemy(enemy, player, map, 0);
      expect(updated.state).toBe(EnemyState.CHASE);
      // 後退するのでxが増加
      expect(updated.x).toBeGreaterThan(4);
    });

    test('プレイヤーが攻撃射程外の場合は接近すること', () => {
      const map = createTestMap(15, 15); // 大きいマップを使用
      const enemy = createRangedEnemy(2, 2);
      const player = createTestPlayer(8, 2); // 距離6（射程4外）

      const updated = updateRangedEnemy(enemy, player, map, 0);
      expect(updated.state).toBe(EnemyState.CHASE);
      // 接近するのでxが増加
      expect(updated.x).toBeGreaterThan(2);
    });

    test('適切な距離を保っている場合はその場に留まること', () => {
      const map = createTestMap(10, 10);
      const enemy = createRangedEnemy(5, 3);
      const player = createTestPlayer(2, 3); // 距離3（適切な距離）

      const updated = updateRangedEnemy(enemy, player, map, 0);
      expect(updated.state).toBe(EnemyState.CHASE);
      // 距離が適切なのでその場に留まる
      expect(updated.x).toBe(5);
      expect(updated.y).toBe(3);
    });

    test('プレイヤーを見失ったら帰還すること', () => {
      const map = createTestMap(10, 10);
      const enemy = {
        ...createRangedEnemy(3, 3),
        state: EnemyState.CHASE,
        lastSeenAt: 0,
      };
      const player = createTestPlayer(20, 20); // 検知範囲外

      const updated = updateRangedEnemy(enemy, player, map, 5000);
      expect(updated.state).toBe(EnemyState.RETURN);
    });
  });
});
