// Racing Game ユーティリティ関数
// 移行期間中: 新モジュール domain/shared/math-utils.ts へ委譲

import {
  clamp,
  normalizeAngle,
  distance,
  randomInt,
  randomRange,
  formatTime,
  safeIndex,
  min,
} from './domain/shared/math-utils';

export const Utils = {
  clamp,
  sum: (arr: number[]) =>
    Array.isArray(arr) && arr.length > 0 ? arr.reduce((a, b) => a + b, 0) : 0,
  min,
  randInt: randomInt,
  randRange: randomRange,
  randChoice: <T,>(arr: readonly T[]) =>
    Array.isArray(arr) && arr.length > 0 ? arr[randomInt(arr.length)] : null,
  normalizeAngle,
  formatTime,
  safeIndex,
  dist: distance,
};
