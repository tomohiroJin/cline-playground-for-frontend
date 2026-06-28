import { TRUE_ENDINGS, TRUE_ENDING_PROMOTE_PRESSURE } from '../../../domain/constants/true-ending-defs';

describe('TRUE_ENDINGS 契約', () => {
  it('真END4種・id一意・te_ プレフィックス', () => {
    const ids = TRUE_ENDINGS.map(e => e.id);
    expect(ids.sort()).toEqual(['te_inheritor', 'te_inheritor_true', 'te_liberator', 'te_liberator_true']);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith('te_')).toBe(true);
  });
  it('cond は常に false（通常の determineEnding スキャンに載らない）', () => {
    const dummy = { hp: 50, maxHp: 50, mn: 30, maxMn: 30, inf: 5, statuses: [] } as never;
    for (const e of TRUE_ENDINGS) expect(e.cond(dummy, [], null)).toBe(false);
  });
  it('名称・説明は非空、bonusKp は正、昇格版は基本版以上の bonusKp', () => {
    for (const e of TRUE_ENDINGS) {
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.description.length).toBeGreaterThan(0);
      expect(e.bonusKp).toBeGreaterThan(0);
    }
    const byId = Object.fromEntries(TRUE_ENDINGS.map(e => [e.id, e]));
    expect(byId['te_inheritor_true'].bonusKp).toBeGreaterThanOrEqual(byId['te_inheritor'].bonusKp);
    expect(byId['te_liberator_true'].bonusKp).toBeGreaterThanOrEqual(byId['te_liberator'].bonusKp);
  });
  it('昇格しきい値は 5', () => {
    expect(TRUE_ENDING_PROMOTE_PRESSURE).toBe(5);
  });
});
