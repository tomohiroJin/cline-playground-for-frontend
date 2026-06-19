/**
 * キーストーン — 定数とエンジンのテスト
 */
import { KEYSTONES } from '../constants';
import type { KeystoneId } from '../types';

describe('KEYSTONES 定数', () => {
  it('10種が定義され、id が一意である', () => {
    expect(KEYSTONES).toHaveLength(10);
    const ids = KEYSTONES.map(k => k.id);
    expect(new Set(ids).size).toBe(10);
  });

  it('各キーストーンは tag と curve を持つ', () => {
    for (const k of KEYSTONES) {
      expect(k.tag).toBeTruthy();
      expect(['front', 'scaling', 'combo', 'wild']).toContain(k.curve);
    }
  });

  it('代表 id が含まれる', () => {
    const ids = KEYSTONES.map(k => k.id);
    const expected: KeystoneId[] = ['madblood', 'chain_blaze', 'thorn_guard', 'double_edge'];
    expect(ids).toEqual(expect.arrayContaining(expected));
  });

  it('KEYSTONES は凍結されている', () => {
    expect(Object.isFrozen(KEYSTONES)).toBe(true);
  });
});

import { hasKeystone, applyKeystone } from '../game-logic';
import { makeRun } from './test-helpers';

describe('applyKeystone / hasKeystone', () => {
  it('applyKeystone は keystones に id を追加し hasKeystone が true を返す', () => {
    const r = applyKeystone(makeRun({ keystones: [] }), 'madblood');
    expect(hasKeystone(r, 'madblood')).toBe(true);
  });

  it('諸刃の進化: DEFを0にし、失ったDEF×3をATKへ変換する', () => {
    const r = applyKeystone(makeRun({ atk: 10, def: 8, keystones: [] }), 'double_edge');
    expect(r.def).toBe(0);
    expect(r.atk).toBe(10 + 8 * 3); // 34
  });

  it('元の RunState を破壊しない（純粋）', () => {
    const base = makeRun({ atk: 10, def: 8, keystones: [] });
    applyKeystone(base, 'double_edge');
    expect(base.def).toBe(8);
    expect(base.atk).toBe(10);
  });
});
