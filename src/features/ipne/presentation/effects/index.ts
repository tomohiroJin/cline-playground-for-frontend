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

// フローティングテキスト（Phase 2-1）
export { FloatingTextManager, FloatingTextType, FLOATING_TEXT_CONFIGS, getTextPosition } from './floatingText';
export type { FloatingText, FloatingTextTypeValue } from './floatingText';

// 敵撃破演出（Phase 2-4）
export { ENEMY_DEATH_DURATION, getDeathPhase, getDeathScale, isDeathAnimationComplete, getEnemyDeathParticleConfig } from './enemyDeath';

// ヒットエフェクトスケーリング（Phase 2-2）
export { calculatePowerLevel, getHitEffectConfig, HIT_EFFECT_SCALES } from './hitEffectScaling';

// ボス戦演出（Phase 2-5）
export {
  createBossWarningState,
  shouldTriggerWarning,
  getWarningPhase,
  getBossAuraConfig,
  getBossDeathEffectConfig,
  BOSS_WARNING_DURATION,
  BOSS_DETECTION_RANGE,
} from './bossEffects';
export type { BossWarningState, BossAuraConfig, BossDeathEffectConfig } from './bossEffects';
