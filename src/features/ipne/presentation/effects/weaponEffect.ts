/**
 * 武器エフェクト強化
 *
 * 攻撃力に応じて攻撃時の武器エフェクトが強化される。
 * 斬撃/突き部分の光跡と衝撃波を段階的に追加する。
 */

import { DirectionValue, Direction, PlayerClassValue } from '../../types';
import { applyAlpha, CLASS_BASE_COLORS, GOLD_COLOR, WHITE_COLOR } from './colorUtils';

/** 武器ティア */
export const WeaponTier = {
  NORMAL: 'normal',
  ENHANCED: 'enhanced',
  GLOWING: 'glowing',
  RADIANT: 'radiant',
} as const;

export type WeaponTierValue = (typeof WeaponTier)[keyof typeof WeaponTier];

/** 武器光跡設定 */
export interface WeaponTrailConfig {
  /** 光跡の有無 */
  hasTrail: boolean;
  /** 光跡のフレーム数 */
  trailFrames: number;
  /** 光跡の線幅（px） */
  lineWidth: number;
  /** 光跡の色（CSS色文字列） */
  trailColor: string;
  /** 衝撃波の有無 */
  hasShockwave: boolean;
  /** 追加パーティクル数 */
  particleCount: number;
  /** パーティクル色配列 */
  particleColors: string[];
}

/** 衝撃波の最大持続時間（ms） */
const SHOCKWAVE_DURATION = 300;

/**
 * 攻撃力から武器ティアを取得する
 */
export function getWeaponTier(attackPower: number): WeaponTierValue {
  if (attackPower >= 10) return WeaponTier.RADIANT;
  if (attackPower >= 7) return WeaponTier.GLOWING;
  if (attackPower >= 4) return WeaponTier.ENHANCED;
  return WeaponTier.NORMAL;
}

/** 職業別光跡カラー（共通定数を参照） */
const CLASS_TRAIL_COLORS = CLASS_BASE_COLORS;

/**
 * ティアと職業から武器光跡設定を取得する
 */
export function getWeaponTrailConfig(tier: WeaponTierValue, playerClass: PlayerClassValue): WeaponTrailConfig {
  switch (tier) {
    case WeaponTier.NORMAL:
      return {
        hasTrail: false,
        trailFrames: 0,
        lineWidth: 0,
        trailColor: '',
        hasShockwave: false,
        particleCount: 0,
        particleColors: [],
      };

    case WeaponTier.ENHANCED:
      return {
        hasTrail: true,
        trailFrames: 2,
        lineWidth: 1,
        trailColor: WHITE_COLOR,
        hasShockwave: false,
        particleCount: 2,
        particleColors: ['#ffffff', '#eeeeee'],
      };

    case WeaponTier.GLOWING:
      return {
        hasTrail: true,
        trailFrames: 3,
        lineWidth: 2,
        trailColor: CLASS_TRAIL_COLORS[playerClass],
        hasShockwave: false,
        particleCount: 4,
        particleColors: [
          applyAlpha(CLASS_TRAIL_COLORS[playerClass], 1),
          '#ffffff',
        ],
      };

    case WeaponTier.RADIANT:
      return {
        hasTrail: true,
        trailFrames: 4,
        lineWidth: 3,
        trailColor: GOLD_COLOR,
        hasShockwave: true,
        particleCount: 8,
        particleColors: [
          applyAlpha(GOLD_COLOR, 1),
          '#ffffff',
        ],
      };
  }
}

/** 方向別の弧の基本角度（ラジアン） */
const DIRECTION_BASE_ANGLES: Record<DirectionValue, number> = {
  [Direction.RIGHT]: 0,
  [Direction.DOWN]: Math.PI / 2,
  [Direction.LEFT]: Math.PI,
  [Direction.UP]: -Math.PI / 2,
};

/**
 * 攻撃時の武器光跡を描画する
 *
 * 攻撃アニメーション中のみ有効。
 */
export function drawWeaponTrail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  direction: DirectionValue,
  attackPower: number,
  playerClass: PlayerClassValue,
  attackProgress: number,
): void {
  const tier = getWeaponTier(attackPower);
  if (tier === WeaponTier.NORMAL) return;

  const config = getWeaponTrailConfig(tier, playerClass);
  const baseAngle = DIRECTION_BASE_ANGLES[direction];

  // 弧のスイープ角度（攻撃進行度に応じて拡大）
  const sweepAngle = Math.PI * 0.8 * Math.min(attackProgress + 0.2, 1.0);
  const startAngle = baseAngle - sweepAngle / 2;
  const endAngle = baseAngle + sweepAngle / 2;

  // フェードアウト
  const alpha = Math.max(0, 1.0 - attackProgress);
  const arcRadius = tileSize * 0.6;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = applyAlpha(config.trailColor, alpha);
  ctx.lineWidth = config.lineWidth;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(x, y, arcRadius, startAngle, endAngle);
  ctx.stroke();

  ctx.restore();
}

/**
 * 攻撃ヒット時の衝撃波リングを描画する（RADIANT ティアのみ）
 */
export function drawShockwave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  elapsed: number,
): void {
  if (elapsed > SHOCKWAVE_DURATION) return;

  const progress = elapsed / SHOCKWAVE_DURATION;
  const maxRadius = tileSize * 1.5;
  const radius = progress * maxRadius;
  const lineWidth = 3 - progress * 2;
  const alpha = 0.8 * (1.0 - progress);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = applyAlpha(GOLD_COLOR, alpha);
  ctx.lineWidth = Math.max(1, lineWidth);

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
