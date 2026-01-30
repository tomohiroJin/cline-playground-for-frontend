import { Config } from '../config';
import { ObstacleType } from '../constants';
import { CollisionCheckResult, Obstacle } from '../types';

const dangerousTypes: Obstacle['t'][] = [
  ObstacleType.HOLE_S,
  ObstacleType.HOLE_L,
  ObstacleType.ROCK,
  ObstacleType.ENEMY,
  ObstacleType.ENEMY_V,
];

export const CollisionDomain = {
  check: (px: number, ox: number, jumping: boolean, jumpY: number): CollisionCheckResult => {
    const dist = Math.abs(px - ox);
    const {
      groundThreshold: gt,
      airThreshold: at,
      airYThreshold: ayt,
      nearMissThreshold: nmt,
    } = Config.collision;
    const ground = dist < gt && !jumping;
    const air = dist < at && jumping && jumpY > ayt;
    const nearMiss = dist < nmt && dist >= gt && !jumping;
    return { ground, air, hit: ground || air, nearMiss, dist };
  },
  isDangerous: (t: Obstacle['t']): boolean => dangerousTypes.includes(t),
  isActive: (obs: Obstacle): boolean => obs.t !== ObstacleType.TAKEN && obs.t !== ObstacleType.DEAD,
} as const;
