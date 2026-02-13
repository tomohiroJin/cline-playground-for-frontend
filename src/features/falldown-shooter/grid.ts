// 落ち物シューティング グリッド管理モジュール

import { CONFIG } from './constants';

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
};
