/**
 * 探索報酬フィードバック強化テスト（Phase 3-3）
 *
 * - アイテム取得時のパーティクル強化（アイテム種別ごと）
 * - HPバーフラッシュ機能
 */

import {
  getItemPickupEffectConfig,
  ItemPickupEffectConfig,
} from '../presentation/effects/itemFeedback';
import { ItemType } from '../types';

describe('探索報酬フィードバック強化（Phase 3-3）', () => {
  describe('getItemPickupEffectConfig', () => {
    it('小回復: 緑パーティクル4個、上昇パターン', () => {
      const config = getItemPickupEffectConfig(ItemType.HEALTH_SMALL);
      expect(config.particleCount).toBe(4);
      expect(config.colors).toContain('#22c55e');
      expect(config.pattern).toBe('rising');
    });

    it('大回復: 緑パーティクル8個、上昇パターン', () => {
      const config = getItemPickupEffectConfig(ItemType.HEALTH_LARGE);
      expect(config.particleCount).toBe(8);
      expect(config.colors).toContain('#22c55e');
      expect(config.pattern).toBe('rising');
    });

    it('全回復: 緑パーティクル12個、上昇パターン', () => {
      const config = getItemPickupEffectConfig(ItemType.HEALTH_FULL);
      expect(config.particleCount).toBe(12);
      expect(config.colors).toContain('#22c55e');
      expect(config.pattern).toBe('rising');
    });

    it('鍵: 金パーティクル12個、螺旋パターン', () => {
      const config = getItemPickupEffectConfig(ItemType.KEY);
      expect(config.particleCount).toBe(12);
      expect(config.colors).toContain('#fbbf24');
      expect(config.pattern).toBe('spiral');
    });

    it('マップ開示: 青パーティクル8個、放射パターン', () => {
      const config = getItemPickupEffectConfig(ItemType.MAP_REVEAL);
      expect(config.particleCount).toBe(8);
      expect(config.colors).toContain('#3b82f6');
      expect(config.pattern).toBe('radial');
    });

    it('レベルアップ: デフォルトのアイテム取得設定を返す', () => {
      const config = getItemPickupEffectConfig(ItemType.LEVEL_UP);
      expect(config.particleCount).toBe(6);
      expect(config.pattern).toBe('rising');
    });
  });

  describe('HPバーフラッシュ', () => {
    it('回復系アイテムにはフラッシュ設定がある', () => {
      const small = getItemPickupEffectConfig(ItemType.HEALTH_SMALL);
      expect(small.hpBarFlash).toBeDefined();
      expect(small.hpBarFlash!.color).toBe('#22c55e');
      expect(small.hpBarFlash!.duration).toBeGreaterThan(0);
    });

    it('小回復のフラッシュ持続時間は200ms', () => {
      const config = getItemPickupEffectConfig(ItemType.HEALTH_SMALL);
      expect(config.hpBarFlash!.duration).toBe(200);
    });

    it('大回復のフラッシュ持続時間は300ms', () => {
      const config = getItemPickupEffectConfig(ItemType.HEALTH_LARGE);
      expect(config.hpBarFlash!.duration).toBe(300);
    });

    it('鍵アイテムにはフラッシュ設定がない', () => {
      const config = getItemPickupEffectConfig(ItemType.KEY);
      expect(config.hpBarFlash).toBeUndefined();
    });
  });
});
