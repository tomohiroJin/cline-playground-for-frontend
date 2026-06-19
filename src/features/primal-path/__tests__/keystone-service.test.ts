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

import { hasKeystone, applyKeystone, keystonePlayerAtkMods, onKeystoneKill } from '../game-logic';
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

describe('onKeystoneKill', () => {
  it('狩人の蓄積: キルで ksStacks.hunter_stack が +3 される', () => {
    const r = makeRun({ keystones: ['hunter_stack'], ksStacks: {} });
    onKeystoneKill(r);
    onKeystoneKill(r);
    expect(r.ksStacks?.hunter_stack).toBe(6);
  });

  it('連鎖の業火: 火傷中のキルで chain_blaze が +0.2、非火傷では増えない', () => {
    const burning = makeRun({ keystones: ['chain_blaze'], burn: 1, ksStacks: {} });
    onKeystoneKill(burning);
    expect(burning.ksStacks?.chain_blaze).toBeCloseTo(0.2, 5);

    const notBurning = makeRun({ keystones: ['chain_blaze'], burn: 0, ksStacks: {} });
    onKeystoneKill(notBurning);
    expect(notBurning.ksStacks?.chain_blaze ?? 0).toBe(0);
  });

  it('キーストーン未所持の場合は何もしない', () => {
    const r = makeRun({ keystones: [], ksStacks: {} });
    onKeystoneKill(r);
    expect(r.ksStacks).toEqual({});
  });
});

import { keystoneReflectDmg } from '../game-logic';

describe('keystoneReflectDmg', () => {
  it('棘の守護: 被ダメージの30%を反射', () => {
    const r = makeRun({ keystones: ['thorn_guard'] });
    expect(keystoneReflectDmg(r, 100)).toBe(30);
  });
  it('キーストーン無しは反射0', () => {
    expect(keystoneReflectDmg(makeRun({ keystones: [] }), 100)).toBe(0);
  });
});

import { isKeystoneFreezeTurn } from '../game-logic';

describe('isKeystoneFreezeTurn', () => {
  it('永久凍結: wTurn が4の倍数のターンで true', () => {
    expect(isKeystoneFreezeTurn(makeRun({ wTurn: 4, keystones: ['eternal_freeze'] }))).toBe(true);
    expect(isKeystoneFreezeTurn(makeRun({ wTurn: 8, keystones: ['eternal_freeze'] }))).toBe(true);
  });
  it('4の倍数でないターン・wTurn=0・キーストーン無しは false', () => {
    expect(isKeystoneFreezeTurn(makeRun({ wTurn: 3, keystones: ['eternal_freeze'] }))).toBe(false);
    expect(isKeystoneFreezeTurn(makeRun({ wTurn: 0, keystones: ['eternal_freeze'] }))).toBe(false);
    expect(isKeystoneFreezeTurn(makeRun({ wTurn: 4, keystones: [] }))).toBe(false);
  });
});

import { keystoneLethalGuard } from '../game-logic';

describe('keystoneLethalGuard', () => {
  it('不滅の祈り: 未使用なら hp=1 で耐え、ksGuardUsed が立つ', () => {
    const r = makeRun({ hp: 0, keystones: ['undying_prayer'], ksGuardUsed: false });
    expect(keystoneLethalGuard(r)).toBe(true);
    expect(r.hp).toBe(1);
    expect(r.ksGuardUsed).toBe(true);
  });
  it('使用済みなら耐えない', () => {
    const r = makeRun({ hp: 0, keystones: ['undying_prayer'], ksGuardUsed: true });
    expect(keystoneLethalGuard(r)).toBe(false);
  });
  it('キーストーン無しは耐えない', () => {
    expect(keystoneLethalGuard(makeRun({ hp: 0, keystones: [] }))).toBe(false);
  });
});

import { unownedKeystones, shouldOfferKeystone, rollKeystones } from '../game-logic';

describe('キーストーン抽選', () => {
  it('unownedKeystones は取得済みを除外する', () => {
    const owned = KEYSTONES.slice(0, 2).map(k => k.id);
    const r = makeRun({ keystones: owned });
    const un = unownedKeystones(r);
    expect(un).toHaveLength(KEYSTONES.length - 2);
    expect(un.some(k => owned.includes(k.id))).toBe(false);
  });

  it('shouldOfferKeystone は未取得が残れば true、全取得で false', () => {
    expect(shouldOfferKeystone(makeRun({ keystones: [] }))).toBe(true);
    expect(shouldOfferKeystone(makeRun({ keystones: KEYSTONES.map(k => k.id) }))).toBe(false);
  });

  it('rollKeystones は最大3択・distinct・未取得のみ', () => {
    const r = makeRun({ keystones: [] });
    const picks = rollKeystones(r, () => 0);
    expect(picks).toHaveLength(3);
    const ids = picks.map(p => p.id);
    expect(new Set(ids).size).toBe(3);
    expect(picks.every(p => !r.keystones?.includes(p.id))).toBe(true);
  });

  it('未取得が3未満なら残り全てを返す', () => {
    const owned = KEYSTONES.slice(0, KEYSTONES.length - 2).map(k => k.id);
    const picks = rollKeystones(makeRun({ keystones: owned }), () => 0);
    expect(picks).toHaveLength(2);
  });
});
