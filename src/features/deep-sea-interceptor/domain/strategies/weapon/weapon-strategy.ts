// ============================================================================
// Deep Sea Interceptor - 武器戦略インターフェース
// ============================================================================

import type { Bullet } from '../../../types';

/** 武器戦略インターフェース */
export interface WeaponStrategy {
  /** 通常射撃の弾を生成 */
  createBullets(x: number, y: number, power: number, hasSpread: boolean): Bullet[];
  /** チャージショットの弾を生成 */
  createChargedShot(x: number, y: number): Bullet[];
}
