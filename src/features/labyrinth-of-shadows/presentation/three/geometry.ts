/**
 * 3Dシーンの幾何ヘルパー。
 * グリッド座標(maze[y][x], x=列/y=行) → ワールド座標(X=x, Y=up, Z=y) の規約に基づく。
 */

/** 1セルのワールドサイズ */
export const CELL_SIZE = 1;
/** 壁の高さ */
export const WALL_HEIGHT = 3;
/** カメラ（プレイヤーの目線）の高さ */
export const EYE_HEIGHT = 1.4;

/** 壁セルのワールド上の格子位置（X=x, Z=z に対応） */
export interface WallCell {
  readonly x: number;
  readonly z: number;
}

/** 迷路の非0セル（壁）を列挙する */
export function collectWallCells(maze: number[][]): WallCell[] {
  const cells: WallCell[] = [];
  for (let y = 0; y < maze.length; y++) {
    const row = maze[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== 0) cells.push({ x, z: y });
    }
  }
  return cells;
}

/**
 * プレイヤーの向き angle（+X方向が0, cos/sin基準）から
 * three カメラの Y軸ヨー角を求める。rotation.order='YXZ' を前提。
 * 導出: 望むワールド前方 (cos angle, 0, sin angle) を
 * three 既定の前方 (-sinφ, 0, -cosφ) に一致させると φ = -angle - π/2。
 */
export function cameraYaw(angle: number): number {
  return -angle - Math.PI / 2;
}
