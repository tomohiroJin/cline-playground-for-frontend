/**
 * カウンターシステム（純粋関数）
 *
 * プレイヤーが腕を弾き返すカウンター攻撃の判定を管理する。
 */

/** カウンター実行可能か判定 */
export function canCounter(playerPos: number, counterCD: number): boolean {
  return playerPos >= 1 && playerPos <= 6 && counterCD <= 0;
}

/** カウンター後の腕休息時間を計算 */
export function calculateCounterRestTime(baseRestTime: number): number {
  return Math.max(2, baseRestTime + 2);
}
