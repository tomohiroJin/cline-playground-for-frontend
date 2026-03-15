/**
 * RandomAdapter テスト
 *
 * MathRandomAdapter と SeededRandomAdapter が
 * RandomPort インターフェースを正しく実装していることを検証する。
 */
import { MathRandomAdapter } from '../random/math-random-adapter';
import { SeededRandomAdapter } from '../random/seeded-random-adapter';

describe('MathRandomAdapter', () => {
  const adapter = new MathRandomAdapter();

  describe('random', () => {
    it('0以上1未満の値を返す', () => {
      for (let i = 0; i < 100; i++) {
        const val = adapter.random();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('randomInt', () => {
    it('min 以上 max 以下の整数を返す', () => {
      for (let i = 0; i < 100; i++) {
        const val = adapter.randomInt(1, 6);
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(6);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('min と max が同じ場合はその値を返す', () => {
      expect(adapter.randomInt(5, 5)).toBe(5);
    });
  });

  describe('shuffle', () => {
    it('元の配列を変更しない', () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      adapter.shuffle(original);
      expect(original).toEqual(copy);
    });

    it('同じ要素を含む配列を返す', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = adapter.shuffle(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('元と同じ長さの配列を返す', () => {
      const arr = [1, 2, 3];
      expect(adapter.shuffle(arr)).toHaveLength(3);
    });
  });
});

describe('SeededRandomAdapter', () => {
  describe('random', () => {
    it('同じシードから同じ乱数列を返す', () => {
      const a1 = new SeededRandomAdapter(42);
      const a2 = new SeededRandomAdapter(42);
      const seq1 = [a1.random(), a1.random(), a1.random()];
      const seq2 = [a2.random(), a2.random(), a2.random()];
      expect(seq1).toEqual(seq2);
    });

    it('0以上1未満の値を返す', () => {
      const adapter = new SeededRandomAdapter(12345);
      for (let i = 0; i < 100; i++) {
        const val = adapter.random();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('異なるシードから異なる乱数列を返す', () => {
      const a1 = new SeededRandomAdapter(1);
      const a2 = new SeededRandomAdapter(2);
      const seq1 = [a1.random(), a1.random(), a1.random()];
      const seq2 = [a2.random(), a2.random(), a2.random()];
      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('randomInt', () => {
    it('同じシードから同じ整数列を返す', () => {
      const a1 = new SeededRandomAdapter(100);
      const a2 = new SeededRandomAdapter(100);
      const seq1 = [a1.randomInt(1, 6), a1.randomInt(1, 6), a1.randomInt(1, 6)];
      const seq2 = [a2.randomInt(1, 6), a2.randomInt(1, 6), a2.randomInt(1, 6)];
      expect(seq1).toEqual(seq2);
    });
  });

  describe('shuffle', () => {
    it('同じシードから同じシャッフル結果を返す', () => {
      const arr = [1, 2, 3, 4, 5];
      const a1 = new SeededRandomAdapter(99);
      const a2 = new SeededRandomAdapter(99);
      expect(a1.shuffle(arr)).toEqual(a2.shuffle(arr));
    });

    it('元の配列を変更しない', () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      const adapter = new SeededRandomAdapter(42);
      adapter.shuffle(original);
      expect(original).toEqual(copy);
    });
  });
});
