import { TRUTH_LAYERS } from '../../../domain/constants/truth-defs';

describe('TRUTH_LAYERS', () => {
  it('真相レイヤーは4件', () => {
    expect(TRUTH_LAYERS).toHaveLength(4);
  });
  it('layer は 1,2,3,4', () => {
    expect(TRUTH_LAYERS.map(t => t.layer)).toEqual([1, 2, 3, 4]);
  });
  it('depthGate は昇順', () => {
    const gates = TRUTH_LAYERS.map(t => t.depthGate);
    expect([...gates].sort((a, b) => a - b)).toEqual(gates);
  });
  it('title/text は非空', () => {
    for (const t of TRUTH_LAYERS) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.text.length).toBeGreaterThan(0);
    }
  });
});
