import { createSprite, hexToRgba } from './spriteData';
import { SPRITE_SIZES } from '../config';

describe('SPRITE_SIZES', () => {
  it('基本スプライトサイズが32である', () => {
    expect(SPRITE_SIZES.base).toBe(32);
  });

  it('アイテムスプライトサイズが16である', () => {
    expect(SPRITE_SIZES.item).toBe(16);
  });

  it('ミニボススプライトサイズが40である', () => {
    expect(SPRITE_SIZES.miniBoss).toBe(40);
  });

  it('ボススプライトサイズが48である', () => {
    expect(SPRITE_SIZES.boss).toBe(48);
  });

  it('メガボススプライトサイズが56である', () => {
    expect(SPRITE_SIZES.megaBoss).toBe(56);
  });

  it('すべてのサイズが8の倍数である', () => {
    Object.values(SPRITE_SIZES).forEach((size) => {
      expect(size % 8).toBe(0);
    });
  });
});

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

  it('32x32 サイズのスプライトを生成できる', () => {
    // 全て同色で埋めた 32x32 スプライト
    const pixels = Array.from({ length: 32 }, () => Array(32).fill(1));
    const palette = ['transparent', '#374151'];

    const imageData = createSprite(pixels, palette);

    expect(imageData.width).toBe(32);
    expect(imageData.height).toBe(32);
    expect(imageData.data.length).toBe(32 * 32 * 4);

    // 全ピクセルが同色であることを確認
    for (let i = 0; i < 32 * 32; i++) {
      const offset = i * 4;
      expect(imageData.data[offset]).toBe(0x37);
      expect(imageData.data[offset + 1]).toBe(0x41);
      expect(imageData.data[offset + 2]).toBe(0x51);
      expect(imageData.data[offset + 3]).toBe(255);
    }
  });

  it('16x16 サイズのアイテムスプライトを生成できる', () => {
    // 枠と中身で構成される簡易ポーション（16x16）
    const pixels = Array.from({ length: 16 }, (_, y) =>
      Array.from({ length: 16 }, (_, x) => {
        // 外枠は1、内部は2、角は0（透明）
        if (y === 0 || y === 15 || x === 0 || x === 15) {
          if ((y === 0 || y === 15) && (x === 0 || x === 15)) return 0;
          return 1;
        }
        return 2;
      })
    );
    const palette = ['transparent', '#22c55e', '#4ade80'];

    const imageData = createSprite(pixels, palette);

    expect(imageData.width).toBe(16);
    expect(imageData.height).toBe(16);
    expect(imageData.data.length).toBe(16 * 16 * 4);

    // 左上角 (0,0) は透明
    expect(imageData.data[3]).toBe(0);

    // (1,0) は palette[1] = '#22c55e'
    const offset = 1 * 4;
    expect(imageData.data[offset]).toBe(0x22);
    expect(imageData.data[offset + 1]).toBe(0xc5);
    expect(imageData.data[offset + 2]).toBe(0x5e);
    expect(imageData.data[offset + 3]).toBe(255);
  });

  it('12色パレットのスプライトを正しく生成できる', () => {
    // 12色パレット（戦士パレット相当）の整合性テスト
    const palette = [
      '',          // 0: 透明
      '#1e2a6e',   // 1
      '#4c51bf',   // 2
      '#667eea',   // 3
      '#818cf8',   // 4
      '#c7d2fe',   // 5
      '#f5f5f5',   // 6
      '#d4a574',   // 7
      '#3b4cc0',   // 8
      '#b8845a',   // 9
      '#e0e7ff',   // 10
      '#4a3728',   // 11
    ];

    // 全12色を使用する1行スプライト
    const pixels = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    ];

    const imageData = createSprite(pixels, palette);

    expect(imageData.width).toBe(12);
    expect(imageData.height).toBe(1);

    // インデックス0は透明
    expect(imageData.data[3]).toBe(0);

    // インデックス1 = #1e2a6e
    expect(imageData.data[4]).toBe(0x1e);
    expect(imageData.data[5]).toBe(0x2a);
    expect(imageData.data[6]).toBe(0x6e);
    expect(imageData.data[7]).toBe(255);

    // インデックス11 = #4a3728
    const lastOffset = 11 * 4;
    expect(imageData.data[lastOffset]).toBe(0x4a);
    expect(imageData.data[lastOffset + 1]).toBe(0x37);
    expect(imageData.data[lastOffset + 2]).toBe(0x28);
    expect(imageData.data[lastOffset + 3]).toBe(255);
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

  it('未定義パレット参照でもクラッシュせず診断色で描画する', () => {
    const imageData = createSprite([[2]], ['transparent', '#111111']);

    expect(imageData.width).toBe(1);
    expect(imageData.height).toBe(1);
    expect(imageData.data[0]).toBe(255);
    expect(imageData.data[1]).toBe(0);
    expect(imageData.data[2]).toBe(255);
    expect(imageData.data[3]).toBe(255);
  });
});
