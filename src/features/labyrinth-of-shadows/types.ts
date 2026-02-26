import { CONFIG, CONTENT } from './constants';

// ==================== TYPES ====================
export type Difficulty = keyof typeof CONFIG.difficulties;
export type EntityType = keyof typeof CONTENT.items;
export type SoundName = keyof typeof CONTENT.sounds;
export type EnemyType = 'wanderer' | 'chaser' | 'teleporter';

export interface Entity {
  x: number;
  y: number;
}

export interface Player extends Entity {
  angle: number;
  stamina: number;
}

export interface Enemy extends Entity {
  dir: number;
  active: boolean;
  actTime: number;
  lastSeenX: number;
  lastSeenY: number;
  type: EnemyType;
  path: { x: number; y: number }[];
  pathTime: number;
  teleportCooldown: number;
}

export interface Item extends Entity {
  type: EntityType;
  got: boolean;
}

export interface Sprite extends Entity {
  type: string;
  emoji: string;
  name: string;
  color: string;
  bgColor: string;
  sc?: number;
  glow?: boolean;
  bob?: boolean;
  pulse?: boolean;
  isEnemy?: boolean;
}

export interface GameState {
  maze: number[][];
  items: Item[];
  enemies: Enemy[];
  difficulty: Difficulty;
  player: Player;
  exit: Entity;
  keys: number;
  reqKeys: number;
  time: number;
  lives: number;
  maxLives: number;
  hiding: boolean;
  energy: number;
  invince: number;
  sprinting: boolean;
  speedBoost: number;
  eSpeed: number;
  gTime: number;
  lastT: number;
  timers: { footstep: number; enemySound: number; heartbeat: number };
  msg: string | null;
  msgTimer: number;
  score: number;
  combo: number;
  lastKeyTime: number;
  explored: Record<string, boolean>;
}

export interface HUDData {
  keys: number;
  req: number;
  maxL: number;
  lives: number;
  stamina: number;
  time: number;
  score: number;
  eNear: number;
  hide: boolean;
  energy: number;
  highScore: number;
}
