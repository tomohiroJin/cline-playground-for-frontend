import { Rand } from './random';

describe('Rand.int', () => {
  it('0以上n未満のランダム整数を返す', () => {
    for (let i = 0; i < 100; i++) {
      const v = Rand.int(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('Rand.pick', () => {
  it('配列からランダムに1要素を返す', () => {
    const arr = [1, 2, 3, 4, 5];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(Rand.pick(arr));
    }
  });

  it('空配列でエラーを投げる', () => {
    expect(() => Rand.pick([])).toThrow('Rand.pick: empty');
  });
});

describe('Rand.chance', () => {
  it('確率0では常にfalse', () => {
    for (let i = 0; i < 50; i++) {
      expect(Rand.chance(0)).toBe(false);
    }
  });

  it('確率1では常にtrue', () => {
    for (let i = 0; i < 50; i++) {
      expect(Rand.chance(1)).toBe(true);
    }
  });

  it('確率0.5で概ね50%の分布になる', () => {
    const trials = 1000;
    let trueCount = 0;
    for (let i = 0; i < trials; i++) {
      if (Rand.chance(0.5)) trueCount++;
    }
    // 許容誤差: 期待値の ±40%
    const expected = trials * 0.5;
    expect(trueCount).toBeGreaterThan(expected * 0.6);
    expect(trueCount).toBeLessThan(expected * 1.4);
  });
});

describe('Rand.int 分布テスト', () => {
  it('各値が概ね均等に出現する', () => {
    const n = 5;
    const trials = 1000;
    const counts = new Array(n).fill(0);
    for (let i = 0; i < trials; i++) {
      counts[Rand.int(n)]++;
    }
    // 各値が期待値の半分以上出現すること
    const expected = trials / n;
    for (let i = 0; i < n; i++) {
      expect(counts[i]).toBeGreaterThan(expected * 0.4);
      expect(counts[i]).toBeLessThan(expected * 1.6);
    }
  });
});

describe('Rand.shuffle', () => {
  it('同じ要素を含む配列を返す', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = Rand.shuffle(arr);
    expect(shuffled).toHaveLength(arr.length);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('元の配列を変更しない', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    Rand.shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it('空配列は空配列を返す', () => {
    expect(Rand.shuffle([])).toEqual([]);
  });
});
