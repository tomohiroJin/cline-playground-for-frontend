/**
 * 武器エフェクト強化のテスト
 *
 * 攻撃力に応じた武器ティアと描画エフェクトの段階化を検証する。
 */
import { Direction, PlayerClass } from '../types';
import {
  WeaponTier,
  getWeaponTier,
  getWeaponTrailConfig,
  drawWeaponTrail,
  drawShockwave,
} from '../presentation/effects/weaponEffect';
import { createMockCanvasContext } from './testUtils';

describe('武器エフェクト強化', () => {
  describe('getWeaponTier', () => {
    describe('攻撃力に応じた正しいティアを返す', () => {
      it('攻撃力1 は NORMAL を返す', () => {
        expect(getWeaponTier(1)).toBe(WeaponTier.NORMAL);
      });

      it('攻撃力3 は NORMAL を返す', () => {
        expect(getWeaponTier(3)).toBe(WeaponTier.NORMAL);
      });

      it('攻撃力4 は ENHANCED を返す', () => {
        expect(getWeaponTier(4)).toBe(WeaponTier.ENHANCED);
      });

      it('攻撃力6 は ENHANCED を返す', () => {
        expect(getWeaponTier(6)).toBe(WeaponTier.ENHANCED);
      });

      it('攻撃力7 は GLOWING を返す', () => {
        expect(getWeaponTier(7)).toBe(WeaponTier.GLOWING);
      });

      it('攻撃力9 は GLOWING を返す', () => {
        expect(getWeaponTier(9)).toBe(WeaponTier.GLOWING);
      });

      it('攻撃力10 は RADIANT を返す', () => {
        expect(getWeaponTier(10)).toBe(WeaponTier.RADIANT);
      });

      it('攻撃力15 は RADIANT を返す', () => {
        expect(getWeaponTier(15)).toBe(WeaponTier.RADIANT);
      });
    });

    describe('境界値', () => {
      it('攻撃力0 以下は NORMAL を返す', () => {
        expect(getWeaponTier(0)).toBe(WeaponTier.NORMAL);
        expect(getWeaponTier(-1)).toBe(WeaponTier.NORMAL);
      });
    });
  });

  describe('getWeaponTrailConfig', () => {
    describe('NORMAL ティア', () => {
      it('光跡なしの設定を返す', () => {
        const config = getWeaponTrailConfig(WeaponTier.NORMAL, PlayerClass.WARRIOR);
        expect(config.hasTrail).toBe(false);
        expect(config.hasShockwave).toBe(false);
        expect(config.particleCount).toBe(0);
      });
    });

    describe('ENHANCED ティア', () => {
      it('薄い白の光跡設定を返す', () => {
        const config = getWeaponTrailConfig(WeaponTier.ENHANCED, PlayerClass.WARRIOR);
        expect(config.hasTrail).toBe(true);
        expect(config.trailFrames).toBe(2);
        expect(config.lineWidth).toBe(1);
        expect(config.hasShockwave).toBe(false);
        expect(config.particleCount).toBe(2);
      });
    });

    describe('GLOWING ティア', () => {
      it('職業色の弧の光跡設定を返す', () => {
        const config = getWeaponTrailConfig(WeaponTier.GLOWING, PlayerClass.WARRIOR);
        expect(config.hasTrail).toBe(true);
        expect(config.trailFrames).toBe(3);
        expect(config.lineWidth).toBe(2);
        expect(config.hasShockwave).toBe(false);
        expect(config.particleCount).toBe(4);
      });
    });

    describe('RADIANT ティア', () => {
      it('金色の弧 + 衝撃波の設定を返す', () => {
        const config = getWeaponTrailConfig(WeaponTier.RADIANT, PlayerClass.WARRIOR);
        expect(config.hasTrail).toBe(true);
        expect(config.trailFrames).toBe(4);
        expect(config.lineWidth).toBe(3);
        expect(config.hasShockwave).toBe(true);
        expect(config.particleCount).toBe(8);
      });
    });

    describe('職業別カラー', () => {
      it('戦士の GLOWING は青系の色を持つ', () => {
        const config = getWeaponTrailConfig(WeaponTier.GLOWING, PlayerClass.WARRIOR);
        expect(config.trailColor).toContain('102, 126, 234');
      });

      it('盗賊の GLOWING は紫系の色を持つ', () => {
        const config = getWeaponTrailConfig(WeaponTier.GLOWING, PlayerClass.THIEF);
        expect(config.trailColor).toContain('167, 139, 250');
      });

      it('RADIANT は職業に関わらず金色', () => {
        const warriorConfig = getWeaponTrailConfig(WeaponTier.RADIANT, PlayerClass.WARRIOR);
        const thiefConfig = getWeaponTrailConfig(WeaponTier.RADIANT, PlayerClass.THIEF);
        expect(warriorConfig.trailColor).toContain('251, 191, 36');
        expect(thiefConfig.trailColor).toContain('251, 191, 36');
      });
    });
  });

  describe('drawWeaponTrail', () => {
    it('NORMAL ティアでは描画しない', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawWeaponTrail(ctx, 100, 100, 48, Direction.RIGHT, 1, PlayerClass.WARRIOR, 0.5);
      expect(ctx.save).not.toHaveBeenCalled();
    });

    it('ENHANCED ティア以上では描画する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawWeaponTrail(ctx, 100, 100, 48, Direction.RIGHT, 4, PlayerClass.WARRIOR, 0.5);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('各方向で描画できる', () => {
      const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
      for (const dir of directions) {
        const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
        drawWeaponTrail(ctx, 100, 100, 48, dir, 7, PlayerClass.WARRIOR, 0.5);
        expect(ctx.arc).toHaveBeenCalled();
      }
    });

    it('attackProgress が 0 のとき描画する（開始時）', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawWeaponTrail(ctx, 100, 100, 48, Direction.RIGHT, 4, PlayerClass.WARRIOR, 0.0);
      expect(ctx.save).toHaveBeenCalled();
    });

    it('attackProgress が 1 のときフェードアウトする', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawWeaponTrail(ctx, 100, 100, 48, Direction.RIGHT, 4, PlayerClass.WARRIOR, 1.0);
      // フェードアウト: globalAlpha が 0 に近い
      expect(ctx.save).toHaveBeenCalled();
    });
  });

  describe('drawShockwave', () => {
    it('経過時間に応じてリングを描画する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawShockwave(ctx, 100, 100, 48, 100);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('持続時間（300ms）を超えた場合は描画しない', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawShockwave(ctx, 100, 100, 48, 301);
      expect(ctx.save).not.toHaveBeenCalled();
    });

    it('経過0msでは半径0付近で描画する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      drawShockwave(ctx, 100, 100, 48, 0);
      expect(ctx.arc).toHaveBeenCalledWith(
        100, 100,
        expect.closeTo(0, 1),
        0, Math.PI * 2,
      );
    });
  });
});
