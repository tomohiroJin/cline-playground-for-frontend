// Racing Game 型定義

export type Point = { x: number; y: number };
export type Checkpoint = Point & { idx: number };
export type StartLine = {
  cx: number;
  cy: number;
  px: number;
  py: number;
  dx: number;
  dy: number;
  len: number;
};
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
};
export type Spark = { x: number; y: number; vx: number; vy: number; color: string; life: number };
export type Confetti = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  rotSpd: number;
};

export interface Course {
  name: string;
  bg: string;
  ground: string;
  deco: 'forest' | 'city' | 'mountain' | 'beach' | 'night' | 'snow';
  pts: Array<[number, number]>;
  points: Point[];
  checkpoints: number[];
  checkpointCoords: Checkpoint[];
}

export interface Player {
  x: number;
  y: number;
  angle: number;
  color: string;
  name: string;
  isCpu: boolean;
  lap: number;
  checkpointFlags: number;
  lapTimes: number[];
  lapStart: number;
  speed: number;
  wallStuck: number;
  progress: number;
  lastSeg: number;
}

export type Decoration = { x: number; y: number; variant: number };

export interface GameResults {
  winnerName: string;
  winnerColor: string;
  times: { p1: number; p2: number };
  fastest: number;
}
