/**
 * スプライトスケール変更テ���ト（2× → 3×）
 *
 * drawPlayer/drawEnemy/drawAlly のデフォルトスケールが 3 であることを検証する。
 * Canvas の width/height がスケール 3 に対応するサイズで設定されることを確認する。
 */
import { drawPlayer, drawEnemy, drawAlly } from '../sprites';

function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
  };
  jest.spyOn(canvas, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  return canvas;
}

describe('スプライトスケール 3×', () => {
  it('drawPlayer のデフォルトスケールで Canvas が 48×66 になる', () => {
    const canvas = createMockCanvas();
    drawPlayer(canvas);
    expect(canvas.width).toBe(16 * 3);  // 48
    expect(canvas.height).toBe(22 * 3); // 66
  });

  it('drawEnemy（通常）のデフォルトスケールで Canvas が 48×48 になる', () => {
    const canvas = createMockCanvas();
    drawEnemy(canvas, 'テスト', false);
    expect(canvas.width).toBe(16 * 3);  // 48
    expect(canvas.height).toBe(16 * 3); // 48
  });

  it('drawEnemy（ボス）のデフォルトスケールで Canvas が 72×72 になる', () => {
    const canvas = createMockCanvas();
    drawEnemy(canvas, 'テスト', true);
    expect(canvas.width).toBe(24 * 3);  // 72
    expect(canvas.height).toBe(24 * 3); // 72
  });

  it('drawAlly のデフォルトスケールで Canvas が 36×48 になる', () => {
    const canvas = createMockCanvas();
    drawAlly(canvas, 'tech');
    expect(canvas.width).toBe(12 * 3);  // 36
    expect(canvas.height).toBe(16 * 3); // 48
  });
});
