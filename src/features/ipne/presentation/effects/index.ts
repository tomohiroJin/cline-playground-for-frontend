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
  createSpiralParticles,
  createPulseParticles,
  createTrailParticles,
  updateParticles,
  drawParticles,
} from './particleSystem';

// エフェクトマネージャー
export { EffectManager, resetEffectIdCounter } from './effectManager';

// 死亡エフェクト
export { DeathEffect, DeathPhase, DEATH_ANIMATION_DURATION } from './deathEffect';
export type { DeathPhaseValue } from './deathEffect';
