/**
 * 迷路生成サービス
 * 乱数関数を DI 可能にし、テストの再現性を確保
 */

/** 迷路生成インターフェース */
export interface MazeGenerator {
  generate(size: number, randomFn?: () => number): number[][];
}

/** 再帰的彫刻アルゴリズムによる迷路生成 */
export class RecursiveBacktrackGenerator implements MazeGenerator {
  generate(size: number, randomFn: () => number = Math.random): number[][] {
    const maze = Array.from({ length: size }, () => Array(size).fill(1) as number[]);
    const carve = (x: number, y: number) => {
      maze[y][x] = 0;
      const directions: [number, number][] = [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0],
      ];
      directions
        .sort(() => randomFn() - 0.5)
        .forEach(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx] === 1) {
            maze[y + dy / 2][x + dx / 2] = 0;
            carve(nx, ny);
          }
        });
    };
    carve(1, 1);
    return maze;
  }
}

/** Prim法による迷路生成（より広い通路が特徴） */
export class PrimGenerator implements MazeGenerator {
  generate(size: number, randomFn: () => number = Math.random): number[][] {
    const maze = Array.from({ length: size }, () => Array(size).fill(1) as number[]);
    const walls: [number, number, number, number][] = [];

    const addWalls = (x: number, y: number) => {
      const dirs: [number, number][] = [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0],
      ];
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx] === 1) {
          walls.push([x, y, nx, ny]);
        }
      }
    };

    maze[1][1] = 0;
    addWalls(1, 1);

    while (walls.length > 0) {
      const idx = Math.floor(randomFn() * walls.length);
      const [fx, fy, tx, ty] = walls[idx];
      walls.splice(idx, 1);

      if (maze[ty][tx] === 1) {
        maze[ty][tx] = 0;
        maze[fy + (ty - fy) / 2][fx + (tx - fx) / 2] = 0;
        addWalls(tx, ty);
      }
    }

    return maze;
  }
}
