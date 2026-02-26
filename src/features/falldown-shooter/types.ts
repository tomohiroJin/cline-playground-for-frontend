// 落ち物シューティング 型定義

export type PowerType = 'triple' | 'pierce' | 'bomb' | 'slow' | 'downshot';
export type SkillType = 'laser' | 'blast' | 'clear';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'clear' | 'over' | 'ending';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface TimingConfig {
  base: number;
  min: number;
  decay: number;
  stageMult: number;
}

export interface Config {
  grid: { width: number; height: number; cellSize: number };
  timing: {
    spawn: TimingConfig;
    fall: TimingConfig;
    bullet: { speed: number; cooldown: number };
  };
  score: { block: number; line: number };
  stages: number[];
  powerUp: {
    chance: number;
    duration: Record<string, number>;
  };
  skill: { chargeRate: number; maxCharge: number };
  dangerLine: number;
  demo: { idleTimeout: number; slideInterval: number };
  spawn: { safeZone: number; maxAttempts: number };
}

export interface PowerTypeInfo {
  color: string;
  icon: string;
  name: string;
  desc: string;
}

export interface SkillInfo {
  icon: string;
  name: string;
  desc: string;
  color: string;
  key: string;
}

export interface Cell {
  x: number;
  y: number;
}

export interface BlockData {
  id: string;
  x: number;
  y: number;
  shape: number[][];
  color: string;
  power: PowerType | null;
}

export interface BulletData {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  pierce: boolean;
}

export interface GameState {
  grid: (string | null)[][];
  blocks: BlockData[];
  bullets: BulletData[];
  score: number;
  stage: number;
  lines: number;
  linesNeeded: number;
  playerY: number;
  time: number;
}

export interface ExplosionData {
  id: string;
  x: number;
  y: number;
}

export interface ParticleData {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export interface Powers {
  triple: boolean;
  pierce: boolean;
  slow: boolean;
  downshot: boolean;
}

export interface CollisionTarget {
  type: 'grid' | 'block';
  blockId?: string;
  x: number;
  y: number;
  power?: PowerType | null;
}

export interface BulletProcessResult {
  bullets: BulletData[];
  blocks: BlockData[];
  grid: (string | null)[][];
  score: number;
  hitCount: number;
  pendingBombs: { x: number; y: number }[];
}

export interface DemoSlide {
  title: string;
  content: string[];
}

export interface KeyboardHandlers {
  left: () => void;
  right: () => void;
  fire: () => void;
  skill1: () => void;
  skill2: () => void;
  skill3: () => void;
  pause?: () => void;
}

export interface DifficultyConfig {
  label: string;
  color: string;
  spawnMultiplier: number;
  fallMultiplier: number;
  scoreMultiplier: number;
  powerUpChance: number;
  skillChargeMultiplier: number;
}
