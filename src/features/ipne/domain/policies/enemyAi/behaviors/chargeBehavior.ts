/** CHARGE/BOSS 型敵のAI更新 */
import { Enemy, EnemyState, EnemyType, GameMap, Position } from '../../../types';
import { shouldChase, shouldStopChase, getManhattanDistance } from '../aiGeometry';
import { moveEnemyTowards, attemptLunge } from '../enemyMovement';

export const updateChargeEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  if (shouldChase(enemy, player)) {
    const moved = moveEnemyTowards(enemy, player, map);
    return {
      ...moved,
      state: EnemyState.CHASE,
      lastKnownPlayerPos: player,
      lastSeenAt: currentTime,
    };
  }

  if (enemy.state === EnemyState.CHASE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.IDLE };
  }

  if (enemy.state === EnemyState.CHASE) {
    if (enemy.type === EnemyType.BOSS) {
      const distance = getManhattanDistance(enemy, player);
      const lungeChance = distance <= 2 ? 0.55 : distance <= 4 ? 0.4 : 0.25;
      const lungeRange = distance <= 2 ? 3 : 4;
      const lunge = attemptLunge(enemy, player, map, lungeRange, lungeChance);
      return lunge ?? moveEnemyTowards(enemy, player, map);
    }
    const lunge = attemptLunge(enemy, player, map, 2, 0.2);
    return lunge ?? moveEnemyTowards(enemy, player, map);
  }

  return { ...enemy, state: EnemyState.IDLE };
};
