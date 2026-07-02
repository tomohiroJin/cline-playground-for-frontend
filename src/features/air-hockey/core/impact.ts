import { clamp, lerp } from '../../../utils/math-utils';

/** 打撃の強さに応じた反応量（値オブジェクト） */
export type ImpactResponse = {
  /** shake 強度（px 相当） */
  shakeIntensity: number;
  /** shake 持続時間（ms） */
  shakeDuration: number;
  /** hitStop フレーム数（0 なら hitStop なし） */
  hitStopFrames: number;
  /** 衝撃波の最大半径（px） */
  shockwaveMaxRadius: number;
  /** モバイル振動時間（ms） */
  vibrationMs: number;
};

/** これ未満の打撃速度では反応を発火しない（従来の軽打挙動を維持） */
const IMPACT_MIN_SPEED = 4;
/** これ以上の打撃速度では反応量が頭打ちになる（PHYSICS.MAX_POWER 相当） */
const IMPACT_MAX_SPEED = 16;

// 反応量の下限〜上限（下限 = IMPACT_MIN_SPEED 時、上限 = IMPACT_MAX_SPEED 時）
const SHAKE_INTENSITY_RANGE = { min: 2, max: 9 } as const;
const SHAKE_DURATION_RANGE = { min: 120, max: 220 } as const;
const HIT_STOP_FRAMES_RANGE = { min: 0, max: 4 } as const;
const SHOCKWAVE_RADIUS_RANGE = { min: 40, max: 110 } as const;
const VIBRATION_MS_RANGE = { min: 8, max: 40 } as const;

/**
 * 打撃速度から反応量を算出する純粋関数。
 * @param hitSpeed 衝突後のパック速度の大きさ（magnitude）
 * @returns 下限未満なら null（＝反応なし）。それ以外は連続スケールした反応量。
 */
export const computeImpact = (hitSpeed: number): ImpactResponse | null => {
  if (hitSpeed < IMPACT_MIN_SPEED) return null;

  // 下限〜上限を [0, 1] に正規化した補間係数
  const t = clamp(
    (hitSpeed - IMPACT_MIN_SPEED) / (IMPACT_MAX_SPEED - IMPACT_MIN_SPEED),
    0,
    1
  );

  return {
    shakeIntensity: lerp(SHAKE_INTENSITY_RANGE.min, SHAKE_INTENSITY_RANGE.max, t),
    shakeDuration: lerp(SHAKE_DURATION_RANGE.min, SHAKE_DURATION_RANGE.max, t),
    hitStopFrames: Math.round(lerp(HIT_STOP_FRAMES_RANGE.min, HIT_STOP_FRAMES_RANGE.max, t)),
    shockwaveMaxRadius: lerp(SHOCKWAVE_RADIUS_RANGE.min, SHOCKWAVE_RADIUS_RANGE.max, t),
    vibrationMs: Math.round(lerp(VIBRATION_MS_RANGE.min, VIBRATION_MS_RANGE.max, t)),
  };
};
