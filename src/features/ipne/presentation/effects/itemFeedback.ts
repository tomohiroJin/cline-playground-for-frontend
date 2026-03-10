/**
 * アイテム取得フィードバック設定
 *
 * アイテム種別ごとのパーティクルとHPバーフラッシュの設定を提供する。
 */

import { ItemTypeValue, ItemType } from '../../types';

/** HPバーフラッシュ設定 */
export interface HpBarFlashConfig {
  /** フラッシュの色 */
  color: string;
  /** 持続時間（ms） */
  duration: number;
}

/** アイテム取得エフェクト設定 */
export interface ItemPickupEffectConfig {
  /** パーティクル数 */
  particleCount: number;
  /** 色配列 */
  colors: string[];
  /** パーティクルパターン */
  pattern: 'rising' | 'spiral' | 'radial';
  /** HPバーフラッシュ設定（回復系のみ） */
  hpBarFlash?: HpBarFlashConfig;
  /** フローティングテキスト */
  floatingText?: string;
}

/**
 * アイテム種別に応じたエフェクト設定を返す
 */
export function getItemPickupEffectConfig(itemType: ItemTypeValue): ItemPickupEffectConfig {
  switch (itemType) {
    case ItemType.HEALTH_SMALL:
      return {
        particleCount: 4,
        colors: ['#22c55e', '#4ade80', '#86efac'],
        pattern: 'rising',
        hpBarFlash: { color: '#22c55e', duration: 200 },
      };
    case ItemType.HEALTH_LARGE:
      return {
        particleCount: 8,
        colors: ['#22c55e', '#4ade80', '#86efac', '#ffffff'],
        pattern: 'rising',
        hpBarFlash: { color: '#22c55e', duration: 300 },
      };
    case ItemType.HEALTH_FULL:
      return {
        particleCount: 12,
        colors: ['#22c55e', '#4ade80', '#86efac', '#ffffff'],
        pattern: 'rising',
        hpBarFlash: { color: '#22c55e', duration: 400 },
      };
    case ItemType.KEY:
      return {
        particleCount: 12,
        colors: ['#fbbf24', '#fcd34d', '#fef08a'],
        pattern: 'spiral',
        floatingText: 'KEY GET!',
      };
    case ItemType.MAP_REVEAL:
      return {
        particleCount: 8,
        colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
        pattern: 'radial',
        floatingText: 'MAP REVEALED',
      };
    default:
      // レベルアップ等のデフォルト
      return {
        particleCount: 6,
        colors: ['#fbbf24', '#fcd34d', '#fef08a'],
        pattern: 'rising',
      };
  }
}
