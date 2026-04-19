/**
 * audit-portrait-fringe のテスト（S9-B2-1）
 *
 * 純粋関数部分（境界ピクセル検出、白フリンジ判定、黒ずみ判定）のみをテストする。
 * 実 PNG 読み込みは fs / canvas 依存のため integration 側に委譲。
 */
import {
  isEdgePixel,
  isWhiteFringe,
  isDarkened,
  analyzePixels,
  type Pixel,
} from '../air-hockey/audit-portrait-fringe';

describe('isEdgePixel', () => {
  it('alpha=0 は境界ピクセルでない（完全透明）', () => {
    expect(isEdgePixel(0)).toBe(false);
  });

  it('alpha=255 は境界ピクセルでない（完全不透明）', () => {
    expect(isEdgePixel(255)).toBe(false);
  });

  it('0 < alpha < 255 は境界ピクセル', () => {
    expect(isEdgePixel(1)).toBe(true);
    expect(isEdgePixel(128)).toBe(true);
    expect(isEdgePixel(254)).toBe(true);
  });
});

describe('isWhiteFringe', () => {
  it('R/G/B 全て 240 以上で白フリンジ', () => {
    expect(isWhiteFringe({ r: 250, g: 250, b: 250, a: 128 })).toBe(true);
    expect(isWhiteFringe({ r: 240, g: 240, b: 240, a: 128 })).toBe(true);
  });

  it('いずれかが 239 以下なら白フリンジでない', () => {
    expect(isWhiteFringe({ r: 239, g: 250, b: 250, a: 128 })).toBe(false);
    expect(isWhiteFringe({ r: 100, g: 100, b: 100, a: 128 })).toBe(false);
  });
});

describe('isDarkened', () => {
  it('R+G+B < 60 で黒ずみ', () => {
    expect(isDarkened({ r: 10, g: 10, b: 10, a: 128 })).toBe(true);
    expect(isDarkened({ r: 20, g: 20, b: 19, a: 128 })).toBe(true);
  });

  it('R+G+B >= 60 は黒ずみでない', () => {
    expect(isDarkened({ r: 20, g: 20, b: 20, a: 128 })).toBe(false);
    expect(isDarkened({ r: 100, g: 100, b: 100, a: 128 })).toBe(false);
  });
});

describe('analyzePixels', () => {
  const make = (count: number, factory: (i: number) => Pixel): Pixel[] =>
    Array.from({ length: count }, (_, i) => factory(i));

  it('全部 alpha=255（境界ピクセル 0）で判定 OK', () => {
    const pixels = make(100, () => ({ r: 200, g: 100, b: 50, a: 255 }));
    const result = analyzePixels(pixels);
    expect(result.totalEdgePixels).toBe(0);
    expect(result.whiteFringeCount).toBe(0);
    expect(result.darkenedCount).toBe(0);
    expect(result.verdict).toBe('OK');
  });

  it('境界ピクセルの 1% 白フリンジは OK（閾値 2%）', () => {
    const pixels = [
      ...make(99, () => ({ r: 50, g: 50, b: 50, a: 128 })),
      { r: 255, g: 255, b: 255, a: 128 },
    ];
    const result = analyzePixels(pixels);
    expect(result.totalEdgePixels).toBe(100);
    expect(result.whiteFringeCount).toBe(1);
    expect(result.whiteRatio).toBeCloseTo(0.01);
    expect(result.verdict).toBe('OK');
  });

  it('白フリンジ 3% で NG 判定', () => {
    const pixels = [
      ...make(97, () => ({ r: 50, g: 50, b: 50, a: 128 })),
      ...make(3, () => ({ r: 255, g: 255, b: 255, a: 128 })),
    ];
    const result = analyzePixels(pixels);
    expect(result.whiteRatio).toBeCloseTo(0.03);
    expect(result.verdict).toBe('NG');
  });

  it('黒ずみ 3% でも NG 判定', () => {
    const pixels = [
      ...make(97, () => ({ r: 100, g: 100, b: 100, a: 128 })),
      ...make(3, () => ({ r: 10, g: 10, b: 10, a: 128 })),
    ];
    const result = analyzePixels(pixels);
    expect(result.darkenedRatio).toBeCloseTo(0.03);
    expect(result.verdict).toBe('NG');
  });

  it('totalEdgePixels が 0 のとき比率は 0', () => {
    const pixels = make(10, () => ({ r: 50, g: 50, b: 50, a: 255 }));
    const result = analyzePixels(pixels);
    expect(result.whiteRatio).toBe(0);
    expect(result.darkenedRatio).toBe(0);
  });
});
