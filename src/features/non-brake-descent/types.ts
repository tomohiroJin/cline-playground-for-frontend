import { EffectType, GameState, ObstacleType, RampType, SpeedRank } from './constants';
import { Ranks } from './constants';

export type GameStateValue = (typeof GameState)[keyof typeof GameState];
export type ObstacleTypeValue = (typeof ObstacleType)[keyof typeof ObstacleType];
export type RampTypeValue = (typeof RampType)[keyof typeof RampType];
export type SpeedRankValue = (typeof SpeedRank)[keyof typeof SpeedRank];
export type EffectTypeValue = (typeof EffectType)[keyof typeof EffectType];
export type RampDirection = 1 | -1;

export type RankConfig = (typeof Ranks)[number];

export type Player = {
  x: number;
  y: number;
  ramp: number;
  vx: number;
  vy: number;
  jumping: boolean;
  jumpCD: number;
  onGround: boolean;
};

export type Obstacle = {
  t: ObstacleTypeValue;
  pos: number;
  passed: boolean;
  phase?: number;
  moveDir?: number;
  walkPos?: number;
  vSpeed?: number;
};

export type Ramp = {
  dir: RampDirection;
  obs: Obstacle[];
  type: RampTypeValue;
  isGoal: boolean;
};

export type Particle = {
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
};

export type ScorePopup = {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
};

export type NearMissEffect = {
  x: number;
  y: number;
  life: number;
  scale: number;
};

export type Cloud = {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
};

export type Building = {
  x: number;
  width: number;
  height: number;
  windows: number;
  color: string;
};

export type DeathType = 'fall' | 'rock' | 'enemy';

export type DeathState = {
  type: DeathType;
  frame: number;
  fast: boolean;
};

export type ClearAnim = {
  phase: 0 | 1 | 2;
  frame: number;
};

export type EffectState = {
  type?: EffectTypeValue;
  timer: number;
};

export type InputState = {
  left: boolean;
  right: boolean;
  accel: boolean;
  jump: boolean;
};

export type CollisionCheckResult = {
  ground: boolean;
  air: boolean;
  hit: boolean;
  nearMiss: boolean;
  dist: number;
};

export type RampGeometry = {
  lx: number;
  rx: number;
  ty: number;
  by: number;
  midY?: number;
};

export type TouchKeys = {
  left: boolean;
  right: boolean;
  accel: boolean;
  jump: boolean;
};

export type ScoreCalc = {
  base: number;
  bonus: number;
};
