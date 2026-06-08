// 残時間切れ後の Grace 期間（spec §3.5 / Rad Racer 模倣）
//
// 残時間 0 になっても約 5 秒間は走り続けられる。
// 速度を線形に減衰させ、その間にゴールラインを越えれば cleared。
// Grace 切れでも到達しなければ time_up。

import { assertNonNegative } from '../shared/assertions';

export const GRACE_DURATION_SEC = 5.0;

/**
 * Grace 中の速度倍率を返す。
 * - elapsedInGraceSec = 0 → 1.0（通常速度）
 * - elapsedInGraceSec = GRACE_DURATION_SEC → 0.0（停止）
 * - 線形減衰
 */
export const graceSpeedMultiplier = (elapsedInGraceSec: number): number => {
  assertNonNegative(elapsedInGraceSec, 'elapsedInGraceSec');
  if (elapsedInGraceSec >= GRACE_DURATION_SEC) return 0;
  return 1 - elapsedInGraceSec / GRACE_DURATION_SEC;
};

/** Grace 期間が終了したか（5 秒経過） */
export const isGraceExpired = (elapsedInGraceSec: number): boolean =>
  elapsedInGraceSec >= GRACE_DURATION_SEC;
