import { derivedSeed } from './derived-seed';

describe('derivedSeed', () => {
  it('同じ入力からは常に同じ値を返す（決定的）', () => {
    expect(derivedSeed(12345, 'shuffle', 0)).toBe(derivedSeed(12345, 'shuffle', 0));
  });

  it('目的が違えば違う値を返す', () => {
    expect(derivedSeed(12345, 'shuffle', 0)).not.toBe(derivedSeed(12345, 'offer', 0));
  });

  it('index が違えば違う値を返す', () => {
    expect(derivedSeed(12345, 'shuffle', 0)).not.toBe(derivedSeed(12345, 'shuffle', 1));
  });

  it('元のシードが違えば違う値を返す', () => {
    expect(derivedSeed(1, 'stage-draw')).not.toBe(derivedSeed(2, 'stage-draw'));
  });

  it('index を省略すると 0 を指定したのと同じ', () => {
    expect(derivedSeed(7, 'offer')).toBe(derivedSeed(7, 'offer', 0));
  });

  it('常に正の32bit整数を返す（SeededRandom に渡せる）', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const value = derivedSeed(seed, 'shuffle', seed % 3);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it('隣接するシードが衝突しない（1000件で重複なし）', () => {
    const values = new Set<number>();
    for (let seed = 1; seed <= 1000; seed++) values.add(derivedSeed(seed, 'shuffle', 0));
    expect(values.size).toBe(1000);
  });
});
