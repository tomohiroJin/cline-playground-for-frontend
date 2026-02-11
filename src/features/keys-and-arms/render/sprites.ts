export type SpriteMatrix = number[][];

export const HERO_IDLE: SpriteMatrix = [
  [0, 1, 1, 0],
  [1, 1, 1, 1],
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
];

export const HERO_ACT: SpriteMatrix = [
  [0, 1, 1, 0],
  [1, 1, 1, 1],
  [0, 1, 1, 0],
  [1, 1, 1, 1],
  [1, 0, 0, 1],
];

export const ENEMY: SpriteMatrix = [
  [1, 0, 0, 1],
  [0, 1, 1, 0],
  [1, 1, 1, 1],
  [0, 1, 1, 0],
];
