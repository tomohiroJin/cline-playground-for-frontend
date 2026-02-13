// ============================================================================
// Deep Sea Interceptor - 敵AI
// ============================================================================

import { EntityFactory } from './entities';
import type { Enemy, Position } from './types';

/** Position ベクトルを正規化 */
const normalize = ({ x, y }: Position): Position => {
  const m = Math.hypot(x, y);
  return m === 0 ? { x: 0, y: 0 } : { x: x / m, y: y / m };
};

/** 敵AIモジュール */
export const EnemyAI = {
  /** 敵が射撃可能か判定 */
  shouldShoot: (e: Enemy, now: number) => e.canShoot && e.y > 0 && now - e.lastShotAt > e.fireRate,

  /** 敵弾を生成（ボスは複数弾） */
  createBullets: (e: Enemy, target: Position) => {
    const dir = normalize({ x: target.x - e.x, y: target.y - e.y });
    const speed = 3.5;
    const baseVel = { x: dir.x * speed, y: dir.y * speed };
    const bullets = [EntityFactory.enemyBullet(e.x, e.y, baseVel)];
    if (e.enemyType === 'boss') {
      return [
        ...bullets,
        EntityFactory.enemyBullet(e.x, e.y, { x: baseVel.x - 1, y: baseVel.y }),
        EntityFactory.enemyBullet(e.x, e.y, { x: baseVel.x + 1, y: baseVel.y }),
        EntityFactory.enemyBullet(e.x - 20, e.y, { x: 0, y: 4 }),
        EntityFactory.enemyBullet(e.x + 20, e.y, { x: 0, y: 4 }),
      ];
    }
    return bullets;
  },
};
