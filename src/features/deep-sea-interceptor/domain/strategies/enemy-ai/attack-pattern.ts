// ============================================================================
// Deep Sea Interceptor - 攻撃パターンインターフェース
// ============================================================================

import type { Enemy, EnemyBullet, Position } from '../../../types';

/** 攻撃パターンインターフェース */
export interface AttackPattern {
  /** 敵弾を生成 */
  createBullets(enemy: Enemy, target: Position, now: number): EnemyBullet[];
}
