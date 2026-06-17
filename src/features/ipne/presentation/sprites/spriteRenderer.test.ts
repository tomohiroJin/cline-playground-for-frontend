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

  it('は同一 enhance ではキャッシュを再利用する（同一キャンバス参照）', () => {
    const r = new SpriteRenderer();
    const sprite = makeSprite();
    const { ctx, drawn } = stubCtx();
    // 同一スプライト・同一 scale・同一 enhance で2回描画
    r.drawSprite(ctx, sprite, 0, 0, 4, { outline: true });
    r.drawSprite(ctx, sprite, 0, 0, 4, { outline: true });
    // キャッシュヒットにより同じキャンバスオブジェクトが使われる
    expect(drawn[0]).toBe(drawn[1]);
  });

  it('は補正の組合せごとに別キャッシュを使う', () => {
    const r = new SpriteRenderer();
    const sprite = makeSprite();
    const { ctx, drawn } = stubCtx();
    // 無補正・輪郭のみ・陰影のみ の順で描画
    r.drawSprite(ctx, sprite, 0, 0, 4);                    // 無補正
    r.drawSprite(ctx, sprite, 0, 0, 4, { outline: true }); // 輪郭のみ
    r.drawSprite(ctx, sprite, 0, 0, 4, { shade: true });   // 陰影のみ
    // 補正の組合せが異なるため別々のキャンバスが生成される
    expect(drawn[0]).not.toBe(drawn[1]);
    expect(drawn[1]).not.toBe(drawn[2]);
    expect(drawn[0]).not.toBe(drawn[2]);
  });

  it('は無補正と全補正で別キャッシュを使う', () => {
    const r = new SpriteRenderer();
    const sprite = makeSprite();
    const { ctx, drawn } = stubCtx();
    // enhance 省略 と { outline: true, shade: true } で別参照
    r.drawSprite(ctx, sprite, 0, 0, 4);
    r.drawSprite(ctx, sprite, 0, 0, 4, { outline: true, shade: true });
    expect(drawn[0]).not.toBe(drawn[1]);
  });
});
