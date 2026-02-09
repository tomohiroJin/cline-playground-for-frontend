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
