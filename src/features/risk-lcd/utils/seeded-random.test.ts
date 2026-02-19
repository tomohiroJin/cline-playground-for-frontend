import { SeededRand, dateToSeed, getDailyId } from './seeded-random';

describe('SeededRand', () => {
  it('同一シードで同一結果を返す', () => {
    const r1 = new SeededRand(42);
    const r2 = new SeededRand(42);
    for (let i = 0; i < 20; i++) {
      expect(r1.int(100)).toBe(r2.int(100));
    }
  });

  it('異なるシードで異なる結果を返す', () => {
    const r1 = new SeededRand(42);
    const r2 = new SeededRand(99);
    // 10回試行して全一致しないことを確認
    const matches = Array.from({ length: 10 }, () =>
      r1.int(1000) === r2.int(1000),
    );
    expect(matches.every(Boolean)).toBe(false);
  });

  it('int(n) は 0 以上 n 未満の整数を返す', () => {
    const r = new SeededRand(123);
    for (let i = 0; i < 100; i++) {
      const v = r.int(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('pick は配列から要素を選択する', () => {
    const r = new SeededRand(42);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(r.pick(arr));
    }
  });

  it('pick は空配列でエラーを投げる', () => {
    const r = new SeededRand(42);
    expect(() => r.pick([])).toThrow('SeededRand.pick: empty');
  });

  it('chance は確率に基づいて boolean を返す', () => {
    const r = new SeededRand(42);
    // chance(0) は常に false
    for (let i = 0; i < 10; i++) {
      expect(r.chance(0)).toBe(false);
    }
    // chance(1) は常に true
    const r2 = new SeededRand(42);
    for (let i = 0; i < 10; i++) {
      expect(r2.chance(1)).toBe(true);
    }
  });

  it('shuffle は同一シードで同一順序を返す', () => {
    const r1 = new SeededRand(42);
    const r2 = new SeededRand(42);
    const arr = [1, 2, 3, 4, 5];
    expect(r1.shuffle(arr)).toEqual(r2.shuffle(arr));
  });

  it('shuffle は元配列を変更しない', () => {
    const r = new SeededRand(42);
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    r.shuffle(arr);
    expect(arr).toEqual(original);
  });

  it('random() は 0 以上 1 未満の値を返す', () => {
    const r = new SeededRand(42);
    for (let i = 0; i < 100; i++) {
      const v = r.random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('dateToSeed', () => {
  it('同一文字列で同一シードを返す（決定論性）', () => {
    expect(dateToSeed('2026-02-17')).toBe(dateToSeed('2026-02-17'));
  });

  it('異なる文字列で異なるシードを返す', () => {
    expect(dateToSeed('2026-02-17')).not.toBe(dateToSeed('2026-02-18'));
  });

  it('符号なし32bit整数を返す', () => {
    const seed = dateToSeed('2026-02-17');
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
  });
});

describe('getDailyId', () => {
  it('YYYY-MM-DD 形式の文字列を返す', () => {
    const id = getDailyId();
    expect(id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('同日中は同じ値を返す', () => {
    expect(getDailyId()).toBe(getDailyId());
  });
});
