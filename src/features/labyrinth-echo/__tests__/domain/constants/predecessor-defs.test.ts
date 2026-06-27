import { PREDECESSORS } from '../../../domain/constants/predecessor-defs';

describe('PREDECESSORS', () => {
  it('先人は5名定義されている', () => {
    expect(PREDECESSORS).toHaveLength(5);
  });
  it('IDは一意である', () => {
    const ids = PREDECESSORS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('期待する先人IDを全て含む', () => {
    const ids = PREDECESSORS.map(p => p.id);
    expect(ids).toEqual(['p_lian', 'p_twins', 'p_galen', 'p_elna', 'p_first']);
  });
  it('truthLayer は 1〜4 の範囲', () => {
    for (const p of PREDECESSORS) {
      expect(p.truthLayer).toBeGreaterThanOrEqual(1);
      expect(p.truthLayer).toBeLessThanOrEqual(4);
    }
  });
  it('name/summary は非空、floors は非空配列', () => {
    for (const p of PREDECESSORS) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.summary.length).toBeGreaterThan(0);
      expect(p.floors.length).toBeGreaterThan(0);
    }
  });
});
