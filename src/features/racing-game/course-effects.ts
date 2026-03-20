// コース環境効果モジュール
// 移行期間中: domain/track/course-effect.ts へ委譲

import type { CourseEffect } from './types';
import {
  getCourseEffect,
  getSegmentFriction,
  getSegmentSpeedModifier,
} from './domain/track/course-effect';

export const getEffect = getCourseEffect;
export const getFriction = getSegmentFriction;
export const getSpeedModifier = getSegmentSpeedModifier;

export const CourseEffects = {
  getEffect,
  getFriction,
  getSpeedModifier,
};

export type { CourseEffect };
