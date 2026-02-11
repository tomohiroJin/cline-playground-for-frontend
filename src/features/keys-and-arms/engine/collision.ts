export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * AABB 判定
 */
export function isRectColliding(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * 1次元レーン一致判定
 */
export function isLaneHit(playerLane: number, hazardLane: number): boolean {
  return playerLane === hazardLane;
}

/**
 * 指定値の範囲包含判定
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
