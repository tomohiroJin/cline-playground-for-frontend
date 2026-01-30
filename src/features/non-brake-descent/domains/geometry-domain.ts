import { Config } from '../config';
import { RampColors, RampType } from '../constants';
import { Ramp, RampGeometry } from '../types';
import { MathUtils } from './math-utils';

export const GeometryDomain = {
  getRampGeometry: (ramp: Ramp, width: number, height: number): RampGeometry => {
    const margin = 20;
    const lx = ramp.dir === 1 ? margin : margin + 10;
    const rx = ramp.dir === 1 ? width - margin - 10 : width - margin;
    const slopes = {
      [RampType.STEEP]: {
        ty: ramp.dir === 1 ? 0 : height * 0.75,
        by: ramp.dir === 1 ? height * 0.75 : 0,
        midY: undefined,
      },
      [RampType.GENTLE]: {
        ty: ramp.dir === 1 ? height * 0.25 : height * 0.45,
        by: ramp.dir === 1 ? height * 0.45 : height * 0.25,
        midY: undefined,
      },
      [RampType.V_SHAPE]: { ty: height * 0.15, by: height * 0.15, midY: height * 0.55 },
      [RampType.NORMAL]: {
        ty: ramp.dir === 1 ? height * 0.1 : height * 0.55,
        by: ramp.dir === 1 ? height * 0.55 : height * 0.1,
        midY: undefined,
      },
    } as const;
    const slope = slopes[ramp.type] || slopes[RampType.NORMAL];
    return { lx, rx, ...slope };
  },
  getSlopeY: (x: number, geo: RampGeometry, type: Ramp['type']): number => {
    const t = MathUtils.clamp((x - geo.lx) / (geo.rx - geo.lx), 0, 1);
    if (type === RampType.V_SHAPE && geo.midY !== undefined) {
      return t < 0.5
        ? MathUtils.lerp(geo.ty, geo.midY, t * 2)
        : MathUtils.lerp(geo.midY, geo.by, (t - 0.5) * 2);
    }
    return MathUtils.lerp(geo.ty, geo.by, t);
  },
  getObstacleX: (obs: { pos: number }, ramp: Pick<Ramp, 'dir'>, width: number): number =>
    ramp.dir === 1 ? 40 + obs.pos * (width - 80) : width - 40 - obs.pos * (width - 80),
  getRampColor: (index: number) => RampColors[Math.floor(index / 15) % RampColors.length],
  isInViewport: (ry: number, rampH: number, screenH: number): boolean =>
    ry > -rampH - 20 && ry < screenH + 20,
} as const;

export const getRampHeight = (): number => Config.ramp.height;
