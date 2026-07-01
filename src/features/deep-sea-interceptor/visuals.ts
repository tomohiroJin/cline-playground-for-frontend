// ============================================================================
// Deep Sea Interceptor - 純粋描画ヘルパー（発光・当たり判定・敵弾コア）
// ============================================================================

import { Config } from './constants';

/** ネオングロー用 SVG フィルタの id（将来の共有 defs 用に固定） */
export const NEON_FILTER_ID = 'dsiNeonGlow';

/** グロー強度 */
export type GlowIntensity = 'soft' | 'strong';

/** グロー強度ごとの基準ブラー半径（px） */
const GLOW_BLUR_PX: Record<GlowIntensity, number> = { soft: 5, strong: 10 };

/**
 * ネオン発光の CSS filter 文字列を返す。
 * div / svg どちらの style.filter にも使える。二重の drop-shadow で
 * 中心の芯を残しつつ外側へにじませる。
 */
export const neonGlow = (color: string, intensity: GlowIntensity = 'soft'): string => {
  const blur = GLOW_BLUR_PX[intensity];
  return `drop-shadow(0 0 ${blur}px ${color}) drop-shadow(0 0 ${blur * 2}px ${color})`;
};

/**
 * 自機の実当たり判定半径を返す。
 * 衝突判定（collision.ts）は size × hitboxRatio を半径として使うため、それに一致させる。
 */
export const playerHitboxRadius = (): number =>
  Config.player.size * Config.player.hitboxRatio;

/** 敵弾中心の高輝度コアの直径。弾サイズに比例させつつ最小値を保証する */
export const enemyBulletCoreSize = (bulletSize: number): number =>
  Math.max(3, Math.round(bulletSize * 0.35));
