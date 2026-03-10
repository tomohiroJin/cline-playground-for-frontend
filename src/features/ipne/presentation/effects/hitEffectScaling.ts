/**
 * ヒットエフェクトスケーリング
 *
 * プレイヤーのレベルに応じて攻撃ヒットエフェクトの規模を段階化する。
 */

import { Player } from '../../types';

/** スケーリング設定 */
export interface HitEffectScale {
  particleCount: number;
  sizeMultiplier: number;
  speedMultiplier: number;
  hasShockwave: boolean;
  hasFlash: boolean;
  hasShake: boolean;
}

/** 5段階のスケーリング設定 */
export const HIT_EFFECT_SCALES: readonly HitEffectScale[] = [
  // powerLevel 0: Lv1-4
  { particleCount: 4, sizeMultiplier: 0.6, speedMultiplier: 0.8, hasShockwave: false, hasFlash: false, hasShake: false },
  // powerLevel 1: Lv5-9
  { particleCount: 8, sizeMultiplier: 1.0, speedMultiplier: 1.0, hasShockwave: false, hasFlash: false, hasShake: false },
  // powerLevel 2: Lv10-14
  { particleCount: 12, sizeMultiplier: 1.3, speedMultiplier: 1.1, hasShockwave: true, hasFlash: false, hasShake: false },
  // powerLevel 3: Lv15-19
  { particleCount: 16, sizeMultiplier: 1.6, speedMultiplier: 1.2, hasShockwave: true, hasFlash: true, hasShake: false },
  // powerLevel 4: Lv20+
  { particleCount: 24, sizeMultiplier: 2.0, speedMultiplier: 1.3, hasShockwave: true, hasFlash: true, hasShake: true },
];

/**
 * プレイヤーの総合パワーレベルを算出する
 *
 * レベルを5で割った値の整数部（0-4にクランプ）
 */
export function calculatePowerLevel(player: Player): number {
  const levelFactor = Math.min(player.level / 5, 4);
  return Math.floor(levelFactor);
}

/**
 * パワーレベルに応じたヒットエフェクト設定を取得する
 */
export function getHitEffectConfig(powerLevel: number): HitEffectScale {
  const clamped = Math.max(0, Math.min(4, powerLevel));
  return HIT_EFFECT_SCALES[clamped];
}
