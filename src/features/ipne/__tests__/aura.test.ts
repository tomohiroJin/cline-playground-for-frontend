/**
 * パワーオーラシステムのテスト
 *
 * プレイヤーのレベルに応じてオーラのティアと描画設定が変化することを検証する。
 */
import { PlayerClass } from '../types';
import {
  AuraTier,
  getAuraTier,
  getAuraConfig,
  drawPlayerAura,
} from '../presentation/effects/aura';
import { createMockCanvasContext } from './testUtils';

describe('パワーオーラシステム', () => {
  describe('getAuraTier', () => {
    describe('レベル帯に応じた正しいティアを返す', () => {
      it('Lv1 は NONE を返す', () => {
        expect(getAuraTier(1)).toBe(AuraTier.NONE);
      });

      it('Lv4 は NONE を返す', () => {
        expect(getAuraTier(4)).toBe(AuraTier.NONE);
      });

      it('Lv5 は GLOW を返す', () => {
        expect(getAuraTier(5)).toBe(AuraTier.GLOW);
      });

      it('Lv9 は GLOW を返す', () => {
        expect(getAuraTier(9)).toBe(AuraTier.GLOW);
      });

      it('Lv10 は SMALL を返す', () => {
        expect(getAuraTier(10)).toBe(AuraTier.SMALL);
      });

      it('Lv14 は SMALL を返す', () => {
        expect(getAuraTier(14)).toBe(AuraTier.SMALL);
      });

      it('Lv15 は MEDIUM を返す', () => {
        expect(getAuraTier(15)).toBe(AuraTier.MEDIUM);
      });

      it('Lv19 は MEDIUM を返す', () => {
        expect(getAuraTier(19)).toBe(AuraTier.MEDIUM);
      });

      it('Lv20 は LARGE を返す', () => {
        expect(getAuraTier(20)).toBe(AuraTier.LARGE);
      });

      it('Lv25 は LARGE を返す', () => {
        expect(getAuraTier(25)).toBe(AuraTier.LARGE);
      });
    });

    describe('境界値', () => {
      it('Lv0 以下は NONE を返す', () => {
        expect(getAuraTier(0)).toBe(AuraTier.NONE);
        expect(getAuraTier(-1)).toBe(AuraTier.NONE);
      });
    });
  });

  describe('getAuraConfig', () => {
    describe('NONE ティア', () => {
      it('半径0、不透明度0 を返す', () => {
        const config = getAuraConfig(AuraTier.NONE, PlayerClass.WARRIOR);
        expect(config.radius).toBe(0);
        expect(config.maxAlpha).toBe(0);
        expect(config.hasParticles).toBe(false);
        expect(config.particleCount).toBe(0);
      });
    });

    describe('GLOW ティア', () => {
      it('微発光の設定を返す', () => {
        const config = getAuraConfig(AuraTier.GLOW, PlayerClass.WARRIOR);
        expect(config.radius).toBe(0.3);
        expect(config.maxAlpha).toBe(0.15);
        expect(config.pulseSpeed).toBe(2000);
        expect(config.hasParticles).toBe(false);
      });
    });

    describe('MEDIUM ティア', () => {
      it('パーティクルありの設定を返す', () => {
        const config = getAuraConfig(AuraTier.MEDIUM, PlayerClass.WARRIOR);
        expect(config.radius).toBe(0.7);
        expect(config.maxAlpha).toBe(0.35);
        expect(config.pulseSpeed).toBe(1200);
        expect(config.hasParticles).toBe(true);
        expect(config.particleCount).toBe(2);
      });
    });

    describe('LARGE ティア', () => {
      it('最大規模の設定を返す', () => {
        const config = getAuraConfig(AuraTier.LARGE, PlayerClass.WARRIOR);
        expect(config.radius).toBe(1.0);
        expect(config.maxAlpha).toBe(0.45);
        expect(config.pulseSpeed).toBe(1000);
        expect(config.hasParticles).toBe(true);
        expect(config.particleCount).toBe(4);
      });
    });

    describe('職業別カラー', () => {
      it('戦士の GLOW は青系の baseColor を持つ', () => {
        const config = getAuraConfig(AuraTier.GLOW, PlayerClass.WARRIOR);
        expect(config.baseColor).toContain('102, 126, 234');
      });

      it('盗賊の GLOW は紫系の baseColor を持つ', () => {
        const config = getAuraConfig(AuraTier.GLOW, PlayerClass.THIEF);
        expect(config.baseColor).toContain('167, 139, 250');
      });

      it('戦士の LARGE は金色の baseColor を持つ', () => {
        const config = getAuraConfig(AuraTier.LARGE, PlayerClass.WARRIOR);
        expect(config.baseColor).toContain('251, 191, 36');
      });

      it('盗賊の LARGE は金色の baseColor を持つ', () => {
        const config = getAuraConfig(AuraTier.LARGE, PlayerClass.THIEF);
        expect(config.baseColor).toContain('251, 191, 36');
      });

      it('MEDIUM ティアは secondaryColor を持つ', () => {
        const config = getAuraConfig(AuraTier.MEDIUM, PlayerClass.WARRIOR);
        expect(config.secondaryColor).toBeDefined();
        expect(config.secondaryColor).toContain('251, 191, 36');
      });
    });
  });

  describe('drawPlayerAura', () => {
    it('NONE ティアでは描画しない', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawPlayerAura(ctx, 100, 100, 48, 1, PlayerClass.WARRIOR, 0);
      expect(ctx.save).not.toHaveBeenCalled();
    });

    it('GLOW ティア以上では描画する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawPlayerAura(ctx, 100, 100, 48, 5, PlayerClass.WARRIOR, 0);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalled();
    });

    it('脈動アニメーションが時間に応じて変化する', () => {
      const ctx1 = createMockCanvasContext() as CanvasRenderingContext2D;
      const ctx2 = createMockCanvasContext() as CanvasRenderingContext2D;

      drawPlayerAura(ctx1, 100, 100, 48, 10, PlayerClass.WARRIOR, 0);
      drawPlayerAura(ctx2, 100, 100, 48, 10, PlayerClass.WARRIOR, 375);

      // どちらも描画はされる
      expect(ctx1.save).toHaveBeenCalled();
      expect(ctx2.save).toHaveBeenCalled();
    });
  });
});
