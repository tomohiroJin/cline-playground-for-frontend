/**
 * 始祖トーテム — 定数とサービスのテスト
 */
import { TOTEMS } from '../constants';
import type { TotemId } from '../types';

describe('TOTEMS 定数', () => {
  it('基本3種（血/炎/群れ）が定義され unlock=0 である', () => {
    const ids = TOTEMS.map(t => t.id);
    expect(ids).toEqual(expect.arrayContaining<TotemId>(['blood', 'flame', 'pack']));
    for (const id of ['blood', 'flame', 'pack'] as TotemId[]) {
      const t = TOTEMS.find(x => x.id === id);
      expect(t).toBeDefined();
      expect(t!.unlock).toBe(0);
    }
  });

  it('各トーテムは curve を持つ', () => {
    for (const t of TOTEMS) {
      expect(['front', 'scaling', 'combo', 'wild']).toContain(t.curve);
    }
  });

  it('TOTEMS は凍結されている', () => {
    expect(Object.isFrozen(TOTEMS)).toBe(true);
  });
});

import { applyTotem } from '../game-logic';
import { makeRun } from './test-helpers';

describe('applyTotem — 血の祖', () => {
  it('最大HP×0.8 ATK×1.2 会心+0.05 を適用し、totemId を記録する', () => {
    const base = makeRun({ mhp: 100, hp: 100, atk: 10, cr: 0.05 });
    const r = applyTotem(base, 'blood');
    expect(r.mhp).toBe(80);
    expect(r.hp).toBe(80); // hp も mhp に追従
    expect(r.atk).toBe(12);
    expect(r.cr).toBeCloseTo(0.10, 5);
    expect(r.totemId).toBe('blood');
  });

  it('元の RunState を破壊しない（純粋関数）', () => {
    const base = makeRun({ mhp: 100, hp: 100, atk: 10, cr: 0.05 });
    applyTotem(base, 'blood');
    expect(base.mhp).toBe(100);
    expect(base.atk).toBe(10);
  });
});
