/**
 * 原始進化録 - PRIMAL PATH - スプライトサイズ拡大テスト
 *
 * 仕様書に基づくスプライトサイズの検証。
 */
import { drawPlayer, drawAlly, drawEnemy, drawTitle, drawEnemyHpBar } from '../sprites';
import { SPRITE_SCALE, PLAYER_BASE, ALLY_BASE, ENEMY_BASE, BOSS_BASE, TITLE_SIZE, HP_BAR_HEIGHT } from '../constants/ui';

/** Canvas モック */
function mockCanvas(): HTMLCanvasElement {
  const ctx = {
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 0,
    font: '',
    textAlign: '',
  };
  return {
    width: 0,
    height: 0,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
}

describe('スプライト定数', () => {
  it('デフォルトスケールは3である', () => {
    expect(SPRITE_SCALE).toBe(3);
  });

  it('プレイヤーベースサイズは 24×32 である', () => {
    expect(PLAYER_BASE).toEqual({ w: 24, h: 32 });
  });

  it('味方ベースサイズは 18×24 である', () => {
    expect(ALLY_BASE).toEqual({ w: 18, h: 24 });
  });

  it('敵（通常）ベースサイズは 24×24 である', () => {
    expect(ENEMY_BASE).toEqual({ w: 24, h: 24 });
  });

  it('敵（ボス）ベースサイズは 32×32 である', () => {
    expect(BOSS_BASE).toEqual({ w: 32, h: 32 });
  });

  it('タイトルロゴサイズは 400×200 である', () => {
    expect(TITLE_SIZE).toEqual({ w: 400, h: 200 });
  });

  it('HPバーの高さは5pxである', () => {
    expect(HP_BAR_HEIGHT).toBe(5);
  });
});

describe('スプライト描画サイズ', () => {
  it('drawPlayer は 24*s × 32*s の Canvas を生成する', () => {
    const c = mockCanvas();
    drawPlayer(c);
    // デフォルト s=3: 24*3=72, 32*3=96
    expect(c.width).toBe(72);
    expect(c.height).toBe(96);
  });

  it('drawAlly は 18*s × 24*s の Canvas を生成する', () => {
    const c = mockCanvas();
    drawAlly(c, 'tech');
    // デフォルト s=3: 18*3=54, 24*3=72
    expect(c.width).toBe(54);
    expect(c.height).toBe(72);
  });

  it('drawEnemy (通常) は 24*s × 24*s の Canvas を生成する', () => {
    const c = mockCanvas();
    drawEnemy(c, '野ウサギ', false);
    // デフォルト s=3: 24*3=72
    expect(c.width).toBe(72);
    expect(c.height).toBe(72);
  });

  it('drawEnemy (ボス) は 32*s × 32*s の Canvas を生成する', () => {
    const c = mockCanvas();
    drawEnemy(c, '火竜', true);
    // デフォルト s=3: 32*3=96
    expect(c.width).toBe(96);
    expect(c.height).toBe(96);
  });

  it('drawTitle は 400×200 の Canvas を生成する', () => {
    const c = mockCanvas();
    drawTitle(c);
    expect(c.width).toBe(400);
    expect(c.height).toBe(200);
  });
});

describe('HPバー', () => {
  it('HPバーの高さが5pxで描画される', () => {
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
    } as unknown as CanvasRenderingContext2D;

    drawEnemyHpBar(ctx, 50, 100, 10, 20, 60);
    // strokeRect の高さが 5 であること
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 60, 5);
  });
});
