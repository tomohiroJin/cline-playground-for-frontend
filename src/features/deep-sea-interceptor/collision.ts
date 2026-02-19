// ============================================================================
// Deep Sea Interceptor - 衝突判定
// ============================================================================

import { distance as baseDistance } from '../../utils/math-utils';
import { Config } from './constants';
import type { Position, Bullet, Enemy, Item, EnemyBullet } from './types';

/** Position オブジェクト間の距離を計算 */
export const distance = (a: Position, b: Position) => baseDistance(a.x, a.y, b.x, b.y);

/** 衝突判定モジュール */
export const Collision = {
  /** 円と円の衝突判定 */
  circle: (a: Position, b: Position, rA: number, rB: number) => distance(a, b) < rA + rB,

  /** プレイヤー弾と敵の衝突判定 */
  bulletEnemy: (b: Bullet, e: Enemy) => Collision.circle(b, e, b.size / 2, e.size / 2),

  /** プレイヤーとアイテムの衝突判定 */
  playerItem: (p: Position, i: Item) => Collision.circle(p, i, 15, i.size / 2),

  /** プレイヤーと敵弾の衝突判定 */
  playerEnemyBullet: (p: Position, b: EnemyBullet) =>
    Collision.circle(p, b, Config.player.size * Config.player.hitboxRatio, 4),

  /** プレイヤーと敵の衝突判定 */
  playerEnemy: (p: Position, e: Enemy) =>
    Collision.circle(p, e, Config.player.size * Config.player.hitboxRatio, e.size / 2),

  /** プレイヤーと敵弾のグレイズ判定（衝突半径の外側、グレイズ半径の内側） */
  graze: (p: Position, b: EnemyBullet) => {
    const playerRadius = Config.player.size * Config.player.hitboxRatio;
    const d = distance(p, b);
    const hitRadius = playerRadius + 4;
    const grazeRadius = playerRadius + 16;
    return d >= hitRadius && d < grazeRadius;
  },
};
