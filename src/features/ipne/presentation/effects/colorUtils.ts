/**
 * エフェクト共通カラーユーティリティ
 *
 * オーラ・武器エフェクト等で共有する色操作関数と定数。
 */

import { PlayerClassValue, PlayerClass } from '../../types';

/**
 * 色テンプレートのアルファプレースホルダーを実際の値に置換する
 *
 * @example applyAlpha('rgba(102, 126, 234, {a})', 0.5) → 'rgba(102, 126, 234, 0.500)'
 */
export function applyAlpha(colorTemplate: string, alpha: number): string {
  return colorTemplate.replace('{a}', alpha.toFixed(3));
}

/** 職業別の基本カラーテンプレート */
export const CLASS_BASE_COLORS: Record<PlayerClassValue, string> = {
  [PlayerClass.WARRIOR]: 'rgba(102, 126, 234, {a})',
  [PlayerClass.THIEF]: 'rgba(167, 139, 250, {a})',
};

/** 金色テンプレート */
export const GOLD_COLOR = 'rgba(251, 191, 36, {a})';

/** 白色テンプレート */
export const WHITE_COLOR = 'rgba(255, 255, 255, {a})';
