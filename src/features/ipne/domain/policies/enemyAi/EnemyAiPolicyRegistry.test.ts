import { createEnemy } from '../../../enemy';
import { createTestMap, createTestPlayer } from '../../../__tests__/testUtils';
import { EnemyType } from '../../../types';
import { EnemyAiPolicyRegistry } from './EnemyAiPolicyRegistry';
import { EnemyAiPolicy } from './types';
import { buildDefaultEnemyAiPolicyRegistry } from './policies';

describe('EnemyAiPolicyRegistry', () => {
  it('該当タイプのポリシーで更新できる', () => {
    const registry = new EnemyAiPolicyRegistry();
    const patrolPolicy: EnemyAiPolicy = {
      supports: type => type === EnemyType.PATROL,
      update: ({ enemy }) => ({ ...enemy, x: enemy.x + 1 }),
    };
    registry.register(patrolPolicy);

    const enemy = createEnemy(EnemyType.PATROL, 2, 2);
    const result = registry.update({
      enemy,
      player: createTestPlayer(5, 5),
      map: createTestMap(),
      currentTime: 0,
    });

    expect(result.x).toBe(3);
  });

  it('一致ポリシーがない場合はそのまま返す', () => {
    const registry = new EnemyAiPolicyRegistry();
    const enemy = createEnemy(EnemyType.PATROL, 2, 2);

    const result = registry.update({
      enemy,
      player: createTestPlayer(5, 5),
      map: createTestMap(),
      currentTime: 0,
    });

    expect(result).toBe(enemy);
  });
});

describe('buildDefaultEnemyAiPolicyRegistry', () => {
  it('PATROL/CHARGE/RANGED/SPECIMEN の更新関数を使い分ける', () => {
    const calls: string[] = [];
    const registry = buildDefaultEnemyAiPolicyRegistry({
      updatePatrolEnemy: enemy => {
        calls.push('patrol');
        return enemy;
      },
      updateChargeEnemy: enemy => {
        calls.push('charge');
        return enemy;
      },
      updateRangedEnemy: enemy => {
        calls.push('ranged');
        return enemy;
      },
      updateFleeEnemy: enemy => {
        calls.push('specimen');
        return enemy;
      },
    });

    const map = createTestMap();
    const player = createTestPlayer(1, 1);
    const currentTime = 0;

    registry.update({ enemy: createEnemy(EnemyType.PATROL, 1, 1), player, map, currentTime });
    registry.update({ enemy: createEnemy(EnemyType.CHARGE, 1, 1), player, map, currentTime });
    registry.update({ enemy: createEnemy(EnemyType.BOSS, 1, 1), player, map, currentTime });
    registry.update({ enemy: createEnemy(EnemyType.RANGED, 1, 1), player, map, currentTime });
    registry.update({ enemy: createEnemy(EnemyType.SPECIMEN, 1, 1), player, map, currentTime });

    expect(calls).toEqual(['patrol', 'charge', 'charge', 'ranged', 'specimen']);
  });
});
