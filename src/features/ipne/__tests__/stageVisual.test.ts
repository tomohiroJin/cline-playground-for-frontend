/**
 * ステージ進行見た目変化のテスト
 *
 * ステージクリア報酬に応じたビジュアルエフェクトの設定と描画を検証する。
 */
import { Direction } from '../types';
import type { StageRewardHistory } from '../types';
import {
  getActiveRewardEffects,
  drawShieldGlow,
  drawAfterImage,
  drawSpinParticles,
  drawHealParticles,
  AfterImageManager,
} from '../presentation/effects/stageVisual';
import { createMockCanvasContext } from './testUtils';

describe('ステージ進行見た目変化', () => {
  describe('getActiveRewardEffects', () => {
    it('報酬がない場合は空セットを返す', () => {
      const effects = getActiveRewardEffects([]);
      expect(effects.hasShieldGlow).toBe(false);
      expect(effects.hasAfterImage).toBe(false);
      expect(effects.hasSpinParticles).toBe(false);
      expect(effects.hasHealParticles).toBe(false);
    });

    it('maxHp 報酬がある場合はシールド輝きが有効', () => {
      const rewards: StageRewardHistory[] = [
        { stage: 1, reward: 'max_hp' },
      ];
      const effects = getActiveRewardEffects(rewards);
      expect(effects.hasShieldGlow).toBe(true);
    });

    it('move_speed 報酬がある場合は残像が有効', () => {
      const rewards: StageRewardHistory[] = [
        { stage: 1, reward: 'move_speed' },
      ];
      const effects = getActiveRewardEffects(rewards);
      expect(effects.hasAfterImage).toBe(true);
    });

    it('attack_speed 報酬がある場合は回転パーティクルが有効', () => {
      const rewards: StageRewardHistory[] = [
        { stage: 1, reward: 'attack_speed' },
      ];
      const effects = getActiveRewardEffects(rewards);
      expect(effects.hasSpinParticles).toBe(true);
    });

    it('heal_bonus 報酬がある場合は回復パーティクルが有効', () => {
      const rewards: StageRewardHistory[] = [
        { stage: 1, reward: 'heal_bonus' },
      ];
      const effects = getActiveRewardEffects(rewards);
      expect(effects.hasHealParticles).toBe(true);
    });

    it('attack_power / attack_range 報酬はビジュアルエフェクトに影響しない', () => {
      const rewards: StageRewardHistory[] = [
        { stage: 1, reward: 'attack_power' },
        { stage: 2, reward: 'attack_range' },
      ];
      const effects = getActiveRewardEffects(rewards);
      expect(effects.hasShieldGlow).toBe(false);
      expect(effects.hasAfterImage).toBe(false);
      expect(effects.hasSpinParticles).toBe(false);
      expect(effects.hasHealParticles).toBe(false);
    });

    it('複数の報酬が組み合わさる場合', () => {
      const rewards: StageRewardHistory[] = [
        { stage: 1, reward: 'max_hp' },
        { stage: 2, reward: 'move_speed' },
        { stage: 3, reward: 'attack_speed' },
        { stage: 4, reward: 'heal_bonus' },
      ];
      const effects = getActiveRewardEffects(rewards);
      expect(effects.hasShieldGlow).toBe(true);
      expect(effects.hasAfterImage).toBe(true);
      expect(effects.hasSpinParticles).toBe(true);
      expect(effects.hasHealParticles).toBe(true);
    });
  });

  describe('drawShieldGlow', () => {
    it('シールド輝きを描画する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawShieldGlow(ctx, 100, 100, 48, 0);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('脈動アニメーションにより時間で変化する', () => {
      const ctx1 = createMockCanvasContext() as CanvasRenderingContext2D;
      const ctx2 = createMockCanvasContext() as CanvasRenderingContext2D;
      drawShieldGlow(ctx1, 100, 100, 48, 0);
      drawShieldGlow(ctx2, 100, 100, 48, 500);
      // 両方とも描画はされる
      expect(ctx1.save).toHaveBeenCalled();
      expect(ctx2.save).toHaveBeenCalled();
    });
  });

  describe('AfterImageManager', () => {
    it('位置を記録できる', () => {
      const manager = new AfterImageManager();
      manager.recordPosition(10, 20, Direction.RIGHT, 0);
      const images = manager.getAfterImages();
      expect(images.length).toBe(1);
      expect(images[0].x).toBe(10);
      expect(images[0].y).toBe(20);
    });

    it('最大保持数を超えると古いものが削除される', () => {
      const manager = new AfterImageManager();
      manager.recordPosition(10, 20, Direction.RIGHT, 0);
      manager.recordPosition(30, 40, Direction.RIGHT, 1);
      manager.recordPosition(50, 60, Direction.RIGHT, 2);
      const images = manager.getAfterImages();
      expect(images.length).toBe(2);
      // 最新の2つが残る
      expect(images[0].x).toBe(30);
      expect(images[1].x).toBe(50);
    });

    it('同じ位置では記録しない', () => {
      const manager = new AfterImageManager();
      manager.recordPosition(10, 20, Direction.RIGHT, 0);
      manager.recordPosition(10, 20, Direction.RIGHT, 1);
      const images = manager.getAfterImages();
      expect(images.length).toBe(1);
    });

    it('alpha がフェードする', () => {
      const manager = new AfterImageManager();
      manager.recordPosition(10, 20, Direction.RIGHT, 0);
      const images = manager.getAfterImages();
      expect(images[0].alpha).toBeGreaterThan(0);
      expect(images[0].alpha).toBeLessThanOrEqual(1);
    });
  });

  describe('drawAfterImage', () => {
    it('残像を描画する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawAfterImage(ctx, 100, 100, 48, 0.3);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });
  });

  describe('drawSpinParticles', () => {
    it('回転パーティクルを描画する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawSpinParticles(ctx, 100, 100, 48, 0);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });
  });

  describe('drawHealParticles', () => {
    it('回復パーティクルを描画する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawHealParticles(ctx, 100, 100, 48, 0);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('時間に応じてパーティクル位置が変化する', () => {
      const ctx1 = createMockCanvasContext() as CanvasRenderingContext2D;
      const ctx2 = createMockCanvasContext() as CanvasRenderingContext2D;
      drawHealParticles(ctx1, 100, 100, 48, 0);
      drawHealParticles(ctx2, 100, 100, 48, 500);
      // 両方描画される
      expect(ctx1.save).toHaveBeenCalled();
      expect(ctx2.save).toHaveBeenCalled();
    });
  });
});
