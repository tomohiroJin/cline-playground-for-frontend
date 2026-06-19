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

import { hasKeystone, applyKeystone, keystonePlayerAtkMods } from '../game-logic';
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

describe('keystonePlayerAtkMods', () => {
  it('狂血の覚醒: HP30%以下で mult ×2', () => {
    const low = makeRun({ hp: 20, mhp: 100, keystones: ['madblood'] });
    expect(keystonePlayerAtkMods(low).mult).toBeCloseTo(2, 5);
    const high = makeRun({ hp: 80, mhp: 100, keystones: ['madblood'] });
    expect(keystonePlayerAtkMods(high).mult).toBeCloseTo(1, 5);
  });

  it('群狼の戦術: 生存仲間1体ごとに +10%', () => {
    const al = [
      { n: 'a', hp: 1, mhp: 1, atk: 1, t: 'life' as const, a: 1 as const },
      { n: 'b', hp: 1, mhp: 1, atk: 1, t: 'life' as const, a: 1 as const },
    ];
    const r = makeRun({ al, keystones: ['wolf_pack'] });
    expect(keystonePlayerAtkMods(r).mult).toBeCloseTo(1.2, 5);
  });

  it('骨喰らい: 獲得骨10ごとに +1（flat）', () => {
    const r = makeRun({ bE: 35, keystones: ['bone_eater'] });
    expect(keystonePlayerAtkMods(r).flatAdd).toBe(3);
  });

  it('狩人の蓄積: ksStacks.hunter_stack を flat 加算', () => {
    const r = makeRun({ ksStacks: { hunter_stack: 9 }, keystones: ['hunter_stack'] });
    expect(keystonePlayerAtkMods(r).flatAdd).toBe(9);
  });

  it('原始の咆哮: cW=1 で +50%、cW=3 で +30%', () => {
    expect(keystonePlayerAtkMods(makeRun({ cW: 1, keystones: ['primal_roar'] })).mult).toBeCloseTo(1.5, 5);
    expect(keystonePlayerAtkMods(makeRun({ cW: 3, keystones: ['primal_roar'] })).mult).toBeCloseTo(1.3, 5);
  });

  it('キーストーン無しなら flatAdd=0, mult=1', () => {
    const r = makeRun({ keystones: [] });
    expect(keystonePlayerAtkMods(r)).toEqual({ flatAdd: 0, mult: 1 });
  });
});
