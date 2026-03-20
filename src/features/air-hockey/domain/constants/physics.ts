/**
 * 物理演算定数（core/constants.ts から分離）
 */
export const PHYSICS_CONSTANTS = Object.freeze({
  CANVAS_WIDTH: 450,
  CANVAS_HEIGHT: 900,
  PUCK_RADIUS: 21,
  MALLET_RADIUS: 42,
  ITEM_RADIUS: 24,
  FRICTION: 0.998,
  MIN_SPEED: 1.5,
  MAX_POWER: 12,
  /** 反射時の反発係数（0-1、1で完全弾性衝突） */
  RESTITUTION: 0.9,
  /** 壁衝突時の速度減衰率 */
  WALL_DAMPING: 0.95,
  /** 壁との衝突判定マージン（px） */
  WALL_MARGIN: 5,
});

export type PhysicsConstants = typeof PHYSICS_CONSTANTS;
