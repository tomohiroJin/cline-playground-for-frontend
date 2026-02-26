/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — 数学ユーティリティテスト
 */
import { TAU, clamp, rng, rngInt, rngSpread, shuffle } from '../core/math';

describe('math ユーティリティ', () => {
  describe('TAU', () => {
    it('2πと一致する', () => {
      expect(TAU).toBe(2 * Math.PI);
    });
  });

  describe('clamp', () => {
    it('下限より小さい値を下限にクランプする', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('上限より大きい値を上限にクランプする', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('範囲内の値はそのまま返す', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('境界値を正しく扱う', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('rng', () => {
    it('デフォルトで0〜1の範囲の値を返す', () => {
      for (let i = 0; i < 50; i++) {
        const v = rng();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it('指定範囲内の値を返す', () => {
      for (let i = 0; i < 50; i++) {
        const v = rng(10, 20);
        expect(v).toBeGreaterThanOrEqual(10);
        expect(v).toBeLessThan(20);
      }
    });
  });

  describe('rngInt', () => {
    it('整数を返す', () => {
      for (let i = 0; i < 50; i++) {
        const v = rngInt(0, 5);
        expect(Number.isInteger(v)).toBe(true);
      }
    });

    it('指定範囲内の整数を返す', () => {
      for (let i = 0; i < 50; i++) {
        const v = rngInt(3, 7);
        expect(v).toBeGreaterThanOrEqual(3);
        expect(v).toBeLessThanOrEqual(7);
      }
    });
  });

  describe('rngSpread', () => {
    it('-spread〜+spreadの範囲の値を返す', () => {
      const spread = 5;
      for (let i = 0; i < 50; i++) {
        const v = rngSpread(spread);
        expect(v).toBeGreaterThanOrEqual(-spread);
        expect(v).toBeLessThanOrEqual(spread);
      }
    });

    it('spread=0の場合は0を返す', () => {
      expect(rngSpread(0)).toBeCloseTo(0);
    });
  });

  describe('shuffle', () => {
    it('配列の長さが変わらない', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle([...arr]);
      expect(result).toHaveLength(arr.length);
    });

    it('全要素が保持される', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle([...arr]);
      expect(result.sort()).toEqual(arr.sort());
    });

    it('空配列でもエラーにならない', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('元の配列を変更する（in-place）', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      expect(result).toBe(arr);
    });
  });
});
