/** PATROL 型敵のAI更新 */
import { Enemy, EnemyState, GameMap, Position } from '../../../types';
import { detectPlayer, shouldStopChase } from '../aiGeometry';
import { moveEnemyTowards, moveEnemyRandom, attemptLunge, getNextPatrolPoint } from '../enemyMovement';

export const updatePatrolEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  const playerDetected = detectPlayer(enemy, player);

  // プレイヤー発見時：追跡開始
  if (playerDetected) {
    const updated = {
      ...enemy,
      state: EnemyState.CHASE,
      lastKnownPlayerPos: player,
      lastSeenAt: currentTime,
    };
    // 追跡中にまれに突進
    const lunge = attemptLunge(updated, player, map, 2, 0.1);
    return lunge ?? moveEnemyTowards(updated, player, map);
  }

  // 追跡中断判定
  if (enemy.state === EnemyState.CHASE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.RETURN };
  }

  // 追跡中：プレイヤーに向かって移動
  if (enemy.state === EnemyState.CHASE) {
    const lunge = attemptLunge(enemy, player, map, 2, 0.1);
    const updated = lunge ?? moveEnemyTowards(enemy, player, map);
    return { ...updated, lastKnownPlayerPos: player, lastSeenAt: currentTime };
  }

  // 帰還中：ホームポジションに向かって移動
  if (enemy.state === EnemyState.RETURN) {
    if (enemy.x === enemy.homePosition.x && enemy.y === enemy.homePosition.y) {
      return { ...enemy, state: EnemyState.PATROL };
    }
    return moveEnemyTowards(enemy, enemy.homePosition, map);
  }

  // 巡回中：パスがあればその経路、なければランダム移動
  if (enemy.patrolPath && enemy.patrolPath.length > 0) {
    const target = getNextPatrolPoint(enemy);
    if (target) {
      const moved = moveEnemyTowards(enemy, target, map);
      if (moved.x === target.x && moved.y === target.y) {
        const nextIndex = (enemy.patrolIndex ?? 0) + 1;
        return { ...moved, patrolIndex: nextIndex % enemy.patrolPath.length };
      }
      return moved;
    }
  }

  return moveEnemyRandom(enemy, map);
};
