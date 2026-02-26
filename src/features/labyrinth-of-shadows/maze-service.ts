import { distance } from './utils';

// ==================== MAZE SERVICE ====================
export const MazeService = {
  // 再帰的彫刻アルゴリズムで迷路生成
  create(size: number) {
    const maze = Array.from({ length: size }, () => Array(size).fill(1));
    const carve = (x: number, y: number) => {
      maze[y][x] = 0;
      [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0],
      ]
        .sort(() => Math.random() - 0.5)
        .forEach(([dx, dy]) => {
          const nx = x + dx,
            ny = y + dy;
          if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx] === 1) {
            maze[y + dy / 2][x + dx / 2] = 0;
            carve(nx, ny);
          }
        });
    };
    carve(1, 1);
    return maze;
  },

  // Prim法による迷路生成（より広い通路が特徴）
  createPrim(size: number) {
    const maze = Array.from({ length: size }, () => Array(size).fill(1));
    const walls: [number, number, number, number][] = [];

    const addWalls = (x: number, y: number) => {
      const dirs: [number, number][] = [[0, -2], [2, 0], [0, 2], [-2, 0]];
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx] === 1) {
          walls.push([x, y, nx, ny]);
        }
      }
    };

    maze[1][1] = 0;
    addWalls(1, 1);

    while (walls.length > 0) {
      const idx = Math.floor(Math.random() * walls.length);
      const [fx, fy, tx, ty] = walls[idx];
      walls.splice(idx, 1);

      if (maze[ty][tx] === 1) {
        maze[ty][tx] = 0;
        maze[fy + (ty - fy) / 2][fx + (tx - fx) / 2] = 0;
        addWalls(tx, ty);
      }
    }

    return maze;
  },

  getEmptyCells(maze: number[][]) {
    const cells = [];
    for (let y = 1; y < maze.length - 1; y++)
      for (let x = 1; x < maze[0].length - 1; x++) if (maze[y][x] === 0) cells.push({ x, y });
    return cells.sort(() => Math.random() - 0.5);
  },

  isWalkable(maze: number[][], x: number, y: number) {
    const my = Math.floor(y),
      mx = Math.floor(x);
    return maze[my]?.[mx] === 0;
  },

  hasLineOfSight(maze: number[][], x1: number, y1: number, x2: number, y2: number) {
    const d = distance(x1, y1, x2, y2);
    const steps = Math.ceil(d * 10);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (!this.isWalkable(maze, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
    }
    return true;
  },

  // BFS パスファインディング（グリッド座標で動作）
  bfsPath(
    maze: number[][],
    sx: number,
    sy: number,
    tx: number,
    ty: number
  ): { x: number; y: number }[] {
    const startX = Math.floor(sx), startY = Math.floor(sy);
    const targetX = Math.floor(tx), targetY = Math.floor(ty);

    if (startX === targetX && startY === targetY) return [];

    const rows = maze.length;
    const cols = maze[0].length;
    const visited = new Set<string>();
    const parent = new Map<string, string>();
    const queue: [number, number][] = [[startX, startY]];
    const key = (x: number, y: number) => `${x},${y}`;

    visited.add(key(startX, startY));

    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

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
        const nx = cx + dx, ny = cy + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited.has(key(nx, ny)) && maze[ny][nx] === 0) {
          visited.add(key(nx, ny));
          parent.set(key(nx, ny), key(cx, cy));
          queue.push([nx, ny]);
        }
      }
    }

    return []; // 到達不能
  },
};
