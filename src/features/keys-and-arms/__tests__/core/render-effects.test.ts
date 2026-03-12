import { describe, it, expect, vi } from 'vitest';
import { createRenderEffects } from '../../core/render-effects';

/** テスト用の最小 Canvas2D モック */
function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    fillStyle: '',
    fillRect: vi.fn(),
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

/** テスト用のテキスト描画関数 */
function createMockDraw() {
  return {
    onFill: vi.fn(),
    txtC: vi.fn(),
  };
}

describe('RenderEffects', () => {
  describe('applyScreenShake', () => {
    it('shakeT > 0 のとき translate が呼ばれる', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.applyScreenShake(5, 0);

      // Assert
      expect(ctx.translate).toHaveBeenCalled();
    });

    it('shakeT = 0 かつ quake = 0 のとき translate が呼ばれない', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.applyScreenShake(0, 0);

      // Assert
      expect(ctx.translate).not.toHaveBeenCalled();
    });
  });

  describe('drawScanlines', () => {
    it('スキャンラインを描画する', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.drawScanlines();

      // Assert
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe('drawBeatPulse', () => {
    it('beatPulse > 0 のとき描画する', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.drawBeatPulse(3);

      // Assert
      expect(draw.onFill).toHaveBeenCalled();
    });

    it('beatPulse = 0 のとき描画しない', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.drawBeatPulse(0);

      // Assert
      expect(draw.onFill).not.toHaveBeenCalled();
    });
  });

  describe('drawDamageFlash', () => {
    it('hurtFlash > 0 のときダメージフラッシュを描画する', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.drawDamageFlash(3);

      // Assert
      expect(ctx.fillRect).toHaveBeenCalled();
    });

    it('hurtFlash = 0 のとき描画しない', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.drawDamageFlash(0);

      // Assert
      expect(ctx.fillRect).not.toHaveBeenCalled();
    });
  });

  describe('drawHitStopFlash', () => {
    it('hitStop > 0 のときフラッシュを描画する', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.drawHitStopFlash(2);

      // Assert
      expect(ctx.fillRect).toHaveBeenCalled();
      expect(ctx.globalAlpha).toBe(1);
    });

    it('hitStop = 0 のとき描画しない', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.drawHitStopFlash(0);

      // Assert
      expect(ctx.fillRect).not.toHaveBeenCalled();
    });
  });

  describe('drawLCDBevel', () => {
    it('LCD ベゼル影を描画する', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.drawLCDBevel();

      // Assert
      expect(draw.onFill).toHaveBeenCalledWith(.03);
      expect(ctx.fillRect).toHaveBeenCalled();
      expect(ctx.globalAlpha).toBe(1);
    });
  });

  describe('drawPauseOverlay', () => {
    it('ポーズ中にオーバーレイを描画する', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.drawPauseOverlay(10);

      // Assert
      expect(draw.txtC).toHaveBeenCalledWith('PAUSED', expect.any(Number), expect.any(Number), 16);
    });
  });

  describe('drawResetConfirmOverlay', () => {
    it('リセット確認オーバーレイを描画する', () => {
      // Arrange
      const ctx = createMockCtx();
      const draw = createMockDraw();
      const effects = createRenderEffects(ctx, draw.onFill, draw.txtC);

      // Act
      effects.drawResetConfirmOverlay(10);

      // Assert
      expect(draw.txtC).toHaveBeenCalledWith('RETURN TO TITLE?', expect.any(Number), expect.any(Number), 10);
    });
  });
});
