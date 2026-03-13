/**
 * カウンターシステム（純粋関数）
 *
 * プレイヤーが腕を弾き返すカウンター攻撃の判定を管理する。
 */

import { assert, BOSS_ARM_COUNT } from '../../constants';

/** カウンター実行可能か判定 */
export function canCounter(playerPos: number, counterCD: number): boolean {
  assert(playerPos >= 0 && playerPos <= BOSS_ARM_COUNT, `canCounter: playerPos must be 0-${BOSS_ARM_COUNT}, got ${playerPos}`);
  return playerPos >= 1 && playerPos <= BOSS_ARM_COUNT && counterCD <= 0;
}

/** カウンター後の腕休息時間を計算 */
export function calculateCounterRestTime(baseRestTime: number): number {
  return Math.max(2, baseRestTime + 2);
}
