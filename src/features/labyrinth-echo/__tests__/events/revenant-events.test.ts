import { REVENANT_EVENTS } from '../../events/revenant-events';
import { EVENT_TYPE } from '../../domain/constants/event-type-defs';
import { validateEvents } from '../../events/event-utils';
import { PREDECESSORS } from '../../domain/constants/predecessor-defs';
import { createMetaState } from '../../domain/models/meta-state';

const predIds = new Set(PREDECESSORS.map(p => p.id));

describe('REVENANT_EVENTS 契約', () => {
  it('亡霊は5件', () => { expect(REVENANT_EVENTS).toHaveLength(5); });

  it('全件が tp:"revenant" で minPressure と metaCond を持つ', () => {
    for (const e of REVENANT_EVENTS) {
      expect(e.tp).toBe('revenant');
      expect(typeof e.minPressure).toBe('number');
      expect(e.minPressure!).toBeGreaterThanOrEqual(2);
      expect(e.minPressure!).toBeLessThanOrEqual(5);
      expect(typeof e.metaCond).toBe('function');
    }
  });

  it('各亡霊に revenant:<predId> フラグの outcome がありその predId は有効', () => {
    const flagged = REVENANT_EVENTS.flatMap(e =>
      e.ch.flatMap(c => c.o).map(o => o.fl).filter((fl): fl is string => !!fl && fl.startsWith('revenant:')).map(fl => fl.slice('revenant:'.length)),
    );
    expect(flagged.length).toBeGreaterThanOrEqual(REVENANT_EVENTS.length);
    for (const id of flagged) expect(predIds.has(id)).toBe(true);
  });

  it('metaCond は対応先人を発見済みのとき true、未発見で false', () => {
    const lian = REVENANT_EVENTS.find(e => e.id === 'rv_lian')!;
    expect(lian.metaCond!(createMetaState({ fragments: [] }))).toBe(false);
    expect(lian.metaCond!(createMetaState({ fragments: ['f_lian_1'] }))).toBe(true);
  });

  it('validateEvents を通過する', () => {
    expect(() => validateEvents([...REVENANT_EVENTS], EVENT_TYPE)).not.toThrow();
  });
});
