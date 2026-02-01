/**
 * マップ生成モジュール
 * BSPアルゴリズムによる自動生成迷路
 */

import { GameMap, MazeConfig, TileType } from './types';
import { generateMaze } from './mazeGenerator';
import { placeStart, placeGoal } from './pathfinder';

/**
 * デフォルトの迷路生成設定
 */
const DEFAULT_CONFIG: MazeConfig = {
  width: 70,
  height: 70,
  minRoomSize: 6,
  maxRoomSize: 10,
  corridorWidth: 3,
  maxDepth: 5, // 4 → 5（部屋数増加：8-32）
  loopCount: 2, // 1 → 2（分岐増加）
};

/**
 * 迷路マップを自動生成する
 *
 * @param config - 迷路生成設定（省略時はデフォルト設定を使用）
 * @returns 生成された迷路マップ（スタートとゴール配置済み）
 */
export const createMap = (config: MazeConfig = DEFAULT_CONFIG): GameMap => {
  // BSPアルゴリズムで迷路生成（部屋情報も取得）
  const { grid: maze, rooms } = generateMaze(config);

  // BSP生成の部屋を直接使用（通路は含まれない）
  // 部屋が見つからない場合のみフォールバック
  let validRooms = rooms;

  if (validRooms.length === 0) {
    // フォールバック: 最初の床タイルを探す
    for (let y = 1; y < maze.length - 1; y++) {
      for (let x = 1; x < maze[0].length - 1; x++) {
        if (maze[y][x] === TileType.FLOOR) {
          validRooms = [
            {
              rect: { x, y, width: 1, height: 1 },
              center: { x, y },
              tiles: [{ x, y }],
            },
          ];
          break;
        }
      }
      if (validRooms.length > 0) break;
    }
  }

  // それでも部屋が見つからない場合は、中心を使用
  if (validRooms.length === 0) {
    const centerX = Math.floor(maze[0].length / 2);
    const centerY = Math.floor(maze.length / 2);
    maze[centerY][centerX] = TileType.FLOOR; // 強制的に床に
    validRooms = [
      {
        rect: { x: centerX, y: centerY, width: 1, height: 1 },
        center: { x: centerX, y: centerY },
        tiles: [{ x: centerX, y: centerY }],
      },
    ];
  }

  // スタート位置を配置（外周付近の部屋を優先）
  const startPos = placeStart(validRooms, maze[0].length, maze.length);

  // ゴール位置を配置（スタートから最遠地点）
  const goalPos = placeGoal(maze, startPos);

  // スタート/ゴールタイルを配置
  maze[startPos.y][startPos.x] = TileType.START;
  maze[goalPos.y][goalPos.x] = TileType.GOAL;

  return maze;
};

/**
 * マップの幅を取得
 */
export const getMapWidth = (map: GameMap): number => {
  return map[0]?.length ?? 0;
};

/**
 * マップの高さを取得
 */
export const getMapHeight = (map: GameMap): number => {
  return map.length;
};
