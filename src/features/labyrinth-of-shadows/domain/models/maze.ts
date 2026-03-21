/**
 * Maze モデル
 * 迷路データの保持と判定を行う純粋関数群
 */
import { distance } from '../../utils';

/** 指定座標が歩行可能か判定する */
export const isWalkable = (maze: number[][], x: number, y: number): boolean => {
  const my = Math.floor(y);
  const mx = Math.floor(x);
  return maze[my]?.[mx] === 0;
};

/** 2点間に視線が通るか判定する */
export const hasLineOfSight = (
  maze: number[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean => {
  const d = distance(x1, y1, x2, y2);
  const steps = Math.ceil(d * 10);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (!isWalkable(maze, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
};

/** 空きセルのリストを返す（オプションで乱数関数を DI 可能） */
export const getEmptyCells = (
  maze: number[][],
  randomFn: () => number = Math.random
): { x: number; y: number }[] => {
  const cells: { x: number; y: number }[] = [];
  for (let y = 1; y < maze.length - 1; y++) {
    for (let x = 1; x < maze[0].length - 1; x++) {
      if (maze[y][x] === 0) cells.push({ x, y });
    }
  }
  return cells.sort(() => randomFn() - 0.5);
};
