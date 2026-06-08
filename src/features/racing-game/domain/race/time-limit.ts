// 残時間管理（純粋関数）

import { assertNonNegative } from '../shared/assertions';

/**
 * 残時間から経過時間 dt を減算。下限 0 でクランプ。
 *
 * 事前条件: dt >= 0（負の値は時間が「増える」異常事態のため DbC で防ぐ）
 */
export const tickTime = (timeRemainingSec: number, dt: number): number => {
  assertNonNegative(dt, 'dt');
  return Math.max(0, timeRemainingSec - dt);
};

/** 残時間が 0 以下なら時間切れ */
export const isTimeUp = (timeRemainingSec: number): boolean =>
  timeRemainingSec <= 0;
