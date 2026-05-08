// rank.ts の単体テスト

import type { Stage } from './stage';
import { judgeRank } from './rank';

const stage: Pick<Stage, 'goldRankTimeSec' | 'silverRankTimeSec'> = {
  goldRankTimeSec: 50,
  silverRankTimeSec: 65,
};

describe('judgeRank', () => {
  it('goldRankTimeSec ぴったりは GOLD', () => {
    expect(judgeRank(50, stage)).toBe('GOLD');
  });

  it('goldRankTimeSec 未満は GOLD', () => {
    expect(judgeRank(49, stage)).toBe('GOLD');
    expect(judgeRank(0.001, stage)).toBe('GOLD');
  });

  it('goldRankTimeSec 超 silverRankTimeSec 以下は SILVER', () => {
    expect(judgeRank(51, stage)).toBe('SILVER');
    expect(judgeRank(65, stage)).toBe('SILVER');
  });

  it('silverRankTimeSec 超は BRONZE', () => {
    expect(judgeRank(66, stage)).toBe('BRONZE');
    expect(judgeRank(120, stage)).toBe('BRONZE');
  });
});
