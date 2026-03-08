/**
 * レベルアップ演出強化テスト（Phase 3-2）
 *
 * - LEVEL_UP エフェクトのパーティクル数が24に増加
 * - 螺旋パターンが適用される
 * - 金色画面フラッシュが追加される
 * - FloatingTextManager 経由でテキスト表示
 */

import { EffectManager, resetEffectIdCounter } from '../presentation/effects/effectManager';
import { EffectType } from '../presentation/effects/effectTypes';

describe('レベルアップ演出強化（Phase 3-2）', () => {
  let manager: EffectManager;

  beforeEach(() => {
    resetEffectIdCounter();
    manager = new EffectManager();
  });

  describe('LEVEL_UP エフェクト強化', () => {
    it('パーティクル数が24個になる', () => {
      // Arrange & Act
      manager.addEffect(EffectType.LEVEL_UP, 100, 100, 1000);

      // Assert
      expect(manager.getTotalParticleCount()).toBe(24);
    });

    it('金色画面フラッシュが追加される', () => {
      // Arrange & Act
      manager.addEffect(EffectType.LEVEL_UP, 100, 100, 1000);

      // Assert: flashAlpha が設定されていること
      const effects = manager.getEffects();
      const levelUpEffect = effects.find(e => e.type === EffectType.LEVEL_UP);
      expect(levelUpEffect).toBeDefined();
      expect(levelUpEffect!.flashAlpha).toBeDefined();
      expect(levelUpEffect!.flashAlpha).toBeGreaterThan(0);
    });

    it('リングエフェクトが設定される', () => {
      // Arrange & Act
      manager.addEffect(EffectType.LEVEL_UP, 100, 100, 1000);

      // Assert
      const effects = manager.getEffects();
      const levelUpEffect = effects.find(e => e.type === EffectType.LEVEL_UP);
      expect(levelUpEffect).toBeDefined();
      expect(levelUpEffect!.ringRadius).toBeDefined();
      expect(levelUpEffect!.ringMaxRadius).toBeDefined();
    });

    it('フラッシュカラーが金色である', () => {
      // Arrange & Act
      manager.addEffect(EffectType.LEVEL_UP, 100, 100, 1000);

      // Assert: フラッシュ色情報が保存されている
      const effects = manager.getEffects();
      const levelUpEffect = effects.find(e => e.type === EffectType.LEVEL_UP);
      expect(levelUpEffect).toBeDefined();
      expect(levelUpEffect!.flashColor).toBe('#fbbf24');
    });
  });
});
