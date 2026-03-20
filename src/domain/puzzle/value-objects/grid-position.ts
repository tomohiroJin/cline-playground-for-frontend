/**
 * GridPosition 値オブジェクト
 *
 * グリッド上の位置を表す不変の値オブジェクト。
 * バリデーション付きファクトリ関数で生成する。
 */
import { assert } from '../../../shared/utils/assert';
import { GridPosition } from '../../../types/geometry';

/**
 * バリデーション付き GridPosition ファクトリ
 *
 * @param row 行（0-indexed）
 * @param col 列（0-indexed）
 * @param division 分割数
 * @returns 凍結された GridPosition
 */
export const createGridPosition = (
  row: number,
  col: number,
  division: number
): GridPosition => {
  assert(Number.isInteger(row) && row >= 0 && row < division, `row must be integer in [0, ${division})`);
  assert(Number.isInteger(col) && col >= 0 && col < division, `col must be integer in [0, ${division})`);
  return Object.freeze({ row, col });
};

/**
 * 2つの位置が等しいか判定する
 */
export const isPositionEqual = (a: GridPosition, b: GridPosition): boolean =>
  a.row === b.row && a.col === b.col;

/**
 * 2つの位置が隣接しているか判定する（上下左右のみ）
 */
export const isAdjacent = (a: GridPosition, b: GridPosition): boolean => {
  const rowDiff = Math.abs(a.row - b.row);
  const colDiff = Math.abs(a.col - b.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

/**
 * 指定位置の隣接位置リストを取得する（グリッド境界を考慮）
 *
 * 返り値は freeze しない（createGridPosition とは異なり、バリデーション済みファクトリではない）。
 * 呼び出し側で変更する必要がある場合に備えてミュータブルなオブジェクトを返す。
 */
export const getAdjacentPositions = (
  position: GridPosition,
  division: number
): GridPosition[] => {
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  return directions
    .map(d => ({ row: position.row + d.row, col: position.col + d.col }))
    .filter(p => p.row >= 0 && p.row < division && p.col >= 0 && p.col < division);
};
