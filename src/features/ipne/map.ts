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
  maxDepth: 4,
  loopCount: 1,
};

/**
 * 迷路マップを自動生成する
 *
 * @param config - 迷路生成設定（省略時はデフォルト設定を使用）
 * @returns 生成された迷路マップ（スタートとゴール配置済み）
 */
export const createMap = (config: MazeConfig = DEFAULT_CONFIG): GameMap => {
  // BSPアルゴリズムで迷路生成
  const maze = generateMaze(config);

  // 部屋を抽出（スタート/ゴール配置に使用）
  let rooms = extractRooms(maze);

  // 部屋が見つからない場合は、フォールバック: 最初の床タイルを探す
  if (rooms.length === 0) {
    for (let y = 1; y < maze.length - 1; y++) {
      for (let x = 1; x < maze[0].length - 1; x++) {
        if (maze[y][x] === TileType.FLOOR) {
          rooms = [
            {
              rect: { x, y, width: 1, height: 1 },
              center: { x, y },
            },
          ];
          break;
        }
      }
      if (rooms.length > 0) break;
    }
  }

  // それでも部屋が見つからない場合は、中心を使用
  if (rooms.length === 0) {
    const centerX = Math.floor(maze[0].length / 2);
    const centerY = Math.floor(maze.length / 2);
    maze[centerY][centerX] = TileType.FLOOR; // 強制的に床に
    rooms = [
      {
        rect: { x: centerX, y: centerY, width: 1, height: 1 },
        center: { x: centerX, y: centerY },
      },
    ];
  }

  // スタート位置を配置（外周付近の部屋を優先）
  const startPos = placeStart(rooms, maze[0].length, maze.length);

  // ゴール位置を配置（スタートから最遠地点）
  const goalPos = placeGoal(maze, startPos);

  // スタート/ゴールタイルを配置
  maze[startPos.y][startPos.x] = TileType.START;
  maze[goalPos.y][goalPos.x] = TileType.GOAL;

  return maze;
};

/**
 * 迷路から部屋領域を抽出
 */
function extractRooms(map: GameMap) {
  const rooms = [];
  const visited = new Set<string>();

  for (let y = 1; y < map.length - 1; y++) {
    for (let x = 1; x < map[0].length - 1; x++) {
      if (map[y][x] === TileType.FLOOR && !visited.has(`${x},${y}`)) {
        const room = floodFill(map, x, y, visited);
        if (room) {
          rooms.push(room);
        }
      }
    }
  }

  return rooms;
}

/**
 * 塗りつぶしアルゴリズムで部屋を検出
 */
function floodFill(map: GameMap, startX: number, startY: number, visited: Set<string>) {
  const queue = [{ x: startX, y: startY }];
  const tiles = [];
  let minX = startX,
    maxX = startX,
    minY = startY,
    maxY = startY;

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) continue;
    if (map[y][x] !== TileType.FLOOR) continue;

    visited.add(key);
    tiles.push({ x, y });

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    queue.push({ x: x + 1, y });
    queue.push({ x: x - 1, y });
    queue.push({ x, y: y + 1 });
    queue.push({ x, y: y - 1 });
  }

  if (tiles.length > 0) {
    return {
      rect: {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      },
      center: {
        x: Math.floor((minX + maxX) / 2),
        y: Math.floor((minY + maxY) / 2),
      },
      tiles, // 実際の床タイル座標リストを保持
    };
  }

  return null;
}

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
