import { uid, pick, calcTiming } from '../utils';
import type { TimingConfig } from '../types';

describe('uid', () => {
  test('文字列を返すこと', () => {
    expect(typeof uid()).toBe('string');
  });

  test('毎回異なる値を返すこと', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });
});

describe('pick', () => {
  test('配列から1要素を返すこと', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = pick(arr);
    expect(arr).toContain(result);
  });

  test('単一要素の配列からその要素を返すこと', () => {
    expect(pick([42])).toBe(42);
  });
});

describe('calcTiming', () => {
  const config: TimingConfig = { base: 2500, min: 800, decay: 30, stageMult: 200 };

  test('初期値（time=0, stage=0）ではbaseを返すこと', () => {
    expect(calcTiming(config, 0, 0)).toBe(2500);
  });

  test('時間経過で値が減少すること', () => {
    const result = calcTiming(config, 10, 0);
    expect(result).toBe(2500 - 10 * 30); // 2200
  });

  test('ステージ進行で値が減少すること', () => {
    const result = calcTiming(config, 0, 2);
    expect(result).toBe(2500 - 2 * 200); // 2100
  });

  test('最小値を下回らないこと', () => {
    const result = calcTiming(config, 100, 10);
    expect(result).toBe(800);
  });
});
