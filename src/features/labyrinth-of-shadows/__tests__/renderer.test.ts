import { Renderer } from '../renderer';
import { GameStateFactory } from '../entity-factory';
import type { GameState } from '../types';

// Canvas 2D コンテキストのモック
const createMockCtx = (): CanvasRenderingContext2D => {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    font: '',
    textAlign: 'center',
    textBaseline: 'middle',
    shadowColor: '',
    shadowBlur: 0,
    fillRect: jest.fn(),
    fillText: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;
  return ctx;
};

// AudioContext のモック
beforeAll(() => {
  (window as { AudioContext?: typeof AudioContext }).AudioContext = jest.fn().mockImplementation(
    () => ({
      createOscillator: () => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 0 },
        type: '',
      }),
      createGain: () => ({
        connect: jest.fn(),
        gain: {
          value: 0,
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
      }),
      createStereoPanner: () => ({
        connect: jest.fn(),
        pan: { value: 0 },
      }),
      destination: {},
      currentTime: 0,
    })
  );
});

describe('labyrinth-of-shadows/renderer', () => {
  let state: GameState;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    state = GameStateFactory.create('EASY');
    ctx = createMockCtx();
  });

  describe('drawBackground', () => {
    test('背景を描画する', () => {
      Renderer.drawBackground(ctx, state, 900, 560, 0);
      expect(ctx.fillRect).toHaveBeenCalledTimes(2);
    });

    test('隠れ状態で暗い背景になる', () => {
      state.hiding = true;
      Renderer.drawBackground(ctx, state, 900, 560, 0);
      expect(ctx.fillStyle).toBe('#080812');
    });
  });

  describe('drawWalls', () => {
    test('壁を描画してzバッファを返す', () => {
      const zBuf = Renderer.drawWalls(ctx, state, 900, 560, 0.5);
      expect(zBuf).toHaveLength(100);
      expect(zBuf.every(v => typeof v === 'number')).toBe(true);
    });
  });

  describe('getSprites', () => {
    test('アクティブなスプライトを返す', () => {
      const sprites = Renderer.getSprites(state);
      // 少なくとも出口スプライトが含まれる
      expect(sprites.length).toBeGreaterThanOrEqual(1);
    });

    test('距離順でソートされている', () => {
      const sprites = Renderer.getSprites(state);
      if (sprites.length >= 2) {
        const d1 = Math.hypot(sprites[0].x - state.player.x, sprites[0].y - state.player.y);
        const d2 = Math.hypot(sprites[1].x - state.player.x, sprites[1].y - state.player.y);
        expect(d1).toBeGreaterThanOrEqual(d2);
      }
    });
  });

  describe('drawPostProcess', () => {
    test('ポストプロセス効果を描画する', () => {
      Renderer.drawPostProcess(ctx, 900, 560);
      // スキャンラインとビネットが描画される
      expect(ctx.fillRect).toHaveBeenCalled();
      expect(ctx.createRadialGradient).toHaveBeenCalled();
    });
  });

  describe('render', () => {
    test('全描画処理を実行する', () => {
      Renderer.render(ctx, state, 900, 560, 99);
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });
});
