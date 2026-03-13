/**
 * シールド管理（純粋関数）
 *
 * 草原での獲得とボスでの使用を管理する。
 */

/** シールド上限 */
const MAX_SHIELDS = 5;

/** ボスステージの初期シールド数（ベース 1 + 草原で獲得分） */
export function calculateInitialShields(earned: number): number {
  return Math.min(MAX_SHIELDS, 1 + earned);
}

/** シールドを 1 つ使用 */
export function useShield(current: number): number {
  return Math.max(0, current - 1);
}

/** キル数に基づいてシールドドロップ判定 */
export function shouldDropShield(kills: number, nextShieldAt: number): boolean {
  return kills >= nextShieldAt;
}
