import { createEnemy } from '../../entities/enemy';
import { aPlayer, aMap } from '../../../__tests__/builders';
import { EnemyType } from '../../../types';
import { MockIdGenerator } from '../../../__tests__/mocks/MockIdGenerator';

const idGen = new MockIdGenerator();
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

    const enemy = createEnemy(EnemyType.PATROL, 2, 2, idGen);
    const result = registry.update({
      enemy,
      player: aPlayer().at(5, 5).build(),
      map: aMap(7, 7).build(),
      currentTime: 0,
    });

    expect(result.x).toBe(3);
  });

  it('一致ポリシーがない場合はそのまま返す', () => {
    const registry = new EnemyAiPolicyRegistry();
    const enemy = createEnemy(EnemyType.PATROL, 2, 2, idGen);

    const result = registry.update({
      enemy,
      player: aPlayer().at(5, 5).build(),
      map: aMap(7, 7).build(),
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

    const map = aMap(7, 7).build();
    const player = aPlayer().build();
    const currentTime = 0;

    registry.update({ enemy: createEnemy(EnemyType.PATROL, 1, 1, idGen), player, map, currentTime });
    registry.update({ enemy: createEnemy(EnemyType.CHARGE, 1, 1, idGen), player, map, currentTime });
    registry.update({ enemy: createEnemy(EnemyType.BOSS, 1, 1, idGen), player, map, currentTime });
    registry.update({ enemy: createEnemy(EnemyType.RANGED, 1, 1, idGen), player, map, currentTime });
    registry.update({ enemy: createEnemy(EnemyType.SPECIMEN, 1, 1, idGen), player, map, currentTime });

    expect(calls).toEqual(['patrol', 'charge', 'charge', 'ranged', 'specimen']);
  });
});
