/**
 * SpriteRenderer 自動補正（EnhanceOptions）テスト
 */
import { SpriteRenderer } from './spriteRenderer';
import type { SpriteDefinition } from './spriteData';

function makeSprite(): SpriteDefinition {
  return {
    width: 2,
    height: 2,
    pixels: [
      [1, 0],
      [0, 1],
    ],
    palette: ['', '#ffffff'],
  };
}

/** drawImage 呼び出しを記録するスタブ ctx */
function stubCtx() {
  const drawn: unknown[] = [];
  const ctx = {
    imageSmoothingEnabled: true,
    globalAlpha: 1,
    drawImage(src: unknown) {
      drawn.push(src);
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, drawn };
}

describe('SpriteRenderer enhance', () => {
  it('は enhance 指定の有無で別キャッシュを生成する（描画が成功する）', () => {
    const r = new SpriteRenderer();
    const sprite = makeSprite();
    const { ctx, drawn } = stubCtx();
    r.drawSprite(ctx, sprite, 0, 0, 4);
    r.drawSprite(ctx, sprite, 0, 0, 4, { outline: true, shade: true });
    expect(drawn).toHaveLength(2);
  });
});
