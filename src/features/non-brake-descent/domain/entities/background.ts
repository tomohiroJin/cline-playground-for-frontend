import { Config } from '../../config';
import { MathUtils } from '../math-utils';
import { Building, Cloud } from '../../types';

/** 雲を生成する */
export const createCloud = (): Cloud => ({
  x: Config.screen.width + MathUtils.randomRange(0, 100),
  y: MathUtils.randomRange(0, Config.screen.height * 0.4),
  size: MathUtils.randomRange(30, 80),
  speed: MathUtils.randomRange(0.3, 0.8),
  opacity: MathUtils.randomRange(0.1, 0.3),
});

/** ビルを生成する */
export const createBuilding = (x: number): Building => {
  const width = MathUtils.randomRange(30, 90);
  const windows = Math.floor(MathUtils.randomRange(3, 8));
  const cols = Math.floor(width / 12);
  return {
    x,
    width,
    height: MathUtils.randomRange(100, 300),
    windows,
    color: `hsl(${MathUtils.randomRange(200, 240)}, 30%, ${MathUtils.randomRange(15, 25)}%)`,
    windowLit: Array.from({ length: windows }, () =>
      Array.from({ length: cols }, () => MathUtils.randomBool(0.7))
    ),
  };
};
