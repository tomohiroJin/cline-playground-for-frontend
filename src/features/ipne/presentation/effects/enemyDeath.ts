/**
 * 敵撃破演出
 *
 * 敵撃破時の縮小→フラッシュ→破裂アニメーションと
 * 破片パーティクル設定を管理する。
 */

import { EnemyType, EnemyTypeValue } from '../../types';

/** 撃破アニメーション全体の持続時間（ms） */
export const ENEMY_DEATH_DURATION = 300;

/** フェーズ境界（ms） */
const PHASE_1_END = 100; // 縮小
const PHASE_2_END = 150; // フラッシュ

/**
 * 経過時間からアニメーションフェーズを返す
 *
 * @param elapsed - 撃破開始からの経過時間（ms）
 * @returns 1=縮小, 2=フラッシュ, 3=破裂
 */
export function getDeathPhase(elapsed: number): 1 | 2 | 3 {
  if (elapsed < PHASE_1_END) return 1;
  if (elapsed < PHASE_2_END) return 2;
  return 3;
}

/**
 * フェーズ1の縮小スケールを返す
 *
 * @param elapsed - 経過時間（ms）
 * @returns 0.0〜1.0のスケール値
 */
export function getDeathScale(elapsed: number): number {
  if (elapsed >= PHASE_1_END) return 0;
  // 1.0 → 0.5 に縮小
  const progress = elapsed / PHASE_1_END;
  return 1.0 - progress * 0.5;
}

/**
 * 撃破アニメーションが完了したか
 */
export function isDeathAnimationComplete(elapsed: number): boolean {
  return elapsed >= ENEMY_DEATH_DURATION;
}

/** 破片パーティクル設定 */
export interface EnemyDeathParticleConfig {
  particleCount: number;
  colors: string[];
  speedMin: number;
  speedMax: number;
  sizeMin: number;
  sizeMax: number;
  duration: number;
}

/** 敵タイプ別のパーティクル設定 */
const DEATH_PARTICLE_CONFIGS: Record<EnemyTypeValue, EnemyDeathParticleConfig> = {
  [EnemyType.PATROL]: {
    particleCount: 6,
    colors: ['#6b21a8', '#7c3aed', '#a78bfa'],
    speedMin: 40, speedMax: 100,
    sizeMin: 2, sizeMax: 4,
    duration: 300,
  },
  [EnemyType.CHARGE]: {
    particleCount: 8,
    colors: ['#991b1b', '#dc2626', '#f87171'],
    speedMin: 50, speedMax: 120,
    sizeMin: 2, sizeMax: 4,
    duration: 300,
  },
  [EnemyType.RANGED]: {
    particleCount: 6,
    colors: ['#c2410c', '#f97316', '#fdba74'],
    speedMin: 40, speedMax: 100,
    sizeMin: 2, sizeMax: 4,
    duration: 300,
  },
  [EnemyType.SPECIMEN]: {
    particleCount: 6,
    colors: ['#1e40af', '#3b82f6', '#93c5fd'],
    speedMin: 40, speedMax: 100,
    sizeMin: 2, sizeMax: 3,
    duration: 300,
  },
  [EnemyType.BOSS]: {
    particleCount: 24,
    colors: ['#78350f', '#a16207', '#fbbf24', '#ffffff'],
    speedMin: 60, speedMax: 160,
    sizeMin: 3, sizeMax: 6,
    duration: 800,
  },
  [EnemyType.MINI_BOSS]: {
    particleCount: 16,
    colors: ['#78350f', '#a16207', '#fbbf24', '#ffffff'],
    speedMin: 50, speedMax: 140,
    sizeMin: 3, sizeMax: 5,
    duration: 600,
  },
  [EnemyType.MEGA_BOSS]: {
    particleCount: 48,
    colors: ['#ef4444', '#f97316', '#fbbf24', '#ffffff'],
    speedMin: 80, speedMax: 200,
    sizeMin: 3, sizeMax: 6,
    duration: 1200,
  },
};

/**
 * 敵タイプに応じたパーティクル設定を取得する
 */
export function getEnemyDeathParticleConfig(
  enemyType: EnemyTypeValue
): EnemyDeathParticleConfig {
  return DEATH_PARTICLE_CONFIGS[enemyType];
}
