/**
 * 経路探索とスタート/ゴール配置
 */
import { GameMap, Position, Room, TileType } from './types';

/**
 * BFS（幅優先探索）で全タイルへの最短距離を計算
 */
export function calculateDistances(map: GameMap, start: Position): Map<string, number> {
  const distances = new Map<string, number>();
  const queue: Array<{ pos: Position; dist: number }> = [{ pos: start, dist: 0 }];
  const visited = new Set<string>();

  const key = (p: Position) => `${p.x},${p.y}`;

  visited.add(key(start));
  distances.set(key(start), 0);

  while (queue.length > 0) {
    const { pos, dist } = queue.shift()!;

    // 4方向を探索
    const directions = [
      { x: 0, y: -1 }, // 上
      { x: 0, y: 1 }, // 下
      { x: -1, y: 0 }, // 左
      { x: 1, y: 0 }, // 右
    ];

    for (const dir of directions) {
      const next: Position = { x: pos.x + dir.x, y: pos.y + dir.y };
      const k = key(next);

      // 範囲外チェック
      if (next.y < 0 || next.y >= map.length || next.x < 0 || next.x >= map[0].length) {
        continue;
      }

      // 壁チェック
      if (map[next.y][next.x] === TileType.WALL) {
        continue;
      }

      // 未訪問チェック
      if (visited.has(k)) {
        continue;
      }

      visited.add(k);
      distances.set(k, dist + 1);
      queue.push({ pos: next, dist: dist + 1 });
    }
  }

  return distances;
}

/**
 * スタート位置を配置（外周付近の部屋からランダムに選択）
 */
export function placeStart(rooms: Room[]): Position {
  if (rooms.length === 0) {
    throw new Error('No rooms available for start placement');
  }

  // ランダムに部屋を選択
  const room = rooms[Math.floor(Math.random() * rooms.length)];

  // 部屋の中心付近にランダム配置
  const { x, y, width, height } = room.rect;
  const startX = x + Math.floor(Math.random() * width);
  const startY = y + Math.floor(Math.random() * height);

  return { x: startX, y: startY };
}

/**
 * ゴール位置を配置（スタートから最遠地点）
 */
export function placeGoal(map: GameMap, start: Position): Position {
  const distances = calculateDistances(map, start);

  let maxDist = -1;
  let goalPos: Position = start;

  // 最遠地点を探索
  for (const [key, dist] of distances.entries()) {
    if (dist > maxDist) {
      maxDist = dist;
      const [x, y] = key.split(',').map(Number);
      goalPos = { x, y };
    }
  }

  return goalPos;
}

/**
 * スタートからゴールへ到達可能か検証
 */
export function isConnected(map: GameMap, start: Position, goal: Position): boolean {
  const distances = calculateDistances(map, start);
  const key = `${goal.x},${goal.y}`;
  return distances.has(key);
}
