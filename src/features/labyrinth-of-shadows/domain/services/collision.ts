/**
 * 衝突判定サービス
 * プレイヤーとアイテム・出口・敵の衝突を判定する純粋関数群
 */
import { distance } from '../../utils';
import { GAME_BALANCE } from '../constants';

const { ITEM_PICKUP_DISTANCE, EXIT_DISTANCE, ENEMY_COLLISION_DISTANCE } = GAME_BALANCE.collision;

/** プレイヤーがアイテム取得範囲内にいるか判定する */
export const isPlayerNearItem = (
  playerX: number,
  playerY: number,
  itemX: number,
  itemY: number
): boolean => {
  return distance(playerX, playerY, itemX + 0.5, itemY + 0.5) < ITEM_PICKUP_DISTANCE;
};

/** プレイヤーが出口到達範囲内にいるか判定する */
export const isPlayerNearExit = (
  playerX: number,
  playerY: number,
  exitX: number,
  exitY: number
): boolean => {
  return distance(playerX, playerY, exitX, exitY) < EXIT_DISTANCE;
};

/** プレイヤーが敵と衝突しているか判定する */
export const isPlayerCollidingEnemy = (
  playerX: number,
  playerY: number,
  enemyX: number,
  enemyY: number
): boolean => {
  return distance(playerX, playerY, enemyX, enemyY) < ENEMY_COLLISION_DISTANCE;
};
