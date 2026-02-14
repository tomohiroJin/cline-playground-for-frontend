import { EffectManager, resetEffectIdCounter } from './effectManager';
import { EffectType } from './effectTypes';

describe('EffectManager', () => {
  let manager: EffectManager;

  beforeEach(() => {
    manager = new EffectManager();
    resetEffectIdCounter();
  });

  describe('addEffect', () => {
    it('エフェクトを追加できる', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);
      expect(manager.getEffectCount()).toBe(1);
    });

    it('複数のエフェクトを追加できる', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);
      manager.addEffect(EffectType.DAMAGE, 150, 250, 1000);
      manager.addEffect(EffectType.ITEM_PICKUP, 200, 300, 1000);
      expect(manager.getEffectCount()).toBe(3);
    });

    it('各エフェクトタイプのパーティクルが正しく生成される', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);
      // 攻撃ヒットエフェクトは 8 個のパーティクル
      expect(manager.getTotalParticleCount()).toBe(8);
    });

    it('ダメージエフェクトのパーティクルが生成される', () => {
      manager.addEffect(EffectType.DAMAGE, 100, 200, 1000);
      // ダメージエフェクトは 6 個のパーティクル
      expect(manager.getTotalParticleCount()).toBe(6);
    });

    it('ボス撃破エフェクトのパーティクルが生成される', () => {
      manager.addEffect(EffectType.BOSS_KILL, 100, 200, 1000);
      // ボス撃破エフェクトは 24 個のパーティクル
      expect(manager.getTotalParticleCount()).toBe(24);
    });

    it('アイテム取得エフェクトのパーティクルが生成される', () => {
      manager.addEffect(EffectType.ITEM_PICKUP, 100, 200, 1000);
      expect(manager.getTotalParticleCount()).toBe(6);
    });

    it('レベルアップエフェクトのパーティクルが生成される', () => {
      manager.addEffect(EffectType.LEVEL_UP, 100, 200, 1000);
      expect(manager.getTotalParticleCount()).toBe(12);
    });

    it('罠エフェクトのパーティクルが生成される', () => {
      manager.addEffect(EffectType.TRAP_DAMAGE, 100, 200, 1000);
      expect(manager.getTotalParticleCount()).toBe(6);

      manager.addEffect(EffectType.TRAP_SLOW, 100, 200, 1000);
      expect(manager.getTotalParticleCount()).toBe(14); // 6 + 8

      manager.addEffect(EffectType.TRAP_TELEPORT, 100, 200, 1000);
      expect(manager.getTotalParticleCount()).toBe(24); // 6 + 8 + 10
    });
  });

  describe('update', () => {
    it('持続時間を超えたエフェクトが削除される', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);
      expect(manager.getEffectCount()).toBe(1);

      // 攻撃ヒットの持続時間は 300ms
      manager.update(0.1, 1400);
      expect(manager.getEffectCount()).toBe(0);
    });

    it('持続時間内のエフェクトは保持される', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);

      // 100ms 後（持続時間 300ms 以内）
      manager.update(0.1, 1100);
      expect(manager.getEffectCount()).toBe(1);
    });

    it('複数エフェクトのうち期限切れのものだけ削除される', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000); // 300ms
      manager.addEffect(EffectType.LEVEL_UP, 150, 250, 1000); // 800ms

      // 500ms 後: 攻撃ヒット(300ms)は期限切れ、レベルアップ(800ms)は残る
      manager.update(0.5, 1500);
      expect(manager.getEffectCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('全エフェクトをクリアできる', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);
      manager.addEffect(EffectType.DAMAGE, 150, 250, 1000);
      manager.addEffect(EffectType.LEVEL_UP, 200, 300, 1000);
      expect(manager.getEffectCount()).toBe(3);

      manager.clear();
      expect(manager.getEffectCount()).toBe(0);
      expect(manager.getTotalParticleCount()).toBe(0);
    });
  });

  describe('パーティクル上限', () => {
    it('パーティクル数が上限を超えた場合、古いエフェクトから削除される', () => {
      // 各ボス撃破エフェクトは 24 パーティクル
      // 200 / 24 ≒ 8.3 なので 9 個追加すると上限を超える
      for (let i = 0; i < 9; i++) {
        manager.addEffect(EffectType.BOSS_KILL, 100, 200, 1000 + i);
      }

      // 上限 200 を超えないようにエフェクトが削減されている
      expect(manager.getTotalParticleCount()).toBeLessThanOrEqual(200);
    });
  });
});
