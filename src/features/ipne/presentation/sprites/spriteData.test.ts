import { createSprite, hexToRgba, SpriteDefinition } from './spriteData';

describe('hexToRgba', () => {
  it('16進数カラーコードを RGBA 値に変換できる', () => {
    expect(hexToRgba('#ff0000')).toEqual([255, 0, 0, 255]);
    expect(hexToRgba('#00ff00')).toEqual([0, 255, 0, 255]);
    expect(hexToRgba('#0000ff')).toEqual([0, 0, 255, 255]);
  });

  it('黒と白を正しく変換できる', () => {
    expect(hexToRgba('#000000')).toEqual([0, 0, 0, 255]);
    expect(hexToRgba('#ffffff')).toEqual([255, 255, 255, 255]);
  });

  it('任意の色を正しく変換できる', () => {
    // 既存 CONFIG の色をテスト
    expect(hexToRgba('#667eea')).toEqual([102, 126, 234, 255]);
    expect(hexToRgba('#1f2937')).toEqual([31, 41, 55, 255]);
  });
});

describe('createSprite', () => {
  it('単一ピクセルの透明スプライトを生成できる', () => {
    const pixels = [[0]];
    const palette = ['transparent'];

    const imageData = createSprite(pixels, palette);

    expect(imageData.width).toBe(1);
    expect(imageData.height).toBe(1);
    // 透明ピクセル: RGBA = (0, 0, 0, 0)
    expect(imageData.data[0]).toBe(0);
    expect(imageData.data[1]).toBe(0);
    expect(imageData.data[2]).toBe(0);
    expect(imageData.data[3]).toBe(0);
  });

  it('単一色のスプライトを生成できる', () => {
    const pixels = [[1]];
    const palette = ['transparent', '#ff0000'];

    const imageData = createSprite(pixels, palette);

    expect(imageData.width).toBe(1);
    expect(imageData.height).toBe(1);
    // 赤ピクセル: RGBA = (255, 0, 0, 255)
    expect(imageData.data[0]).toBe(255);
    expect(imageData.data[1]).toBe(0);
    expect(imageData.data[2]).toBe(0);
    expect(imageData.data[3]).toBe(255);
  });

  it('2x2 のスプライトを正しく生成できる', () => {
    const pixels = [
      [1, 2],
      [0, 3],
    ];
    const palette = ['transparent', '#ff0000', '#00ff00', '#0000ff'];

    const imageData = createSprite(pixels, palette);

    expect(imageData.width).toBe(2);
    expect(imageData.height).toBe(2);

    // (0,0) = 赤
    expect(imageData.data[0]).toBe(255);
    expect(imageData.data[1]).toBe(0);
    expect(imageData.data[2]).toBe(0);
    expect(imageData.data[3]).toBe(255);

    // (1,0) = 緑
    expect(imageData.data[4]).toBe(0);
    expect(imageData.data[5]).toBe(255);
    expect(imageData.data[6]).toBe(0);
    expect(imageData.data[7]).toBe(255);

    // (0,1) = 透明
    expect(imageData.data[8]).toBe(0);
    expect(imageData.data[9]).toBe(0);
    expect(imageData.data[10]).toBe(0);
    expect(imageData.data[11]).toBe(0);

    // (1,1) = 青
    expect(imageData.data[12]).toBe(0);
    expect(imageData.data[13]).toBe(0);
    expect(imageData.data[14]).toBe(255);
    expect(imageData.data[15]).toBe(255);
  });

  it('16x16 サイズのスプライトを生成できる', () => {
    // 全て同色で埋めた 16x16 スプライト
    const pixels = Array.from({ length: 16 }, () => Array(16).fill(1));
    const palette = ['transparent', '#374151'];

    const imageData = createSprite(pixels, palette);

    expect(imageData.width).toBe(16);
    expect(imageData.height).toBe(16);
    expect(imageData.data.length).toBe(16 * 16 * 4);

    // 全ピクセルが同色であることを確認
    for (let i = 0; i < 16 * 16; i++) {
      const offset = i * 4;
      expect(imageData.data[offset]).toBe(0x37);
      expect(imageData.data[offset + 1]).toBe(0x41);
      expect(imageData.data[offset + 2]).toBe(0x51);
      expect(imageData.data[offset + 3]).toBe(255);
    }
  });

  it('8x8 サイズのアイテムスプライトを生成できる', () => {
    // 枠と中身で構成される簡易ポーション
    const pixels = [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
    ];
    const palette = ['transparent', '#22c55e', '#4ade80'];

    const imageData = createSprite(pixels, palette);

    expect(imageData.width).toBe(8);
    expect(imageData.height).toBe(8);
    expect(imageData.data.length).toBe(8 * 8 * 4);

    // 左上角 (0,0) は透明
    expect(imageData.data[3]).toBe(0);

    // (2,0) は palette[1] = '#22c55e'
    const offset = 2 * 4;
    expect(imageData.data[offset]).toBe(0x22);
    expect(imageData.data[offset + 1]).toBe(0xc5);
    expect(imageData.data[offset + 2]).toBe(0x5e);
    expect(imageData.data[offset + 3]).toBe(255);
  });

  it('複数パレット色を使い分けられる', () => {
    const pixels = [
      [1, 2, 3],
    ];
    const palette = ['transparent', '#111111', '#222222', '#333333'];

    const imageData = createSprite(pixels, palette);

    expect(imageData.data[0]).toBe(0x11);
    expect(imageData.data[4]).toBe(0x22);
    expect(imageData.data[8]).toBe(0x33);
  });
});
