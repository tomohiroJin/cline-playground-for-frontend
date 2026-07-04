/**
 * タイルバリエーション選択のテスト
 */
import { hashTileCoord, selectTileVariantIndex } from './tileVariation';

describe('hashTileCoord', () => {
  it('決定論的（同じ座標で常に同じ値）', () => {
    expect(hashTileCoord(3, 7)).toBe(hashTileCoord(3, 7));
    expect(hashTileCoord(0, 0)).toBe(hashTileCoord(0, 0));
  });

  it('非負整数を返す', () => {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const h = hashTileCoord(x, y);
        expect(Number.isInteger(h)).toBe(true);
        expect(h).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('隣接座標で値が変わる（縞模様にならない）', () => {
    expect(hashTileCoord(5, 5)).not.toBe(hashTileCoord(6, 5));
    expect(hashTileCoord(5, 5)).not.toBe(hashTileCoord(5, 6));
  });
});

describe('selectTileVariantIndex', () => {
  it('0..variantCount-1 の範囲を返す', () => {
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const i = selectTileVariantIndex(x, y, 3);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(3);
      }
    }
  });

  it('40×40 マップで全バリアントが出現する', () => {
    const seen = new Set<number>();
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 40; x++) {
        seen.add(selectTileVariantIndex(x, y, 3));
      }
    }
    expect(seen.size).toBe(3);
  });

  it('ベース（index 0）が過半数を占める（装飾は控えめ）', () => {
    let baseCount = 0;
    const total = 40 * 40;
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 40; x++) {
        if (selectTileVariantIndex(x, y, 3) === 0) baseCount++;
      }
    }
    expect(baseCount / total).toBeGreaterThan(0.5);
  });
});
