// ============================================================================
// Deep Sea Interceptor - 移動ロジック
// ============================================================================

import { Config } from './constants';
import type { MovableEntity, AngleEntity, VelocityEntity } from './types';

/** 各エンティティの移動戦略 */
export const MovementStrategies = {
  /** 直進（下方向） */
  straight: <T extends MovableEntity>(e: T): T => ({ ...e, y: e.y + e.speed }),

  /** サイン波移動 */
  sine: <T extends MovableEntity>(e: T): T => ({
    ...e,
    y: e.y + e.speed,
    x: e.x + Math.sin(e.y / 20) * 2,
  }),

  /** ドリフト移動（中央方向に寄る） */
  drift: <T extends MovableEntity>(e: T): T => ({
    ...e,
    y: e.y + e.speed,
    x: e.x + (e.x < Config.canvas.width / 2 ? 0.5 : -0.5),
  }),

  /** ボス移動（上部で左右に揺れる） */
  boss: <T extends AngleEntity>(e: T): T => ({
    ...e,
    y: Math.min(90, e.y + e.speed),
    x: Config.canvas.width / 2 + Math.sin(e.angle) * 80,
    angle: e.angle + 0.015,
  }),

  /** プレイヤー弾移動（角度ベース） */
  bullet: <T extends AngleEntity>(e: T): T => ({
    ...e,
    x: e.x + Math.cos(e.angle) * e.speed,
    y: e.y + Math.sin(e.angle) * e.speed,
  }),

  /** 敵弾移動（速度ベクトル） */
  enemyBullet: <T extends VelocityEntity>(e: T): T => ({ ...e, x: e.x + e.vx, y: e.y + e.vy }),

  /** アイテム移動（下方向） */
  item: <T extends MovableEntity>(e: T): T => ({ ...e, y: e.y + e.speed }),

  /** パーティクル移動（速度ベクトル＋寿命減少） */
  particle: <T extends VelocityEntity & { life: number }>(e: T): T => ({
    ...e,
    x: e.x + e.vx,
    y: e.y + e.vy,
    life: e.life - 1,
  }),

  /** 泡移動（上方向＋透明度減少） */
  bubble: <T extends MovableEntity & { opacity: number }>(e: T): T => ({
    ...e,
    y: e.y - e.speed,
    opacity: e.opacity - 0.003,
  }),
};
