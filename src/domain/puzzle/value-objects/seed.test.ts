import { createSeededRng, dateStringToSeed } from './seed';

describe('createSeededRng', () => {
  it('同一シードは同一の数列を返す', () => {
    const a = createSeededRng(12345);
    const b = createSeededRng(12345);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('異なるシードは異なる数列を返す', () => {
    const a = createSeededRng(1);
    const b = createSeededRng(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('返す値は 0 以上 1 未満', () => {
    const rng = createSeededRng(99);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('dateStringToSeed', () => {
  it('YYYYMMDD 文字列を数値シードへ変換する', () => {
    expect(dateStringToSeed('20260709')).toBe(20260709);
  });

  it('同一日付は同一シード', () => {
    expect(dateStringToSeed('20260709')).toBe(dateStringToSeed('20260709'));
  });

  it('8桁数字以外は例外を投げる（事前条件）', () => {
    expect(() => dateStringToSeed('2026-07-09')).toThrow();
    expect(() => dateStringToSeed('2026070')).toThrow();
  });
});
