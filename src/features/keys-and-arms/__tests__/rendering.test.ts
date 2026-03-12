/**
 * KEYS & ARMS — 描画ヘルパーテスト
 */
import { createRendering } from '../core/rendering';
import type { DrawingAPI } from '../types';
import { createMockCanvasContext } from './helpers/mock-factories';

describe('rendering ヘルパー', () => {
  let ctx: CanvasRenderingContext2D;
  let draw: DrawingAPI;

  beforeEach(() => {
    ctx = createMockCanvasContext();
    draw = createRendering(ctx);
  });

  describe('onFill', () => {
    it('fillStyleとglobalAlphaを設定する', () => {
      draw.onFill(0.5);
      expect(ctx.fillStyle).toBe('#1a2810');
      expect(ctx.globalAlpha).toBe(0.5);
    });
  });

  describe('R', () => {
    it('矩形を描画する（on状態）', () => {
      draw.R(10, 20, 30, 40, true);
      expect(ctx.fillStyle).toBe('#1a2810');
      expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 30, 40);
    });

    it('矩形を描画する（off状態）', () => {
      draw.R(10, 20, 30, 40, false);
      expect(ctx.fillStyle).toBe('rgba(80,92,64,0.14)');
      expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 30, 40);
    });
  });

  describe('txt', () => {
    it('テキストを描画する', () => {
      draw.txt('Hello', 10, 20, 8);
      expect(ctx.font).toBe('8px "Press Start 2P"');
      expect(ctx.textAlign).toBe('left');
      expect(ctx.textBaseline).toBe('top');
      expect(ctx.fillText).toHaveBeenCalledWith('Hello', 10, 20);
    });
  });

  describe('txtC', () => {
    it('中央揃えテキストを描画する', () => {
      draw.txtC('Center', 100, 50, 12);
      expect(ctx.textAlign).toBe('center');
      expect(ctx.fillText).toHaveBeenCalledWith('Center', 100, 50);
    });
  });

  describe('circle', () => {
    it('円を描画する', () => {
      draw.circle(100, 200, 30);
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalledWith(100, 200, 30, 0, Math.PI * 2);
      expect(ctx.fill).toHaveBeenCalled();
    });
  });

  describe('px', () => {
    it('スプライトを描画する', () => {
      const sprite = [[1, 0, 1], [0, 1, 0]];
      draw.px(sprite, 10, 20, 2, true);
      // 1のピクセルのみ描画される（3つの1があるので3回fillRect）
      const fillCalls = (ctx.fillRect as jest.Mock).mock.calls;
      expect(fillCalls.length).toBe(3);
    });

    it('フリップしたスプライトを描画する', () => {
      const sprite = [[1, 0], [0, 1]];
      draw.px(sprite, 0, 0, 1, true, true);
      // フリップ時: [0,1] → c=0→w-1-0=1→data[0][1]=0(skip), c=1→w-1-1=0→data[0][0]=1(draw)
      // 2行目: c=0→data[1][1]=1(draw), c=1→data[1][0]=0(skip)
      expect(ctx.fillRect).toHaveBeenCalledTimes(2);
    });
  });
});
