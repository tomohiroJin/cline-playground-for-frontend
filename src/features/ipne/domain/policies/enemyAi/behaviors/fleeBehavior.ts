/**
 * SPECIMEN（標本）型敵のAI更新（プレイヤーから逃走）
 */
import { Enemy, EnemyState, GameMap, Position } from '../../../types';
import { detectPlayer, shouldStopChase } from '../aiGeometry';
import { moveEnemyAway } from '../enemyMovement';

export const updateFleeEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  if (detectPlayer(enemy, player)) {
    const moved = moveEnemyAway(enemy, player, map);
    return {
      ...moved,
      state: EnemyState.FLEE,
      lastKnownPlayerPos: player,
      lastSeenAt: currentTime,
    };
  }

  if (enemy.state === EnemyState.FLEE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.IDLE };
  }

  return { ...enemy, state: EnemyState.IDLE };
};
