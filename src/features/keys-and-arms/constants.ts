export const CANVAS_WIDTH = 440;
export const CANVAS_HEIGHT = 340;

export const TICK_RATE = 30;
export const TICK_MS = 1000 / TICK_RATE;

export const DEFAULT_HP = 3;
export const CHEAT_HP = 20;

export const SCORE_STORAGE_KEY = 'game_score_keys_and_arms';
export const LEGACY_SCORE_STORAGE_KEY = 'kaG';

export const TRANSITION_DURATION_TICKS = 45;

export const BASE_HAZARD_CYCLE = 6;
export const BASE_MOVE_WINDOW = 12;

export const SCORE_TABLE = {
  CAVE_KEY: 300,
  CAVE_SET: 500,
  CAVE_CLEAR: 2000,
  GRASS_KILL: 50,
  GRASS_SLASH: 100,
  GRASS_COMBO: 200,
  GRASS_CLEAR: 3000,
  BOSS_GEM: 500,
  BOSS_COUNTER: 300,
  BOSS_SHIELD: 200,
  BOSS_CLEAR: 5000,
  NO_DAMAGE_BONUS: 10000,
} as const;
