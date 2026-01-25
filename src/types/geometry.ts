/**
 * 共通幾何学型定義モジュール
 * 座標系とグリッド系を明確に区別
 */

/**
 * 2D座標系の点（X/Y座標）
 * ゲームエンティティの位置など、連続座標に使用
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * グリッド系の位置（行/列）
 * パズルのピース位置など、離散グリッドに使用
 */
export interface GridPosition {
  row: number;
  col: number;
}

/**
 * 2Dベクトル（方向と大きさを持つ）
 * Point2Dと同じ構造だが意味が異なる
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * 速度成分
 */
export interface Velocity2D {
  vx: number;
  vy: number;
}

/**
 * 位置と速度を持つエンティティの基本型
 */
export interface MovingEntity extends Point2D, Velocity2D {}
