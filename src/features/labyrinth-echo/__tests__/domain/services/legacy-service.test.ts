import {
  mergeLegacyIntoFx, unlockedLegacies, getLegacyById, legacyForPredecessor,
} from '../../../domain/services/legacy-service';
import { computeFx } from '../../../domain/services/unlock-service';
import { LEGACIES } from '../../../domain/constants/legacy-defs';
import { ECHO_FRAGMENTS } from '../../../domain/constants/echo-fragment-defs';

const base = computeFx([]); // FX_DEFAULTS 相当（加算0・乗算1・ブールfalse）
const lian = LEGACIES.find(l => l.id === 'lg_lian')!;
const lianFrags = ECHO_FRAGMENTS.filter(f => f.predecessorId === 'p_lian').map(f => f.id);

describe('legacy-service', () => {
  it('mergeLegacyIntoFx(base, null) は base を不変返し（回帰）', () => {
    expect(mergeLegacyIntoFx(base, null)).toEqual(base);
  });

  it('加算キーは加算・乗算キーは乗算・ブールキーは OR', () => {
    const merged = mergeLegacyIntoFx(base, lian);
    expect(merged.infoBonus).toBe(8);      // 0 + 8
    expect(merged.infoMult).toBeCloseTo(1.3, 5); // 1 * 1.3
    expect(merged.healMult).toBeCloseTo(0.55, 5); // 1 * 0.55
    expect(merged.hpReduce).toBeCloseTo(1.2, 5);  // 1 * 1.2
  });

  it('ブール上振れが OR で立つ（lg_twins の secondLife）', () => {
    const twins = LEGACIES.find(l => l.id === 'lg_twins')!;
    expect(mergeLegacyIntoFx(base, twins).secondLife).toBe(true);
    expect(mergeLegacyIntoFx(base, twins).hpBonus).toBe(-10);
  });

  it('unlockedLegacies は完成先人のレガシーのみ返す', () => {
    expect(unlockedLegacies([])).toEqual([]);
    const unlocked = unlockedLegacies(lianFrags);
    expect(unlocked.map(l => l.id)).toEqual(['lg_lian']);
  });

  it('getLegacyById は null/不明で null、既知で該当を返す', () => {
    expect(getLegacyById(null)).toBeNull();
    expect(getLegacyById('nope')).toBeNull();
    expect(getLegacyById('lg_lian')?.id).toBe('lg_lian');
  });

  it('legacyForPredecessor は先人IDから該当レガシーを返す', () => {
    expect(legacyForPredecessor('p_lian')?.id).toBe('lg_lian');
    expect(legacyForPredecessor('p_none')).toBeNull();
  });
});
