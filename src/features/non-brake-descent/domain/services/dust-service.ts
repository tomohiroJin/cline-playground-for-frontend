/**
 * 土煙パーティクルサービス
 * 着地時に地面から土煙が広がるパーティクル群を生成する純粋関数。
 * React/DOM への依存なし。
 */

import type { Particle } from '../../types';
import { MathUtils } from '../math-utils';

/** 土埃の基本色 */
const DUST_COLOR = '#bbaa99';
/** 横方向の最大初速 */
const VX_MAX = 3.0;
/** 縦方向の初速（上方向。負値） */
const VY_INITIAL_MIN = -2.5;
const VY_INITIAL_MAX = -0.5;
/** パーティクルの初期 life（フレーム数） */
const LIFE_MIN = 12;
const LIFE_MAX = 22;
/** 生成位置の水平散布半径 */
const SPREAD_X = 8;
/** 生成位置の垂直散布量（上方向） */
const SPREAD_Y = 4;

/**
 * 着地点(x, y)から地面に沿って横へ広がる土煙を count 個生成する。
 *
 * @param x - 着地点の X 座標
 * @param y - 着地点の Y 座標
 * @param count - 生成するパーティクル数
 * @returns 土煙パーティクルの配列
 */
export const createDust = (x: number, y: number, count: number): Particle[] => {
  if (count <= 0) {
    return [];
  }

  return Array.from({ length: count }, (): Particle => {
    // 左右対称に分散: [0, 1) を [-1, 1) に変換してから VX_MAX をかける
    const vx = (MathUtils.randomRange(0, 1) * 2 - 1) * VX_MAX;
    const vy = MathUtils.randomRange(VY_INITIAL_MIN, VY_INITIAL_MAX);
    const offsetX = MathUtils.randomRange(-SPREAD_X, SPREAD_X);
    const offsetY = MathUtils.randomRange(-SPREAD_Y, 0);
    const life = MathUtils.randomRange(LIFE_MIN, LIFE_MAX);

    return {
      x: x + offsetX,
      y: y + offsetY,
      color: DUST_COLOR,
      vx,
      vy,
      life,
    };
  });
};
