import { applyOutline, applyEdgeShading } from './dotEnhance';
import type { SpriteDefinition } from './spriteData';

/** 中央1ピクセルだけ不透明な 3x3 スプライト */
function dotSprite(): SpriteDefinition {
  return {
    width: 3,
    height: 3,
    pixels: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    palette: ['', '#ffffff'],
  };
}

/** 2x2 すべて不透明な灰色 ImageData を作る */
function grayImage(): ImageData {
  const data = new Uint8ClampedArray(2 * 2 * 4);
  for (let i = 0; i < 4; i++) {
    data[i * 4] = 100;
    data[i * 4 + 1] = 100;
    data[i * 4 + 2] = 100;
    data[i * 4 + 3] = 255;
  }
  return new ImageData(data, 2, 2);
}

describe('applyOutline', () => {
  it('は不透明ピクセルの上下左右に輪郭色を置く', () => {
    const out = applyOutline(dotSprite());
    const outlineIndex = out.palette.length - 1;
    expect(out.pixels[0][1]).toBe(outlineIndex);
    expect(out.pixels[2][1]).toBe(outlineIndex);
    expect(out.pixels[1][0]).toBe(outlineIndex);
    expect(out.pixels[1][2]).toBe(outlineIndex);
    expect(out.pixels[0][0]).toBe(0); // 斜めは対象外
    expect(out.pixels[1][1]).toBe(1); // 元の不透明は保持
  });

  it('は入力を破壊しない', () => {
    const src = dotSprite();
    const snapshot = JSON.stringify(src.pixels);
    applyOutline(src);
    expect(JSON.stringify(src.pixels)).toBe(snapshot);
  });

  it('は輪郭色をパレット末尾に1度だけ追加する', () => {
    const once = applyOutline(dotSprite());
    const twice = applyOutline(once);
    expect(twice.palette.length).toBe(once.palette.length);
  });
});

describe('applyEdgeShading', () => {
  it('は右下の縁（外周が透明扱い）を暗くする', () => {
    const out = applyEdgeShading(grayImage());
    const o = (1 * 2 + 1) * 4; // 右下ピクセル(1,1)
    expect(out.data[o]).toBeLessThan(100);
  });

  it('は入力 ImageData を破壊しない', () => {
    const src = grayImage();
    applyEdgeShading(src);
    expect(src.data[0]).toBe(100);
  });
});
