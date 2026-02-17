import { EnemyType, Enemy, GameMap, Position } from '../../../types';
import { EnemyAiPolicyRegistry } from './EnemyAiPolicyRegistry';

interface EnemyAiPolicyDeps {
  updatePatrolEnemy: (enemy: Enemy, player: Position, map: GameMap, currentTime: number) => Enemy;
  updateChargeEnemy: (enemy: Enemy, player: Position, map: GameMap, currentTime: number) => Enemy;
  updateRangedEnemy: (enemy: Enemy, player: Position, map: GameMap, currentTime: number) => Enemy;
  updateFleeEnemy: (enemy: Enemy, player: Position, map: GameMap, currentTime: number) => Enemy;
}

export function buildDefaultEnemyAiPolicyRegistry(deps: EnemyAiPolicyDeps): EnemyAiPolicyRegistry {
  const registry = new EnemyAiPolicyRegistry();

  registry.register({
    supports: type => type === EnemyType.PATROL,
    update: ({ enemy, player, map, currentTime }) =>
      deps.updatePatrolEnemy(enemy, player, map, currentTime),
  });

  registry.register({
    supports: type =>
      type === EnemyType.CHARGE ||
      type === EnemyType.BOSS ||
      type === EnemyType.MINI_BOSS ||
      type === EnemyType.MEGA_BOSS,
    update: ({ enemy, player, map, currentTime }) =>
      deps.updateChargeEnemy(enemy, player, map, currentTime),
  });

  registry.register({
    supports: type => type === EnemyType.RANGED,
    update: ({ enemy, player, map, currentTime }) =>
      deps.updateRangedEnemy(enemy, player, map, currentTime),
  });

  registry.register({
    supports: type => type === EnemyType.SPECIMEN,
    update: ({ enemy, player, map, currentTime }) =>
      deps.updateFleeEnemy(enemy, player, map, currentTime),
  });

  return registry;
}
