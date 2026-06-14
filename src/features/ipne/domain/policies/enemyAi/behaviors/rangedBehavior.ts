/**
 * RANGED 型敵のAI更新（適切な間合いを保つ）
 */
import { Enemy, EnemyState, GameMap, Position } from '../../../types';
import { GAME_BALANCE } from '../../../config/gameBalance';
import { detectPlayer, shouldStopChase, getManhattanDistance } from '../aiGeometry';
import { moveEnemyTowards, moveEnemyAway } from '../enemyMovement';

/** RANGED敵が維持したい距離 */
const RANGED_PREFERRED_DISTANCE = GAME_BALANCE.enemyAi.rangedPreferredDistance;

/**
 * RANGED敵のAI更新
 * - プレイヤーを検知したら追跡状態になる
 * - 攻撃射程内で適切な距離を保つ
 * - 近すぎたら後退、遠すぎたら接近
 */
export const updateRangedEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  const playerDetected = detectPlayer(enemy, player);

  // プレイヤー発見時：追跡開始
  if (playerDetected) {
    const distance = getManhattanDistance(enemy, player);

    // 距離が近すぎる場合は後退
    if (distance < RANGED_PREFERRED_DISTANCE) {
      const moved = moveEnemyAway(enemy, player, map);
      return {
        ...moved,
        state: EnemyState.CHASE,
        lastKnownPlayerPos: player,
        lastSeenAt: currentTime,
      };
    }

    // 攻撃射程外の場合は接近
    if (distance > enemy.attackRange) {
      const moved = moveEnemyTowards(enemy, player, map);
      return {
        ...moved,
        state: EnemyState.CHASE,
        lastKnownPlayerPos: player,
        lastSeenAt: currentTime,
      };
    }

    // 適切な距離内：その場で待機（攻撃待ち）
    return {
      ...enemy,
      state: EnemyState.CHASE,
      lastKnownPlayerPos: player,
      lastSeenAt: currentTime,
    };
  }

  // 追跡中断判定
  if (enemy.state === EnemyState.CHASE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.RETURN };
  }

  // 追跡中：最後に見た位置へ
  if (enemy.state === EnemyState.CHASE && enemy.lastKnownPlayerPos) {
    return moveEnemyTowards(enemy, enemy.lastKnownPlayerPos, map);
  }

  // 帰還中：ホームポジションへ
  if (enemy.state === EnemyState.RETURN) {
    if (enemy.x === enemy.homePosition.x && enemy.y === enemy.homePosition.y) {
      return { ...enemy, state: EnemyState.IDLE };
    }
    return moveEnemyTowards(enemy, enemy.homePosition, map);
  }

  return { ...enemy, state: EnemyState.IDLE };
};
