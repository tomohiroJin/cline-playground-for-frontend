// game-draw.ts のカウントダウン/GO! 描画テスト。
//
// フィードバック「スタート時にカウントダウンが無く突然始まる」対応で、
// キャンペーンの canvas-renderer から呼ばれる drawCountdown / drawGo の
// 描画内容（特にカウント値のクランプ）を保証する。

import { drawCountdown, drawGo } from './game-draw';
import { Config } from './constants';

/** fillText の呼び出し引数だけを記録する軽量モック ctx */
const createMockCtx = () => {
  const fillTextCalls: string[] = [];
  const ctx = {
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect: jest.fn(),
    fillText: jest.fn((text: string) => {
      fillTextCalls.push(text);
    }),
  } as unknown as CanvasRenderingContext2D;
  return { ctx, fillTextCalls };
};

const WIDTH = 900;
const HEIGHT = 700;
const COUNTDOWN = Config.timing.countdown; // 3500ms

describe('drawCountdown', () => {
  it('開始直後（elapsed=0）は "4" ではなく "3" を表示する（クランプ）', () => {
    const { ctx, fillTextCalls } = createMockCtx();
    drawCountdown(ctx, 0, WIDTH, HEIGHT);
    expect(fillTextCalls).toContain('3');
    expect(fillTextCalls).not.toContain('4');
  });

  it('残り約 2 秒で "2"、残り約 1 秒で "1" を表示する', () => {
    const { ctx: ctx2, fillTextCalls: calls2 } = createMockCtx();
    drawCountdown(ctx2, COUNTDOWN - 1500, WIDTH, HEIGHT); // 残り 1500ms → ceil=2
    expect(calls2).toContain('2');

    const { ctx: ctx1, fillTextCalls: calls1 } = createMockCtx();
    drawCountdown(ctx1, COUNTDOWN - 500, WIDTH, HEIGHT); // 残り 500ms → ceil=1
    expect(calls1).toContain('1');
  });

  it('カウントダウン終了後（elapsed >= countdown）は数字を表示しない', () => {
    const { ctx, fillTextCalls } = createMockCtx();
    drawCountdown(ctx, COUNTDOWN + 100, WIDTH, HEIGHT);
    expect(fillTextCalls).toHaveLength(0);
  });
});

describe('drawGo', () => {
  it('"GO!" を表示する', () => {
    const { ctx, fillTextCalls } = createMockCtx();
    drawGo(ctx, WIDTH, HEIGHT);
    expect(fillTextCalls).toContain('GO!');
  });
});
