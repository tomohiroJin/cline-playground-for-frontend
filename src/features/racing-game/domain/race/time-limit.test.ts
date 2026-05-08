// time-limit.ts の単体テスト

import { tickTime, isTimeUp } from './time-limit';

describe('tickTime', () => {
  it('正常な経過時間を残時間から減算する', () => {
    expect(tickTime(60, 1)).toBe(59);
  });

  it('小数の dt も正しく扱う', () => {
    expect(tickTime(60, 0.5)).toBeCloseTo(59.5);
  });

  it('残時間 0 でクランプされる', () => {
    expect(tickTime(0.5, 1)).toBe(0);
  });

  it('既に 0 の状態から減算しても負にならない', () => {
    expect(tickTime(0, 0.5)).toBe(0);
  });

  it('dt が 0 の場合はそのまま返す', () => {
    expect(tickTime(42, 0)).toBe(42);
  });
});

describe('isTimeUp', () => {
  it('残時間が 0 のとき true', () => {
    expect(isTimeUp(0)).toBe(true);
  });

  it('残時間が正のとき false', () => {
    expect(isTimeUp(0.001)).toBe(false);
    expect(isTimeUp(60)).toBe(false);
  });

  it('残時間が負（理論上ありえないが）のとき true', () => {
    expect(isTimeUp(-1)).toBe(true);
  });
});
