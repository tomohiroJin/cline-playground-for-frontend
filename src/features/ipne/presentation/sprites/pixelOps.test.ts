import { clonePixels, applyPixelEdits, type PixelEdit } from './pixelOps';

describe('pixelOps', () => {
  describe('clonePixels', () => {
    it('各行を複製した新しい配列を返す（深いコピー）', () => {
      const src = [
        [0, 1],
        [2, 3],
      ];
      const copy = clonePixels(src);
      expect(copy).toEqual(src);
      expect(copy).not.toBe(src);
      expect(copy[0]).not.toBe(src[0]);
    });

    it('複製後の変更が元配列に影響しない', () => {
      const src = [[0, 0]];
      const copy = clonePixels(src);
      copy[0][0] = 9;
      expect(src[0][0]).toBe(0);
    });
  });

  describe('applyPixelEdits', () => {
    it('指定座標のパレットインデックスを上書きする', () => {
      const base = [
        [0, 0],
        [0, 0],
      ];
      const edits: PixelEdit[] = [{ x: 1, y: 0, value: 5 }];
      const result = applyPixelEdits(base, edits);
      expect(result).toEqual([
        [0, 5],
        [0, 0],
      ]);
    });

    it('元配列を破壊しない（非破壊）', () => {
      const base = [[0, 0]];
      applyPixelEdits(base, [{ x: 0, y: 0, value: 7 }]);
      expect(base[0][0]).toBe(0);
    });

    it('範囲外の座標は無視する', () => {
      const base = [[0]];
      const result = applyPixelEdits(base, [
        { x: 5, y: 0, value: 1 },
        { x: 0, y: 9, value: 2 },
      ]);
      expect(result).toEqual([[0]]);
    });

    it('編集列が空なら内容が等しい複製を返す', () => {
      const base = [[1, 2, 3]];
      const result = applyPixelEdits(base, []);
      expect(result).toEqual(base);
      expect(result).not.toBe(base);
    });
  });
});
