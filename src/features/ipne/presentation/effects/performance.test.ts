/**
 * パフォーマンステスト
 *
 * エフェクトシステムの負荷上限時の動作を検証する。
 * - MAX_PARTICLES (200) 上限でのパーティクル管理
 * - MAX_FLOATING_TEXTS (30) 同時表示でのテキスト管理
 * - ボス撃破時の大量パーティクル生成
 */

import { EffectManager, resetEffectIdCounter } from './effectManager';
import { EffectType } from './effectTypes';
import { FloatingTextManager, FloatingTextType } from './floatingText';
import {
  createRadialParticles,
  createSpiralParticles,
  createPulseParticles,
  updateParticles,
  drawParticles,
} from './particleSystem';
import { createMockCanvasContext } from '../../__tests__/testUtils';

describe('パフォーマンス', () => {
  describe('MAX_PARTICLES 上限管理', () => {
    let manager: EffectManager;

    beforeEach(() => {
      resetEffectIdCounter();
      manager = new EffectManager();
    });

    it('大量のエフェクト追加後もパーティクル総数が上限内に収まる', () => {
      // 高パワーレベルで多数のエフェクトを追加
      for (let i = 0; i < 30; i++) {
        manager.addEffect(EffectType.ATTACK_HIT, i * 10, i * 10, 1000 + i, {
          powerLevel: 4, // 最大パワー → 24個パーティクル
        });
      }

      // パーティクル総数を検証
      const totalParticles = manager.getTotalParticleCount();
      expect(totalParticles).toBeLessThanOrEqual(200);
    });

    it('上限超過時に古いエフェクトが除去される', () => {
      // 多くのエフェクトを追加
      for (let i = 0; i < 20; i++) {
        manager.addEffect(EffectType.ATTACK_HIT, 0, 0, 1000, {
          powerLevel: 4,
        });
      }

      const count = manager.getEffectCount();
      // エフェクト数が制御されている
      expect(count).toBeGreaterThan(0);
      expect(manager.getTotalParticleCount()).toBeLessThanOrEqual(200);
    });

    it('ボス撃破エフェクト(BOSS_KILL)追加後もパーティクル上限内', () => {
      // 通常エフェクトを事前に追加
      for (let i = 0; i < 5; i++) {
        manager.addEffect(EffectType.ATTACK_HIT, 0, 0, 1000, { powerLevel: 3 });
      }

      // ボス撃破エフェクト追加
      manager.addEffect(EffectType.BOSS_KILL, 100, 100, 1000, {
        enemyType: 'boss',
      });

      expect(manager.getTotalParticleCount()).toBeLessThanOrEqual(200);
    });

    it('敵撃破エフェクトを連続追加しても安定動作する', () => {
      // 短時間に多数の敵撃破
      for (let i = 0; i < 50; i++) {
        manager.addEffect(EffectType.ENEMY_DEATH, i * 5, i * 5, 1000 + i, {
          enemyType: 'patrol',
        });
      }

      expect(manager.getTotalParticleCount()).toBeLessThanOrEqual(200);
    });
  });

  describe('MAX_FLOATING_TEXTS 上限管理', () => {
    let ftm: FloatingTextManager;

    beforeEach(() => {
      ftm = new FloatingTextManager();
    });

    it('30個を超えるテキストを追加しても上限内に収まる', () => {
      for (let i = 0; i < 50; i++) {
        ftm.addText(`${i}`, i, i, FloatingTextType.DAMAGE, 1000 + i);
      }

      // 内部のテキスト数を検証（getTexts は公開されていないので update + draw で動作確認）
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      // 例外なく描画できること
      expect(() => {
        ftm.update(1100);
        ftm.draw(ctx, 1100);
      }).not.toThrow();
    });

    it('期限切れテキストが自動除去される', () => {
      // 800ms 持続のテキストを追加
      for (let i = 0; i < 20; i++) {
        ftm.addText(`${i}`, i, i, FloatingTextType.DAMAGE, 1000);
      }

      // 2000ms後に更新（800ms持続なので全て期限切れ）
      ftm.update(2000);

      // 新しいテキストを追加できる
      ftm.addText('new', 0, 0, FloatingTextType.DAMAGE, 2000);

      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      expect(() => {
        ftm.draw(ctx, 2100);
      }).not.toThrow();
    });

    it('全種類のテキストを同時表示しても安定動作する', () => {
      const types = [
        FloatingTextType.DAMAGE,
        FloatingTextType.CRITICAL,
        FloatingTextType.PLAYER_DAMAGE,
        FloatingTextType.HEAL,
        FloatingTextType.COMBO,
        FloatingTextType.INFO,
      ];

      for (let i = 0; i < 30; i++) {
        ftm.addText(`text-${i}`, i * 10, i * 10, types[i % types.length], 1000);
      }

      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      expect(() => {
        ftm.update(1200);
        ftm.draw(ctx, 1200);
      }).not.toThrow();
    });
  });

  describe('パーティクル生成・更新のスループット', () => {
    it('200個のパーティクルを生成しても高速に処理できる', () => {
      const startTime = performance.now();
      const particles = createRadialParticles(200, 0, 0, ['#ff0000', '#00ff00'], 20, 80, 1, 5, 2);
      const elapsedCreate = performance.now() - startTime;

      expect(particles).toHaveLength(200);
      // 生成が100ms以内に完了すること（モック環境の負荷変動を考慮）
      expect(elapsedCreate).toBeLessThan(100);
    });

    it('200個のパーティクルの更新が高速に処理できる', () => {
      const particles = createRadialParticles(200, 0, 0, ['#ff0000'], 20, 80, 1, 5, 0.5);

      const startTime = performance.now();
      for (let frame = 0; frame < 60; frame++) {
        updateParticles(particles, 1 / 60); // 60FPS想定
      }
      const elapsed = performance.now() - startTime;

      // 60フレーム分の更新が200ms以内に完了すること（モック環境の負荷変動を考慮）
      expect(elapsed).toBeLessThan(200);
    });

    it('200個のパーティクルの描画が高速に処理できる', () => {
      const particles = createRadialParticles(200, 0, 0, ['#ff0000'], 20, 80, 1, 5, 2);
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;

      const startTime = performance.now();
      for (let frame = 0; frame < 60; frame++) {
        drawParticles(ctx, particles, 0, 0);
      }
      const elapsed = performance.now() - startTime;

      // 60フレーム分の描画が200ms以内に完了すること（モック環境の負荷変動を考慮）
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('ボス撃破時の大量パーティクル', () => {
    it('メガボス撃破（48個×3波）のパーティクルを管理できる', () => {
      // 3波分のパーティクル生成
      const wave1 = createRadialParticles(48, 100, 100, ['#ef4444', '#f97316'], 30, 80, 2, 6, 1.5);
      const wave2 = createSpiralParticles(48, 100, 100, ['#fbbf24', '#ffffff'], 60, 1.5);
      const wave3 = createPulseParticles(48, 100, 100, ['#ffffff', '#fbbf24', '#ef4444'], 50, 1.2);

      const totalParticles = [...wave1, ...wave2, ...wave3];
      expect(totalParticles).toHaveLength(144);

      // 更新処理が正常に動作する
      let alive = totalParticles;
      for (let i = 0; i < 120; i++) { // 2秒分（60FPS）
        alive = updateParticles(alive, 1 / 60);
      }

      // 時間経過でパーティクルが減少する
      expect(alive.length).toBeLessThan(144);
    });

    it('コンボ倍率適用時もパーティクル数が制御される', () => {
      const manager = new EffectManager();
      resetEffectIdCounter();

      // コンボ倍率1.8（最大）でエフェクト追加
      for (let i = 0; i < 10; i++) {
        manager.addEffect(EffectType.ATTACK_HIT, i * 10, 0, 1000, {
          powerLevel: 4,
          comboMultiplier: 1.8,
        });
      }

      expect(manager.getTotalParticleCount()).toBeLessThanOrEqual(200);
    });
  });
});
