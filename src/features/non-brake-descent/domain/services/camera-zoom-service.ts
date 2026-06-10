/**
 * カメラズームサービス
 * 速度に応じたカメラズーム率を計算する純粋関数
 */

import { MathUtils } from '../math-utils';

// --- 定数 ---

/** ズーム率の最大値（高速時の最大ズームイン量） */
const MAX_CAMERA_ZOOM = 1.05;

/** ズーム率の最小値（通常時） */
const MIN_CAMERA_ZOOM = 1.0;

// --- 公開関数 ---

/**
 * 速度をカメラズーム率に変換する
 * minSpeed 以下では 1.0、maxSpeed 以上では MAX_CAMERA_ZOOM（1.05）を返す。
 * 中間値は線形補間される。
 *
 * @param speed - 現在の速度
 * @param minSpeed - ズームが始まる最小速度
 * @param maxSpeed - 最大ズームに達する速度
 * @returns カメラズーム率（1.0 〜 1.05）
 */
export const cameraZoomForSpeed = (speed: number, minSpeed: number, maxSpeed: number): number => {
  // 速度を 0〜1 に正規化し、ズーム率へ線形補間
  const normalized = MathUtils.normalize(speed, minSpeed, maxSpeed);
  const clamped = MathUtils.clamp(normalized, 0, 1);
  return MathUtils.lerp(MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM, clamped);
};
