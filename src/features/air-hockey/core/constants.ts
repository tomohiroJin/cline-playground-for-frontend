export type GameConstants = {
  CANVAS: { WIDTH: number; HEIGHT: number };
  SIZES: { MALLET: number; PUCK: number; ITEM: number };
  PHYSICS: { FRICTION: number; MIN_SPEED: number; MAX_POWER: number };
  TIMING: { ITEM_SPAWN: number; GOAL_EFFECT: number; FLASH: number; HELP_TIMEOUT: number; FEVER_TRIGGER: number; FEVER_INTERVAL: number; OBSTACLE_RESPAWN: number };
  CPU: { easy: number; normal: number; hard: number };
  FEVER: { MAX_EXTRA_PUCKS: number };
  COMEBACK: { THRESHOLD: number; MALLET_BONUS: number; GOAL_REDUCTION: number };
};

/** マレットと壁の間のマージン（px） */
export const MALLET_WALL_MARGIN = 5;
/** マレットと中央ラインの間のマージン（px） */
export const MALLET_CENTER_LINE_MARGIN = 10;

// 内部解像度 450x900 固定（CSS でビューポートに応答的にスケーリング）
export const CONSTANTS: GameConstants = {
  CANVAS: { WIDTH: 450, HEIGHT: 900 },
  SIZES: { MALLET: 42, PUCK: 21, ITEM: 24 },
  PHYSICS: { FRICTION: 0.998, MIN_SPEED: 1.5, MAX_POWER: 12 },
  TIMING: { ITEM_SPAWN: 6000, GOAL_EFFECT: 1500, FLASH: 500, HELP_TIMEOUT: 5000, FEVER_TRIGGER: 15000, FEVER_INTERVAL: 10000, OBSTACLE_RESPAWN: 5000 },
  CPU: { easy: 1.5, normal: 3.5, hard: 6 },
  FEVER: { MAX_EXTRA_PUCKS: 2 },
  COMEBACK: { THRESHOLD: 3, MALLET_BONUS: 0.1, GOAL_REDUCTION: 0.1 },
};
