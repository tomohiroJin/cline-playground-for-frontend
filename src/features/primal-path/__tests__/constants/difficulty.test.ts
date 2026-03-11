/**
 * constants/difficulty.ts のテスト
 */
import { DIFFS } from '../../constants/difficulty';

describe('constants/difficulty', () => {
  it('4段階の難易度が定義されている', () => {
    expect(DIFFS).toHaveLength(4);
  });

  it('各難易度に必要なプロパティが揃っている', () => {
    DIFFS.forEach(d => {
      expect(d).toHaveProperty('n');
      expect(d).toHaveProperty('d');
      expect(d).toHaveProperty('env');
      expect(d).toHaveProperty('hm');
      expect(d).toHaveProperty('am');
    });
  });

  it('難易度のアンロック条件が昇順に並んでいる', () => {
    for (let i = 1; i < DIFFS.length; i++) {
      expect(DIFFS[i].ul).toBeGreaterThanOrEqual(DIFFS[i - 1].ul);
    }
  });
});
