import { ObstacleType } from '../../constants';
import { Obstacle, RampDirection } from '../../types';
import { CollisionDomain } from './collision-service';
import { GeometryDomain } from './geometry-service';
import { SpeedDomain } from './speed-service';

/** 危険度計算ドメインサービス */
export const DangerDomain = {
  /** 前方の障害物から危険度（0〜1）を計算する */
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
