/**
 * ランプ生成モジュール
 *
 * generators.ts の RampGen を application 層に移動。
 */
import { RampType } from '../../constants';
import { createRamp } from '../../domain/entities';
import { MathUtils } from '../../domain/math-utils';
import type { Obstacle, Ramp } from '../../types';
import { ObstacleGen } from './obstacle-generator';

/** undefined を除外する型ガード */
const isDefined = <T,>(value: T | undefined): value is T => value !== undefined;

/** ランプ生成サービス */
export const RampGen = {
  /** 指定ランプに配置する障害物を生成する */
  genObs: (i: number, total: number): Obstacle[] => {
    if (i <= 2 || i >= total - 2) return [];
    const diff = Math.min(1, i / 60);
    const count = MathUtils.randomBool(0.2 + diff * 0.2) ? 2 : 1;
    return (
      count === 2
        ? [MathUtils.randomRange(0.2, 0.4), MathUtils.randomRange(0.6, 0.8)]
        : [MathUtils.randomRange(0.3, 0.7)]
    )
      .map(ObstacleGen.generate)
      .filter(isDefined);
  },

  /** ランプの種類を選択する */
  selectType: (i: number): Ramp['type'] =>
    i <= 5 || !MathUtils.randomBool(0.25)
      ? RampType.NORMAL
      : ([RampType.STEEP, RampType.GENTLE, RampType.V_SHAPE][
          Math.floor(Math.random() * 3)
        ] ?? RampType.NORMAL),

  /** 指定数のランプ配列を生成する */
  generate: (total: number): Ramp[] => {
    let dir: Ramp['dir'] = 1;
    return Array.from({ length: total }, (_, i) => {
      const ramp = createRamp(
        dir,
        RampGen.genObs(i, total),
        RampGen.selectType(i),
        i === total - 1
      );
      dir = (dir * -1) as Ramp['dir'];
      return ramp;
    });
  },
} as const;
