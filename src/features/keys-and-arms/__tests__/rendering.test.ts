/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — 描画ヘルパーテスト
 */
import { createRendering } from '../core/rendering';

/** Canvas 2D コンテキストのモック */
function createMockCtx() {
  return {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    ellipse: jest.fn(),
    quadraticCurveTo: jest.fn(),
    setLineDash: jest.fn(),
    set lineDashOffset(_v) {},
  };
}

describe('rendering ヘルパー', () => {
  let ctx;
  let draw;

  beforeEach(() => {
    ctx = createMockCtx();
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
      const fillCalls = ctx.fillRect.mock.calls;
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
