// Track ドメイン型定義

import type { Point, Checkpoint } from '../shared/types';

export interface TrackInfo {
  readonly pt: Point;
  readonly seg: number;
  readonly dist: number;
  readonly onTrack: boolean;
  readonly dir: number;
}

export interface StartLine {
  readonly cx: number;
  readonly cy: number;
  readonly px: number;
  readonly py: number;
  readonly dx: number;
  readonly dy: number;
  readonly len: number;
}

/** コース装飾タイプ */
export type CourseDecoType = 'forest' | 'city' | 'mountain' | 'beach' | 'night' | 'snow';

export interface Course {
  name: string;
  bg: string;
  ground: string;
  deco: CourseDecoType;
  pts: Array<[number, number]>;
  points: Point[];
  checkpoints: number[];
  checkpointCoords: Checkpoint[];
}

export interface CourseEffect {
  name: string;
  frictionMultiplier: number;
  driftAngleBonus: number;
  speedModifier: number;
  visualEffect: 'none' | 'rain' | 'leaves' | 'snow' | 'vignette';
  segmentBased: boolean;
}
