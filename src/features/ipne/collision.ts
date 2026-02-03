/**
 * 衝突判定モジュール
 */

import { Enemy, GameMap, Position, TileType, Wall, WallState, WallType } from './types';

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
 * 特殊壁の状態も考慮する
 */
export const canMove = (map: GameMap, x: number, y: number, walls?: Wall[]): boolean => {
  // マップ範囲外チェック
  if (y < 0 || y >= map.length) return false;
  if (x < 0 || x >= (map[0]?.length ?? 0)) return false;

  // 壁タイルの場合、特殊壁をチェック
  if (map[y][x] === TileType.WALL) {
    if (walls) {
      const wall = walls.find(w => w.x === x && w.y === y);
      if (wall) {
        // 破壊済み壁は通過可能
        if (wall.state === WallState.BROKEN) {
          return true;
        }
        // すり抜け可能壁は通過可能
        if (wall.type === WallType.PASSABLE) {
          return true;
        }
      }
    }
    return false;
  }

  return true;
};

/** プレイヤーと敵の衝突判定 */
export const checkEnemyCollision = (player: Position, enemies: Enemy[]): boolean => {
  return enemies.some(enemy => enemy.x === player.x && enemy.y === player.y);
};

/** 指定位置の敵を取得 */
export const getEnemyAtPosition = (enemies: Enemy[], x: number, y: number): Enemy | undefined => {
  return enemies.find(enemy => enemy.x === x && enemy.y === y);
};

/** 範囲内の敵を取得（マンハッタン距離） */
export const getEnemiesInRange = (
  enemies: Enemy[],
  position: Position,
  range: number
): Enemy[] => {
  return enemies.filter(
    enemy => Math.abs(enemy.x - position.x) + Math.abs(enemy.y - position.y) <= range
  );
};
