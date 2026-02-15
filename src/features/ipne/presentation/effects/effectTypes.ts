/**
 * エフェクトシステム型定義
 *
 * 視覚エフェクトの統一管理に使用する型を定義する。
 */

/** エフェクトの種類 */
export const EffectType = {
  ATTACK_HIT: 'attack_hit',
  DAMAGE: 'damage',
  TRAP_DAMAGE: 'trap_damage',
  TRAP_SLOW: 'trap_slow',
  TRAP_TELEPORT: 'trap_teleport',
  ITEM_PICKUP: 'item_pickup',
  LEVEL_UP: 'level_up',
  BOSS_KILL: 'boss_kill',
} as const;

export type EffectTypeValue = (typeof EffectType)[keyof typeof EffectType];

/** パーティクル */
export interface Particle {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
  /** X方向速度（px/秒） */
  vx: number;
  /** Y方向速度（px/秒） */
  vy: number;
  /** サイズ（px） */
  size: number;
  /** 色 */
  color: string;
  /** 透明度（0.0〜1.0） */
  alpha: number;
  /** 残りライフ（0.0〜1.0） */
  life: number;
  /** ライフ減衰率（秒あたり） */
  decay: number;
}

/** ゲームエフェクト */
export interface GameEffect {
  /** 一意識別子 */
  id: string;
  /** エフェクト種類 */
  type: EffectTypeValue;
  /** X座標（ワールド座標） */
  x: number;
  /** Y座標（ワールド座標） */
  y: number;
  /** 開始時刻（ミリ秒） */
  startTime: number;
  /** 持続時間（ミリ秒） */
  duration: number;
  /** パーティクル配列 */
  particles: Particle[];
  /** リングエフェクト用（レベルアップ） */
  ringRadius?: number;
  /** リングエフェクト最大半径 */
  ringMaxRadius?: number;
  /** 画面フラッシュ用（ボス撃破） */
  flashAlpha?: number;
}

/** エフェクト設定 */
export interface EffectConfig {
  /** パーティクル数 */
  particleCount: number;
  /** 持続時間（ミリ秒） */
  duration: number;
  /** パーティクルの色配列 */
  colors: string[];
  /** パーティクルの速度範囲（px/秒） */
  speedMin: number;
  speedMax: number;
  /** パーティクルのサイズ範囲（px） */
  sizeMin: number;
  sizeMax: number;
  /** 重力（Y方向加速度、px/秒^2） */
  gravity?: number;
}
