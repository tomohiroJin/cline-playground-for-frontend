/**
 * ゴール判定モジュール
 */

import { GameMap, Player, Position, TileType } from './types';

/**
 * 指定位置がゴールかどうかを判定
 */
export const isGoal = (map: GameMap, x: number, y: number): boolean => {
  // マップ範囲外チェック
  if (y < 0 || y >= map.length) return false;
  if (x < 0 || x >= (map[0]?.length ?? 0)) return false;

  return map[y][x] === TileType.GOAL;
};

/**
 * ゴール位置を検索
 */
export const findGoalPosition = (map: GameMap): Position | undefined => {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === TileType.GOAL) {
        return { x, y };
      }
    }
  }
  return undefined;
};

/**
 * スタート位置を検索
 */
export const findStartPosition = (map: GameMap): Position | undefined => {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === TileType.START) {
        return { x, y };
      }
    }
  }
  return undefined;
};

/**
 * プレイヤーがゴールできるかどうかを判定
 * 鍵を持っている場合のみゴール可能
 */
export const canGoal = (player: Player): boolean => {
  return player.hasKey;
};
