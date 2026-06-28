import { FINALE_BEATS } from '../../../domain/constants/finale-defs';

describe('FINALE_BEATS 契約', () => {
  it('3ビート（集う残響→始まりの探索者→最後の決断）', () => {
    expect(FINALE_BEATS).toHaveLength(3);
    expect(FINALE_BEATS.map(b => b.id)).toEqual(['fin_gather', 'fin_confront', 'fin_decide']);
  });
  it('各ビートは非空のタイトル・本文・選択肢を持つ', () => {
    for (const b of FINALE_BEATS) {
      expect(b.title.length).toBeGreaterThan(0);
      expect(b.text.length).toBeGreaterThan(0);
      expect(b.choices.length).toBeGreaterThan(0);
    }
  });
  it('最終ビートのみ decision を持つ2択（inherit/sever）、他ビートは非分岐', () => {
    const last = FINALE_BEATS[FINALE_BEATS.length - 1];
    expect(last.choices.map(c => c.decision).sort()).toEqual(['inherit', 'sever']);
    for (const b of FINALE_BEATS.slice(0, -1)) {
      for (const c of b.choices) expect(c.decision).toBeUndefined();
    }
  });
});
