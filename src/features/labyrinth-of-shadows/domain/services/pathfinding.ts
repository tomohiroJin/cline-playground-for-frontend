/**
 * パスファインディングサービス
 * BFS によるグリッド上の最短経路探索
 */

/** BFS でグリッド上の最短経路を計算する */
export const bfsPath = (
  maze: number[][],
  sx: number,
  sy: number,
  tx: number,
  ty: number
): { x: number; y: number }[] => {
  const startX = Math.floor(sx);
  const startY = Math.floor(sy);
  const targetX = Math.floor(tx);
  const targetY = Math.floor(ty);

  if (startX === targetX && startY === targetY) return [];

  const rows = maze.length;
  const cols = maze[0].length;
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: [number, number][] = [[startX, startY]];
  const key = (x: number, y: number) => `${x},${y}`;

  visited.add(key(startX, startY));

  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;

    if (cx === targetX && cy === targetY) {
      // 経路を復元
      const path: { x: number; y: number }[] = [];
      let cur = key(targetX, targetY);
      while (cur !== key(startX, startY)) {
        const [px, py] = cur.split(',').map(Number);
        path.unshift({ x: px + 0.5, y: py + 0.5 });
        cur = parent.get(cur)!;
      }
      return path;
    }

    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (
        nx >= 0 &&
        nx < cols &&
        ny >= 0 &&
        ny < rows &&
        !visited.has(key(nx, ny)) &&
        maze[ny][nx] === 0
      ) {
        visited.add(key(nx, ny));
        parent.set(key(nx, ny), key(cx, cy));
        queue.push([nx, ny]);
      }
    }
  }

  return []; // 到達不能
};
