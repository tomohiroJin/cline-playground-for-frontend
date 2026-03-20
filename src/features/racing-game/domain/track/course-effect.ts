// コース環境効果（純粋関数・副作用なし）

import type { CourseEffect, CourseDecoType } from './types';

/** 各コースの環境効果データ定義 */
const COURSE_EFFECTS: Record<CourseDecoType, CourseEffect> = {
  forest: {
    name: 'Forest',
    frictionMultiplier: 0.85,
    driftAngleBonus: 0,
    speedModifier: 0,
    visualEffect: 'leaves',
    segmentBased: true,
  },
  city: {
    name: 'City',
    frictionMultiplier: 0.90,
    driftAngleBonus: 0.1,
    speedModifier: 0,
    visualEffect: 'rain',
    segmentBased: false,
  },
  mountain: {
    name: 'Mountain',
    frictionMultiplier: 1.0,
    driftAngleBonus: 0,
    speedModifier: 0.05,
    visualEffect: 'none',
    segmentBased: true,
  },
  beach: {
    name: 'Beach',
    frictionMultiplier: 0.70,
    driftAngleBonus: 0,
    speedModifier: 0,
    visualEffect: 'none',
    segmentBased: true,
  },
  night: {
    name: 'Night',
    frictionMultiplier: 1.0,
    driftAngleBonus: 0,
    speedModifier: 0,
    visualEffect: 'vignette',
    segmentBased: false,
  },
  snow: {
    name: 'Snow',
    frictionMultiplier: 0.75,
    driftAngleBonus: 0.2,
    speedModifier: 0,
    visualEffect: 'snow',
    segmentBased: false,
  },
};

/** デフォルトの環境効果 */
const DEFAULT_EFFECT: CourseEffect = {
  name: 'Default',
  frictionMultiplier: 1.0,
  driftAngleBonus: 0,
  speedModifier: 0,
  visualEffect: 'none',
  segmentBased: false,
};

/** デコタイプからコース効果を取得 */
export const getCourseEffect = (deco: CourseDecoType | string): CourseEffect => {
  return (COURSE_EFFECTS as Record<string, CourseEffect>)[deco] ?? DEFAULT_EFFECT;
};

/** セグメントごとの摩擦係数を計算 */
export const getSegmentFriction = (
  effect: CourseEffect,
  segment: number,
  totalSegments: number,
  dist: number,
  trackWidth: number,
): number => {
  let friction = effect.frictionMultiplier;

  if (effect.segmentBased) {
    switch (effect.name) {
      case 'Forest': {
        friction = segment % 3 === 0 ? 0.85 : 1.0;
        break;
      }
      case 'Mountain': {
        const half = Math.floor(totalSegments / 2);
        friction = segment < half ? 0.95 : 1.05;
        break;
      }
      case 'Beach': {
        const outerEdge = trackWidth * 0.8;
        friction = dist > outerEdge ? 0.70 : 1.0;
        break;
      }
    }
  }

  return friction;
};

/** セグメントごとの速度修正を計算 */
export const getSegmentSpeedModifier = (
  effect: CourseEffect,
  segment: number,
  totalSegments: number,
): number => {
  if (effect.name === 'Mountain' && effect.segmentBased) {
    const half = Math.floor(totalSegments / 2);
    return segment < half ? -effect.speedModifier : effect.speedModifier;
  }
  return 0;
};
