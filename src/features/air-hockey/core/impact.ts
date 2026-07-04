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
  /** 接触点に飛ばすスパーク（パーティクル）の数 */
  sparkCount: number;
};

/**
 * これ未満の打撃速度では反応を発火しない（従来の軽打挙動を維持）。
 *
 * 物理エンジンの衝突解決 `resolveCollision` では、静止マレットに触れただけでも
 * パックは基準復元速度 `power`（= `5 + マレット速度 * 1.2` の下限、すなわち 5）で弾かれる。
 * 下限を 5 以下にすると、受け身のブロックなど「振っていない接触」でも毎回 shake/振動が発火し、
 * 階調化（弱打・強打の差）が失われる。基準復元速度 5 に余裕を持たせて 6 とし、
 * 実際に振った打撃（マレットが動いた接触）だけが反応するようにする。
 */
const IMPACT_MIN_SPEED = 6;
/** これ以上の打撃速度では反応量が頭打ちになる（PHYSICS.MAX_POWER 相当） */
const IMPACT_MAX_SPEED = 16;

/**
 * 画面シェイク専用の下限速度（`IMPACT_MIN_SPEED` より高い）。
 * 画面全体が動くシェイクはパック追従を妨げ「プレイのやりにくさ」に直結するため、
 * 火花・振動・衝撃波（`IMPACT_MIN_SPEED` から発火）とは分離し、
 * 本当に強い打撃のときだけシェイクさせる。これ未満では `shakeIntensity = 0`。
 */
const SHAKE_MIN_SPEED = 12;

// 反応量の下限〜上限（下限 = IMPACT_MIN_SPEED 時、上限 = IMPACT_MAX_SPEED 時）
// ただし shakeIntensity のみ SHAKE_MIN_SPEED 起点で算出する。
// シェイクは控えめ・短めにして、強打の手応えは主に火花・衝撃波・振動で表現する。
const SHAKE_INTENSITY_RANGE = { min: 4, max: 9 } as const;
const SHAKE_DURATION_RANGE = { min: 110, max: 190 } as const;
const HIT_STOP_FRAMES_RANGE = { min: 0, max: 6 } as const;
const SHOCKWAVE_RADIUS_RANGE = { min: 50, max: 150 } as const;
const VIBRATION_MS_RANGE = { min: 12, max: 55 } as const;
const SPARK_COUNT_RANGE = { min: 3, max: 14 } as const;

/**
 * 打撃速度から反応量を算出する純粋関数。
 * @param hitSpeed 衝突後のパック速度の大きさ（magnitude）
 * @returns 下限未満なら null（＝反応なし）。それ以外は連続スケールした反応量。
 */
export const computeImpact = (hitSpeed: number): ImpactResponse | null => {
  // 非有限値（NaN/Infinity）は反応なし扱いにして NaN 伝播を防ぐ
  if (!Number.isFinite(hitSpeed)) return null;
  if (hitSpeed < IMPACT_MIN_SPEED) return null;

  // 下限〜上限を [0, 1] に正規化した補間係数
  const t = clamp(
    (hitSpeed - IMPACT_MIN_SPEED) / (IMPACT_MAX_SPEED - IMPACT_MIN_SPEED),
    0,
    1
  );

  // 画面シェイク専用の係数（SHAKE_MIN_SPEED 起点）。未満なら 0（＝揺らさない）。
  const shakeT =
    hitSpeed <= SHAKE_MIN_SPEED
      ? 0
      : clamp((hitSpeed - SHAKE_MIN_SPEED) / (IMPACT_MAX_SPEED - SHAKE_MIN_SPEED), 0, 1);

  return {
    shakeIntensity: shakeT === 0 ? 0 : lerp(SHAKE_INTENSITY_RANGE.min, SHAKE_INTENSITY_RANGE.max, shakeT),
    shakeDuration: lerp(SHAKE_DURATION_RANGE.min, SHAKE_DURATION_RANGE.max, shakeT),
    hitStopFrames: Math.round(lerp(HIT_STOP_FRAMES_RANGE.min, HIT_STOP_FRAMES_RANGE.max, t)),
    shockwaveMaxRadius: lerp(SHOCKWAVE_RADIUS_RANGE.min, SHOCKWAVE_RADIUS_RANGE.max, t),
    vibrationMs: Math.round(lerp(VIBRATION_MS_RANGE.min, VIBRATION_MS_RANGE.max, t)),
    sparkCount: Math.round(lerp(SPARK_COUNT_RANGE.min, SPARK_COUNT_RANGE.max, t)),
  };
};
