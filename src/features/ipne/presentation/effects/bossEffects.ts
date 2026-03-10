/**
 * ボス戦演出
 *
 * ボス登場WARNING、HP残量オーラ、撃破演出を管理する。
 */

import { Enemy, EnemyType, EnemyTypeValue } from '../../types';

// ===== WARNING 演出 =====

/** WARNING 演出の持続時間（ms） */
export const BOSS_WARNING_DURATION = 1200;

/** ボス検知距離（タイル） */
export const BOSS_DETECTION_RANGE = 5;

/** ボスとして扱う敵タイプ */
const BOSS_TYPES: ReadonlySet<EnemyTypeValue> = new Set([
  EnemyType.BOSS,
  EnemyType.MINI_BOSS,
  EnemyType.MEGA_BOSS,
]);

/** WARNING演出の状態 */
export interface BossWarningState {
  isActive: boolean;
  startTime: number;
  /** 発火済みボスID一覧（同じボスには1回のみ） */
  triggeredBossIds: string[];
}

/** WARNING演出フェーズ */
export type WarningPhase = 'darken' | 'text' | 'fadeout' | 'done';

/**
 * 初期WARNING状態を生成する
 */
export function createBossWarningState(): BossWarningState {
  return { isActive: false, startTime: 0, triggeredBossIds: [] };
}

/**
 * 指定のボス敵に対してWARNINGを発火すべきか判定する
 */
export function shouldTriggerWarning(
  state: BossWarningState,
  enemy: Enemy,
  playerX: number,
  playerY: number
): boolean {
  // ボスタイプでなければ対象外
  if (!BOSS_TYPES.has(enemy.type)) return false;

  // 発火済みなら対象外
  if (state.triggeredBossIds.includes(enemy.id)) return false;

  // マンハッタン距離でチェック
  const distance = Math.abs(enemy.x - playerX) + Math.abs(enemy.y - playerY);
  return distance <= BOSS_DETECTION_RANGE;
}

/**
 * WARNING演出の現在フェーズを返す
 */
export function getWarningPhase(elapsed: number): WarningPhase {
  if (elapsed < 200) return 'darken';
  if (elapsed < 1000) return 'text';
  if (elapsed < 1200) return 'fadeout';
  return 'done';
}

// ===== HP残量オーラ =====

/** ボスオーラ設定 */
export interface BossAuraConfig {
  /** 脈動周期（ms） */
  pulsePeriod: number;
  /** 最小alpha */
  alphaMin: number;
  /** 最大alpha */
  alphaMax: number;
  /** 微シェイクを行うか */
  hasShake: boolean;
}

/**
 * ボスのHP比率に応じたオーラ設定を返す
 *
 * @param hpRatio - HP / maxHp（0.0〜1.0）
 * @returns 演出設定。50%超の場合は undefined
 */
export function getBossAuraConfig(
  hpRatio: number
): BossAuraConfig | undefined {
  if (hpRatio > 0.5) return undefined;

  if (hpRatio <= 0.25) {
    return {
      pulsePeriod: 400,
      alphaMin: 0.2,
      alphaMax: 0.5,
      hasShake: true,
    };
  }

  return {
    pulsePeriod: 800,
    alphaMin: 0.1,
    alphaMax: 0.3,
    hasShake: false,
  };
}

// ===== ボス撃破演出 =====

/** 爆発波の設定 */
export interface ExplosionWave {
  delay: number;
  particleCount: number;
  colors: string[];
  pattern: 'radial' | 'spiral' | 'pulse';
}

/** ボス撃破エフェクト設定 */
export interface BossDeathEffectConfig {
  particleCount: number;
  flashDuration: number;
  shakeDuration: number;
  /** メガボス用の多段階爆発 */
  waves?: ExplosionWave[];
}

/**
 * ボスタイプに応じた撃破エフェクト設定を返す
 */
export function getBossDeathEffectConfig(
  enemyType: EnemyTypeValue
): BossDeathEffectConfig {
  switch (enemyType) {
    case EnemyType.BOSS:
      return {
        particleCount: 32,
        flashDuration: 300,
        shakeDuration: 400,
      };

    case EnemyType.MINI_BOSS:
      return {
        particleCount: 24,
        flashDuration: 200,
        shakeDuration: 300,
      };

    case EnemyType.MEGA_BOSS:
      return {
        particleCount: 48,
        flashDuration: 500,
        shakeDuration: 600,
        waves: [
          { delay: 0, particleCount: 24, colors: ['#ef4444', '#f97316'], pattern: 'radial' },
          { delay: 400, particleCount: 24, colors: ['#fbbf24', '#ffffff'], pattern: 'spiral' },
          { delay: 800, particleCount: 48, colors: ['#ffffff', '#fbbf24', '#ef4444'], pattern: 'pulse' },
        ],
      };

    default:
      return { particleCount: 0, flashDuration: 0, shakeDuration: 0 };
  }
}
