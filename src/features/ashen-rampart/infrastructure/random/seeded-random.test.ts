import { SeededRandom } from './seeded-random';

describe('SeededRandom', () => {
  it('同じシードから同じ乱数列を生成する', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const seqA = [a.random(), a.random(), a.random()];
    const seqB = [b.random(), b.random(), b.random()];
    expect(seqA).toEqual(seqB);
  });

  it('異なるシードからは異なる乱数列を生成する', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    expect(a.random()).not.toBe(b.random());
  });

  it('0以上1未満の値を返す', () => {
    const rng = new SeededRandom(7);
    for (let i = 0; i < 100; i++) {
      const v = rng.random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
