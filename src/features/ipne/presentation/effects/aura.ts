/**
 * パワーオーラシステム
 *
 * プレイヤーのレベルに応じてキャラクター周囲に常時表示されるオーラエフェクト。
 * 成長の実感を視覚的に提供する。
 */

import { PlayerClassValue, PlayerClass } from '../../types';
import { applyAlpha, CLASS_BASE_COLORS, GOLD_COLOR, WHITE_COLOR } from './colorUtils';

/** オーラのティア（レベル帯に対応） */
export const AuraTier = {
  NONE: 'none',
  GLOW: 'glow',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

export type AuraTierValue = (typeof AuraTier)[keyof typeof AuraTier];

/** オーラ設定 */
export interface AuraConfig {
  /** オーラの半径（タイルサイズに対する比率） */
  radius: number;
  /** 基本色（CSS色文字列） */
  baseColor: string;
  /** 二次色（グラデーション用、オプション） */
  secondaryColor?: string;
  /** 最大不透明度 (0.0-1.0) */
  maxAlpha: number;
  /** 脈動速度（ms周期） */
  pulseSpeed: number;
  /** パーティクル有無 */
  hasParticles: boolean;
  /** パーティクル数（1フレームあたりの生成数） */
  particleCount: number;
}

/** レベル閾値テーブル（降順でマッチ） */
const LEVEL_THRESHOLDS: readonly { readonly minLevel: number; readonly tier: AuraTierValue }[] = [
  { minLevel: 20, tier: AuraTier.LARGE },
  { minLevel: 15, tier: AuraTier.MEDIUM },
  { minLevel: 10, tier: AuraTier.SMALL },
  { minLevel: 5, tier: AuraTier.GLOW },
  { minLevel: 1, tier: AuraTier.NONE },
];

/** ティア別基本設定 */
const TIER_CONFIGS: Record<AuraTierValue, Omit<AuraConfig, 'baseColor' | 'secondaryColor'>> = {
  [AuraTier.NONE]: { radius: 0, maxAlpha: 0, pulseSpeed: 0, hasParticles: false, particleCount: 0 },
  [AuraTier.GLOW]: { radius: 0.3, maxAlpha: 0.15, pulseSpeed: 2000, hasParticles: false, particleCount: 0 },
  [AuraTier.SMALL]: { radius: 0.5, maxAlpha: 0.25, pulseSpeed: 1500, hasParticles: false, particleCount: 0 },
  [AuraTier.MEDIUM]: { radius: 0.7, maxAlpha: 0.35, pulseSpeed: 1200, hasParticles: true, particleCount: 2 },
  [AuraTier.LARGE]: { radius: 1.0, maxAlpha: 0.45, pulseSpeed: 1000, hasParticles: true, particleCount: 4 },
};

/** 職業別の二次カラー（SMALL ティア用） */
const CLASS_SECONDARY_COLORS: Record<PlayerClassValue, string> = {
  [PlayerClass.WARRIOR]: 'rgba(129, 140, 248, {a})',
  [PlayerClass.THIEF]: 'rgba(196, 181, 253, {a})',
};

/** 職業別・ティア別カラー定義 */
const CLASS_COLORS: Record<PlayerClassValue, Record<AuraTierValue, { base: string; secondary?: string }>> = {
  [PlayerClass.WARRIOR]: {
    [AuraTier.NONE]: { base: '' },
    [AuraTier.GLOW]: { base: CLASS_BASE_COLORS[PlayerClass.WARRIOR] },
    [AuraTier.SMALL]: { base: CLASS_BASE_COLORS[PlayerClass.WARRIOR], secondary: CLASS_SECONDARY_COLORS[PlayerClass.WARRIOR] },
    [AuraTier.MEDIUM]: { base: CLASS_BASE_COLORS[PlayerClass.WARRIOR], secondary: GOLD_COLOR },
    [AuraTier.LARGE]: { base: GOLD_COLOR, secondary: WHITE_COLOR },
  },
  [PlayerClass.THIEF]: {
    [AuraTier.NONE]: { base: '' },
    [AuraTier.GLOW]: { base: CLASS_BASE_COLORS[PlayerClass.THIEF] },
    [AuraTier.SMALL]: { base: CLASS_BASE_COLORS[PlayerClass.THIEF], secondary: CLASS_SECONDARY_COLORS[PlayerClass.THIEF] },
    [AuraTier.MEDIUM]: { base: CLASS_BASE_COLORS[PlayerClass.THIEF], secondary: GOLD_COLOR },
    [AuraTier.LARGE]: { base: GOLD_COLOR, secondary: WHITE_COLOR },
  },
};

/**
 * レベルからオーラティアを取得する
 */
export function getAuraTier(level: number): AuraTierValue {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (level >= threshold.minLevel) {
      return threshold.tier;
    }
  }
  return AuraTier.NONE;
}

/**
 * ティアと職業からオーラ設定を取得する
 */
export function getAuraConfig(tier: AuraTierValue, playerClass: PlayerClassValue): AuraConfig {
  const tierConfig = TIER_CONFIGS[tier];
  const colors = CLASS_COLORS[playerClass][tier];

  return {
    ...tierConfig,
    baseColor: colors.base,
    secondaryColor: colors.secondary,
  };
}

/**
 * プレイヤーオーラを描画する
 *
 * プレイヤースプライトの描画前に呼び出す（スプライトの背面に描画）
 */
export function drawPlayerAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  level: number,
  playerClass: PlayerClassValue,
  now: number,
): void {
  const tier = getAuraTier(level);
  if (tier === AuraTier.NONE) return;

  const config = getAuraConfig(tier, playerClass);
  const radiusPx = config.radius * tileSize;

  // 脈動計算
  const phase = (now / config.pulseSpeed) * Math.PI * 2;
  const alpha = config.maxAlpha * (0.6 + 0.4 * Math.sin(phase));

  ctx.save();
  ctx.globalAlpha = alpha;

  // ラジアルグラデーション
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radiusPx);
  const baseColor = applyAlpha(config.baseColor, 1);
  const outerColor = config.secondaryColor
    ? applyAlpha(config.secondaryColor, 0)
    : applyAlpha(config.baseColor, 0);

  gradient.addColorStop(0, baseColor);
  gradient.addColorStop(1, outerColor);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radiusPx, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
