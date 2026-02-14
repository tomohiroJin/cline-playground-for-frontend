import { distance } from './utils';

// ==================== MAZE SERVICE ====================
export const MazeService = {
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
};
