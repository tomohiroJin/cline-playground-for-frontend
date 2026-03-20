// 衝突判定（純粋関数・副作用なし）

import type { Point } from '../shared/types';
import type { Player } from '../player/types';
import { cancelDrift } from '../player/drift';
import { assertPositive } from '../shared/assertions';

/** 衝突結果 */
export interface CollisionResult {
  readonly player1: Player;
  readonly player2: Player;
  readonly contactPoint: Point;
}

/** 2 プレイヤー間の衝突判定と解決 */
export const handleCollision = (
  p1: Player,
  p2: Player,
  collisionDist: number,
): CollisionResult | null => {
  // 事前条件
  assertPositive(collisionDist, 'collisionDist');

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  if (dist >= collisionDist || dist === 0) return null;

  const ov = (collisionDist - dist) / 2;
  const nx = dx / dist;
  const ny = dy / dist;

  // 衝突時、ドリフト中なら強制終了（ブーストなし）
  const p1Drift = p1.drift.active ? cancelDrift(p1.drift) : p1.drift;
  const p2Drift = p2.drift.active ? cancelDrift(p2.drift) : p2.drift;

  return {
    player1: { ...p1, x: p1.x - nx * ov, y: p1.y - ny * ov, drift: p1Drift },
    player2: { ...p2, x: p2.x + nx * ov, y: p2.y + ny * ov, drift: p2Drift },
    contactPoint: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
  };
};
