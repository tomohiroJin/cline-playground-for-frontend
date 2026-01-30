import { CollisionDomain } from './collision-domain';
import { SpeedDomain } from './speed-domain';
import { GeometryDomain } from './geometry-domain';
import { Obstacle, RampDirection } from '../types';
import { ObstacleType } from '../constants';

export const DangerDomain = {
  calcLevel: (
    obs: Obstacle[],
    px: number,
    dir: RampDirection,
    speed: number,
    width: number
  ): number =>
    obs.reduce((max, obstacle) => {
      if (!CollisionDomain.isActive(obstacle) || obstacle.t === ObstacleType.SCORE) return max;
      const ox = GeometryDomain.getObstacleX(obstacle, { dir }, width);
      const dist = dir === 1 ? ox - px : px - ox;
      if (dist > 0 && dist < 100) {
        return Math.max(max, (1 - dist / 100) * SpeedDomain.getNormalized(speed));
      }
      return max;
    }, 0),
} as const;
