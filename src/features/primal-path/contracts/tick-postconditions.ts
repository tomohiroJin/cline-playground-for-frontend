/**
 * 戦闘ティックの事後条件
 *
 * tick 関数の出口で結果状態が正しいことを検証する。
 */
import type { TickResult } from '../types';
import { invariant } from '../contracts';

/** tick 結果の事後条件を検証する */
export function ensureTickResult(result: TickResult): void {
  const { nextRun } = result;
  invariant(
    nextRun.hp <= nextRun.mhp,
    `事後条件違反: HP(${nextRun.hp}) > maxHP(${nextRun.mhp})`,
  );
  invariant(
    nextRun.hp >= 0,
    `事後条件違反: HP が負の値(${nextRun.hp})`,
  );
}
