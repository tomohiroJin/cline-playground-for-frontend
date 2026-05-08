// チェックポイント時間延長（純粋関数）

import { assertNonNegative } from '../shared/assertions';

/** 残時間にチェックポイントボーナスを加算 */
export const applyCheckpointBonus = (
  timeRemainingSec: number,
  bonusSec: number,
): number => {
  // 事前条件: ボーナスは 0 以上
  assertNonNegative(bonusSec, 'bonusSec');
  return timeRemainingSec + bonusSec;
};
