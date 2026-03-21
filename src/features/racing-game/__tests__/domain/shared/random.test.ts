// 乱数ジェネレータのテスト

import {
  defaultRandom,
  createSeededRandom,
  setGlobalRandom,
  resetGlobalRandom,
  getRandom,
} from '../../../domain/shared/random';

describe('random', () => {
  afterEach(() => {
    resetGlobalRandom();
  });

  describe('defaultRandom', () => {
    it('[0, 1) の範囲の値を返す', () => {
      for (let i = 0; i < 100; i++) {
        const val = defaultRandom();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('createSeededRandom', () => {
    it('同じシードで同じ値列を返す', () => {
      const rng1 = createSeededRandom(42);
      const rng2 = createSeededRandom(42);

      const seq1 = Array.from({ length: 10 }, () => rng1());
      const seq2 = Array.from({ length: 10 }, () => rng2());

      expect(seq1).toEqual(seq2);
    });

    it('[0, 1) の範囲の値を返す', () => {
      const rng = createSeededRandom(123);
      for (let i = 0; i < 100; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('異なるシードで異なる値列を返す', () => {
      const rng1 = createSeededRandom(1);
      const rng2 = createSeededRandom(2);

      const seq1 = Array.from({ length: 5 }, () => rng1());
      const seq2 = Array.from({ length: 5 }, () => rng2());

      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('setGlobalRandom / getRandom', () => {
    it('デフォルトでは defaultRandom を返す', () => {
      const rng = getRandom();
      expect(typeof rng()).toBe('number');
    });

    it('グローバル乱数を差し替えできる', () => {
      let callCount = 0;
      const mockRng = () => { callCount++; return 0.5; };

      setGlobalRandom(mockRng);

      const rng = getRandom();
      expect(rng()).toBe(0.5);
      expect(callCount).toBe(1);
    });

    it('resetGlobalRandom で元に戻る', () => {
      // Arrange: シード付き乱数に差し替え
      const seeded = createSeededRandom(42);
      setGlobalRandom(seeded);

      // Act: リセット
      resetGlobalRandom();

      // Assert: getRandom が seeded ではなく defaultRandom を返すことを確認
      // （seeded の次の値と異なることで判定）
      const afterReset = getRandom();
      expect(afterReset).not.toBe(seeded);
      // defaultRandom は Math.random のラッパーなので、関数参照が異なる
      expect(afterReset).toBe(defaultRandom);
    });
  });
});
