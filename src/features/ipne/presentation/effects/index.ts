/**
 * エフェクトシステム
 *
 * 視覚エフェクトの統一管理モジュール。
 */

// 型定義
export { EffectType } from './effectTypes';
export type { EffectTypeValue, GameEffect, Particle, EffectConfig } from './effectTypes';

// パーティクルシステム
export {
  createRadialParticles,
  createRisingParticles,
  updateParticles,
  drawParticles,
} from './particleSystem';

// エフェクトマネージャー
export { EffectManager, resetEffectIdCounter } from './effectManager';

// スピードエフェクト
export { SpeedEffectManager, isSpeedEffectActive, SUSTAINED_MOVE_FRAMES } from './speedEffect';
export type { AfterImage } from './speedEffect';

// 死亡エフェクト
export { DeathEffect, DeathPhase, DEATH_ANIMATION_DURATION } from './deathEffect';
export type { DeathPhaseValue } from './deathEffect';
