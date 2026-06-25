import { ECHO_FRAGMENTS } from '../../../domain/constants/echo-fragment-defs';
import { PREDECESSORS } from '../../../domain/constants/predecessor-defs';

const predIds = new Set(PREDECESSORS.map(p => p.id));

describe('ECHO_FRAGMENTS 契約', () => {
  it('断片は合計19件', () => {
    expect(ECHO_FRAGMENTS).toHaveLength(19);
  });
  it('断片IDは一意', () => {
    const ids = ECHO_FRAGMENTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('predecessorId は全て有効な先人を指す', () => {
    for (const f of ECHO_FRAGMENTS) expect(predIds.has(f.predecessorId)).toBe(true);
  });
  it('depthGate は 0〜6 の範囲', () => {
    for (const f of ECHO_FRAGMENTS) {
      expect(f.depthGate).toBeGreaterThanOrEqual(0);
      expect(f.depthGate).toBeLessThanOrEqual(6);
    }
  });
  it('floors は非空、title/body は非空', () => {
    for (const f of ECHO_FRAGMENTS) {
      expect(f.floors.length).toBeGreaterThan(0);
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.body.length).toBeGreaterThan(0);
    }
  });
  it('先人ごとの断片数は p_lian4/p_twins4/p_galen4/p_elna4/p_first3', () => {
    const count = (pid: string) => ECHO_FRAGMENTS.filter(f => f.predecessorId === pid).length;
    expect(count('p_lian')).toBe(4);
    expect(count('p_twins')).toBe(4);
    expect(count('p_galen')).toBe(4);
    expect(count('p_elna')).toBe(4);
    expect(count('p_first')).toBe(3);
  });
  it('各先人の order は 1 始まりの連番', () => {
    for (const p of PREDECESSORS) {
      const orders = ECHO_FRAGMENTS.filter(f => f.predecessorId === p.id).map(f => f.order).sort((a, b) => a - b);
      orders.forEach((o, i) => expect(o).toBe(i + 1));
    }
  });
});
