/**
 * スクワッシュ＆ストレッチサービス
 * ジャンプ・落下・着地時の変形スケールを計算する純粋関数。
 * React/DOM への依存なし。
 */

import type { Player } from '../../types';
import { MathUtils } from '../math-utils';

/** スケール変形値 */
export type Squash = {
  readonly scaleX: number;
  readonly scaleY: number;
};

/** 地上静止と判定する |vy| の閾値 */
const IDLE_VY_THRESHOLD = 1.5;
/** 着地スクワッシュと判定する |vy| の閾値（onGround=true の状態で）*/
const LANDING_VY_THRESHOLD = 3.0;
/** 縦速度から変形量へのスケール係数 */
const STRETCH_FACTOR = 0.04;
/** 最大ストレッチ量（scaleY の最大上乗せ分）*/
const MAX_STRETCH_DELTA = 0.4;
/** 着地スクワッシュの最大スケールX */
const MAX_SQUASH_SCALE_X = 1.35;
/** 着地スクワッシュの最小スケールY */
const MIN_SQUASH_SCALE_Y = 0.7;

/** 体積保存則に基づき scaleX を scaleY から逆算する */
const volumePreservedScaleX = (scaleY: number): number =>
  MathUtils.clamp(1 / scaleY, 0.5, 2.0);

/**
 * プレイヤーの運動状態からスクワッシュ＆ストレッチスケールを計算する。
 *
 * - 地上静止: {scaleX:1, scaleY:1}
 * - 空中（上昇・落下）: 縦長変形（scaleY>1, scaleX<1）
 * - 着地直後（onGround=true かつ |vy| が閾値以上）: 横潰れ変形（scaleX>1, scaleY<1）
 *
 * 体積保存の目安: scaleX * scaleY ≈ 1
 */
export const squashStretch = (player: Player): Squash => {
  const { vy, onGround, jumping } = player;
  const absVy = Math.abs(vy);

  // 着地スクワッシュ: 地面にいて縦速度が着地閾値以上
  if (onGround && !jumping && absVy >= LANDING_VY_THRESHOLD) {
    const intensity = MathUtils.clamp(absVy / 10, 0, 1);
    const scaleX = MathUtils.lerp(1, MAX_SQUASH_SCALE_X, intensity);
    const scaleY = MathUtils.lerp(1, MIN_SQUASH_SCALE_Y, intensity);
    return { scaleX, scaleY };
  }

  // 地上静止: ジャンプしておらず速度がほぼゼロ
  if (onGround && !jumping && absVy < IDLE_VY_THRESHOLD) {
    return { scaleX: 1, scaleY: 1 };
  }

  // 空中ストレッチ: 縦速度に応じて縦長変形
  const stretchDelta = MathUtils.clamp(absVy * STRETCH_FACTOR, 0, MAX_STRETCH_DELTA);
  const scaleY = 1 + stretchDelta;
  const scaleX = volumePreservedScaleX(scaleY);
  return { scaleX, scaleY };
};
