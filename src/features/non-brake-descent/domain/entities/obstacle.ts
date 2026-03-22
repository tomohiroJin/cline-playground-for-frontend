import { Obstacle } from '../../types';

/** 障害物を生成する */
export const createObstacle = (
  type: Obstacle['t'],
  pos: number,
  extras: Partial<Obstacle> = {}
): Obstacle => ({
  t: type,
  pos,
  passed: false,
  ...extras,
});
