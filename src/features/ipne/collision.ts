/**
 * 衝突判定モジュール
 */

import { GameMap, TileType } from './types';

/**
 * 指定位置が壁かどうかを判定
 * マップ範囲外も壁として扱う
 */
export const isWall = (map: GameMap, x: number, y: number): boolean => {
  // マップ範囲外は壁
  if (y < 0 || y >= map.length) return true;
  if (x < 0 || x >= (map[0]?.length ?? 0)) return true;

  return map[y][x] === TileType.WALL;
};

/**
 * 指定位置に移動可能かどうかを判定
 * 床、ゴール、スタート位置には移動可能
 */
export const canMove = (map: GameMap, x: number, y: number): boolean => {
  return !isWall(map, x, y);
};
