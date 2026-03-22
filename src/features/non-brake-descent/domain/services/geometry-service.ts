import { Config } from '../../config';
import { RampColors, RampType } from '../../constants';
import { Ramp, RampGeometry } from '../../types';
import { MathUtils } from '../math-utils';

/** ランプ形状・座標計算ドメインサービス */
export const GeometryDomain = {
  /** ランプのジオメトリ情報を取得する */
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
  /** 指定X座標でのスロープのY座標を取得する */
  getSlopeY: (x: number, geo: RampGeometry, type: Ramp['type']): number => {
    const t = MathUtils.clamp((x - geo.lx) / (geo.rx - geo.lx), 0, 1);
    if (type === RampType.V_SHAPE && geo.midY !== undefined) {
      return t < 0.5
        ? MathUtils.lerp(geo.ty, geo.midY, t * 2)
        : MathUtils.lerp(geo.midY, geo.by, (t - 0.5) * 2);
    }
    return MathUtils.lerp(geo.ty, geo.by, t);
  },
  /** 障害物のX座標を取得する */
  getObstacleX: (obs: { pos: number }, ramp: Pick<Ramp, 'dir'>, width: number): number =>
    ramp.dir === 1 ? 40 + obs.pos * (width - 80) : width - 40 - obs.pos * (width - 80),
  /** ランプインデックスに応じた色情報を取得する */
  getRampColor: (index: number) => RampColors[Math.floor(index / 15) % RampColors.length],
  /** ランプが画面内に表示されているか判定する */
  isInViewport: (ry: number, rampH: number, screenH: number): boolean =>
    ry > -rampH - 20 && ry < screenH + 20,
} as const;

/** ランプの高さを取得する */
export const getRampHeight = (): number => Config.ramp.height;
