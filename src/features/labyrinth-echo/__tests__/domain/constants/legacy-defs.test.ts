import { LEGACIES } from '../../../domain/constants/legacy-defs';
import { PREDECESSORS } from '../../../domain/constants/predecessor-defs';

const predIds = new Set(PREDECESSORS.map(p => p.id));

describe('LEGACIES 契約', () => {
  it('レガシーは5種', () => {
    expect(LEGACIES).toHaveLength(5);
  });
  it('id は一意で lg_ プレフィックス', () => {
    const ids = LEGACIES.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith('lg_')).toBe(true);
  });
  it('predecessorId は全て有効な先人を指し、先人ごとに1つ', () => {
    const preds = LEGACIES.map(l => l.predecessorId);
    for (const pid of preds) expect(predIds.has(pid)).toBe(true);
    expect(new Set(preds).size).toBe(LEGACIES.length);
  });
  it('upside/downside は非空、fx は非空デルタ', () => {
    for (const l of LEGACIES) {
      expect(l.upside.length).toBeGreaterThan(0);
      expect(l.downside.length).toBeGreaterThan(0);
      expect(Object.keys(l.fx).length).toBeGreaterThan(0);
    }
  });
  it('期待する5種を含む（lg_lian/twins/galen/elna/first）', () => {
    expect(LEGACIES.map(l => l.id).sort()).toEqual(
      ['lg_elna', 'lg_first', 'lg_galen', 'lg_lian', 'lg_twins'],
    );
  });
  it('lg_elna は HP・精神両軸の被ダメ軽減を「全被ダメ」と明記する', () => {
    // Arrange
    const elna = LEGACIES.find(l => l.id === 'lg_elna');
    // Assert: hpReduce/mnReduce の両方を持つため、片側のみと誤解されないよう「全被ダメ」と明記する
    expect(elna?.fx.hpReduce).toBe(0.82);
    expect(elna?.fx.mnReduce).toBe(0.82);
    expect(elna?.upside).toContain('全被ダメ');
  });
});
