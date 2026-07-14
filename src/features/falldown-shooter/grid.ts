// 落ち物シューティング グリッド管理モジュール

import { CONFIG } from './constants';
import type { Cell } from './types';

export const Grid = {
  create: (w: number, h: number): (string | null)[][] =>
    Array.from({ length: h }, () => Array(w).fill(null)),

  clone: (grid: (string | null)[][]): (string | null)[][] => grid.map(row => [...row]),

  findHighestRow: (grid: (string | null)[][]): number => {
    const idx = grid.findIndex(row => row.some(c => c !== null));
    return idx < 0 ? grid.length : idx;
  },

  clearRow: (grid: (string | null)[][], rowIndex: number): (string | null)[][] => {
    const newGrid = Grid.clone(grid);
    newGrid.splice(rowIndex, 1);
    newGrid.unshift(Array(grid[0].length).fill(null));
    return newGrid;
  },

  clearFullLines: (grid: (string | null)[][]): { grid: (string | null)[][]; cleared: number } => {
    const remaining = grid.filter(row => !row.every(c => c !== null));
    const cleared = grid.length - remaining.length;
    const empty = Array.from({ length: cleared }, () => Array(grid[0].length).fill(null));
    return { grid: [...empty, ...remaining], cleared };
  },

  setCell: (
    grid: (string | null)[][],
    x: number,
    y: number,
    value: string | null
  ): (string | null)[][] => {
    if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
      const newGrid = Grid.clone(grid);
      newGrid[y][x] = value;
      return newGrid;
    }
    return grid;
  },

  clearColumn: (
    grid: (string | null)[][],
    colX: number
  ): { grid: (string | null)[][]; score: number } => {
    const newGrid = Grid.clone(grid);
    let score = 0;
    for (let y = 0; y < newGrid.length; y++) {
      if (newGrid[y][colX]) {
        newGrid[y][colX] = null;
        score += CONFIG.score.block;
      }
    }
    return { grid: newGrid, score };
  },

  /** 各列の非 null セルを順序を保ったまま下端へ詰める（列独立の重力） */
  applyColumnGravity: (grid: (string | null)[][]): (string | null)[][] => {
    const height = grid.length;
    const width = grid[0].length;
    const newGrid = Grid.create(width, height);

    for (let x = 0; x < width; x++) {
      const stacked: (string | null)[] = [];
      for (let y = 0; y < height; y++) {
        if (grid[y][x] !== null) stacked.push(grid[y][x]);
      }
      // stacked を列の下端から順に配置（上下の順序を維持）
      for (let i = 0; i < stacked.length; i++) {
        newGrid[height - stacked.length + i][x] = stacked[i];
      }
    }

    return newGrid;
  },

  /** 全セルが非 null の行インデックスを昇順で返す */
  findFullRows: (grid: (string | null)[][]): number[] => {
    const rows: number[] = [];
    grid.forEach((row, y) => {
      if (row.every(c => c !== null)) rows.push(y);
    });
    return rows;
  },

  /** 指定行を全 null にした新グリッドを返す（行シフトはしない） */
  nullifyRows: (grid: (string | null)[][], rows: number[]): (string | null)[][] => {
    const rowSet = new Set(rows);
    return grid.map((row, y) => (rowSet.has(y) ? Array(row.length).fill(null) : [...row]));
  },

  /** 4近傍で連結した同色グループのうち size 以上のものに属する全セルを返す（純粋） */
  findColorGroups: (grid: (string | null)[][], minSize: number): Cell[] => {
    const height = grid.length;
    const width = grid[0].length;
    const visited = Array.from({ length: height }, () => Array<boolean>(width).fill(false));
    const result: Cell[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = grid[y][x];
        if (color === null || visited[y][x]) continue;

        // 同色を 4 近傍で塗りつぶし探索（スタックベース）
        const group: Cell[] = [];
        const stack: Cell[] = [{ x, y }];
        visited[y][x] = true;

        while (stack.length > 0) {
          const cell = stack.pop() as Cell;
          group.push(cell);
          const neighbors: Cell[] = [
            { x: cell.x + 1, y: cell.y },
            { x: cell.x - 1, y: cell.y },
            { x: cell.x, y: cell.y + 1 },
            { x: cell.x, y: cell.y - 1 },
          ];
          for (const n of neighbors) {
            if (n.x < 0 || n.x >= width || n.y < 0 || n.y >= height) continue;
            if (visited[n.y][n.x]) continue;
            if (grid[n.y][n.x] === color) {
              visited[n.y][n.x] = true;
              stack.push(n);
            }
          }
        }

        if (group.length >= minSize) result.push(...group);
      }
    }

    return result;
  },

  /** 指定セルを null にした新グリッドを返す（純粋・元不変） */
  removeCells: (grid: (string | null)[][], cells: Cell[]): (string | null)[][] => {
    const newGrid = Grid.clone(grid);
    for (const { x, y } of cells) {
      if (y >= 0 && y < newGrid.length && x >= 0 && x < newGrid[0].length) {
        newGrid[y][x] = null;
      }
    }
    return newGrid;
  },
};
