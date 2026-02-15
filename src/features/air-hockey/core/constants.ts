import { CanvasSize, SizeConfig } from './types';

export const SIZE_CONFIGS: Record<CanvasSize, SizeConfig> = {
  standard: { width: 300, height: 600, scale: 1 },
  large: { width: 450, height: 900, scale: 1.5 },
};

export type GameConstants = {
  CANVAS: { WIDTH: number; HEIGHT: number };
  SIZES: { MALLET: number; PUCK: number; ITEM: number };
  PHYSICS: { FRICTION: number; MIN_SPEED: number; MAX_POWER: number };
  TIMING: { ITEM_SPAWN: number; GOAL_EFFECT: number; FLASH: number; HELP_TIMEOUT: number; FEVER_TRIGGER: number; FEVER_INTERVAL: number };
  CPU: { easy: number; normal: number; hard: number };
  FEVER: { MAX_EXTRA_PUCKS: number };
};

export const getConstants = (size: CanvasSize = 'standard'): GameConstants => {
  const cfg = SIZE_CONFIGS[size];
  return {
    CANVAS: { WIDTH: cfg.width, HEIGHT: cfg.height },
    SIZES: {
      MALLET: Math.round(28 * cfg.scale),
      PUCK: Math.round(14 * cfg.scale),
      ITEM: Math.round(16 * cfg.scale),
    },
    PHYSICS: { FRICTION: 0.998, MIN_SPEED: 1.5, MAX_POWER: 12 },
    TIMING: { ITEM_SPAWN: 6000, GOAL_EFFECT: 1500, FLASH: 500, HELP_TIMEOUT: 5000, FEVER_TRIGGER: 15000, FEVER_INTERVAL: 10000 },
    CPU: { easy: 1.5, normal: 3.5, hard: 6 },
    FEVER: { MAX_EXTRA_PUCKS: 2 },
  };
};

// 後方互換性のためのデフォルト定数
export const CONSTANTS = getConstants('standard');
