import { RampType } from '../../constants';
import { Obstacle, Ramp } from '../../types';

/** ランプを生成する */
export const createRamp = (
  dir: Ramp['dir'],
  obs: Obstacle[],
  type: (typeof RampType)[keyof typeof RampType],
  isGoal: boolean
): Ramp => ({
  dir,
  obs,
  type,
  isGoal,
});
