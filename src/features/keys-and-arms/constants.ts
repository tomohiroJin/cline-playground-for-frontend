import type { Stage, VirtualKey } from './types';

export const CANVAS_WIDTH = 440;
export const CANVAS_HEIGHT = 340;

export const STORAGE_KEY = 'game_score_keys_and_arms';
export const LEGACY_STORAGE_KEY = 'kaG';

export const STAGE_ORDER: Stage[] = ['cave', 'grass', 'boss'];

export const ACTION_KEYS: readonly VirtualKey[] = ['z', ' ', 'enter'];

export const KEYBOARD_KEYS: readonly VirtualKey[] = [
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'z',
  ' ',
  'enter',
  'escape',
];

export const INITIAL_HP = 3;
export const CAVE_KEY_TARGET = 3;
export const BOSS_PEDESTAL_TARGET = 6;

export const resolveBeatLength = (loop: number): number => {
  if (loop <= 3) {
    return Math.max(20, 34 - (loop - 1) * 7);
  }
  return Math.max(14, 20 - (loop - 3) * 2);
};
