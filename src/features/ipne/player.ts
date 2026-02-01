/**
 * プレイヤー操作モジュール
 */

import { Player, GameMap, DirectionValue, Direction } from './types';
import { canMove } from './collision';

/**
 * プレイヤーを作成
 */
export const createPlayer = (x: number, y: number): Player => {
  return { x, y };
};

/**
 * プレイヤーを指定方向に移動
 * 移動先が壁の場合は移動しない
 */
export const movePlayer = (
  player: Player,
  direction: DirectionValue,
  map: GameMap
): Player => {
  let newX = player.x;
  let newY = player.y;

  switch (direction) {
    case Direction.UP:
      newY = player.y - 1;
      break;
    case Direction.DOWN:
      newY = player.y + 1;
      break;
    case Direction.LEFT:
      newX = player.x - 1;
      break;
    case Direction.RIGHT:
      newX = player.x + 1;
      break;
  }

  // 移動可能な場合のみ新しい位置を返す
  if (canMove(map, newX, newY)) {
    return { x: newX, y: newY };
  }

  // 移動不可の場合は元の位置を返す
  return { x: player.x, y: player.y };
};
