// time-format のテスト

import { formatTimeMS, formatTimeMScc } from './time-format';

describe('formatTimeMS', () => {
  it('0 秒は "0:00"', () => {
    expect(formatTimeMS(0)).toBe('0:00');
  });
  it('整数秒切り捨て', () => {
    expect(formatTimeMS(42.7)).toBe('0:42');
  });
  it('60 秒で 1:00', () => {
    expect(formatTimeMS(60)).toBe('1:00');
  });
  it('負値は 0:00 にクランプ', () => {
    expect(formatTimeMS(-1)).toBe('0:00');
  });
});

describe('formatTimeMScc', () => {
  it('精密表示は M:SS:cc', () => {
    expect(formatTimeMScc(83.45)).toBe('1:23:45');
  });
  it('境界 0:00:00', () => {
    expect(formatTimeMScc(0)).toBe('0:00:00');
  });
  it('小数の処理', () => {
    expect(formatTimeMScc(50.999)).toBe('0:50:99');
  });
});
