/**
 * 始祖トーテム — 定数とサービスのテスト
 */
import { TOTEMS, TB_DEFAULTS } from '../constants';
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

import { applyTotem, tick } from '../game-logic';
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

describe('applyTotem — 炎の祖', () => {
  it('burnDmgMul を 1.25 に設定する', () => {
    const r = applyTotem(makeRun({}), 'flame');
    expect(r.burnDmgMul).toBeCloseTo(1.25, 5);
  });

  it('火傷ダメージが burnDmgMul で増加する', () => {
    // 火傷あり・会心しない固定RNG（rng=0.99）で2ランを比較
    const baseRun = makeRun({
      atk: 100, aM: 1, dm: 1, burn: 1, cr: 0, def: 0,
      en: { n: 'test', hp: 100000, mhp: 100000, atk: 1, def: 0, bone: 0 },
    });
    const normal = tick(baseRun, false, () => 0.99);
    const flame = tick(applyTotem(baseRun, 'flame'), false, () => 0.99);
    const dmgNormal = normal.nextRun.dmgDealt;
    const dmgFlame = flame.nextRun.dmgDealt;
    // 火傷分のみ +25%。通常攻撃は同値なので flame 側が大きい
    expect(dmgFlame).toBeGreaterThan(dmgNormal);
  });
});

import { applyEvo } from '../game-logic';
import { EVOS } from '../constants';

describe('applyTotem — 群れの祖', () => {
  it('仲間枠+1・開始仲間1体・allyAtkBonus を設定する', () => {
    const base = makeRun({ al: [], mxA: 3 });
    const r = applyTotem(base, 'pack');
    expect(r.mxA).toBe(4);
    expect(r.al).toHaveLength(1);
    expect(r.al[0].a).toBe(1);
    expect(r.allyAtkBonus).toBeCloseTo(0.1, 5);
  });

  it('群れの祖の後にリクルートした仲間 ATK に +10% が乗る（tb.aA=0.2 との組合せで決定的に検証）', () => {
    // シナリオ:
    //   rit 文明 Lv2 でリクルートが発生。rng=()=>0 により ALT['rit'][0]（狂戦士 atk=9）が加入。
    //   tb.aA=0.2 固定。
    //   allyAtkBonus=0.1（群れの祖あり）: am = 1+0.2+0.1 = 1.3 → floor(9×1.3) = 11
    //   allyAtkBonus=0  （群れの祖なし）: am = 1+0.2+0.0 = 1.2 → floor(9×1.2) = 10
    //   → 差が floor 境界をまたぐため allyAtkBonus の有無を決定的に検証できる

    const ritEvo = EVOS.find(e => e.t === 'rit' && e.r === 0)!;
    const tbWithAllyAtk = { ...TB_DEFAULTS, aA: 0.2 };

    // ── allyAtkBonus=0.1 ありのラン（群れの祖トーテム適用） ──
    const baseWith = makeRun({ al: [], mxA: 5, cR: 0, tb: tbWithAllyAtk });
    const withTotem = applyTotem(baseWith, 'pack'); // allyAtkBonus=0.1 が設定される
    let runWith = withTotem;
    runWith = applyEvo(runWith, ritEvo, () => 0).nextRun; // cR=1
    runWith = applyEvo(runWith, ritEvo, () => 0).nextRun; // cR=2 → リクルート発生
    const recruitedWith = runWith.al[runWith.al.length - 1];

    // ── allyAtkBonus=0 なしのラン（群れの祖なし） ──
    const baseWithout = makeRun({ al: [], mxA: 5, cR: 0, tb: tbWithAllyAtk });
    let runWithout = baseWithout;
    runWithout = applyEvo(runWithout, ritEvo, () => 0).nextRun; // cR=1
    runWithout = applyEvo(runWithout, ritEvo, () => 0).nextRun; // cR=2 → リクルート発生
    const recruitedWithout = runWithout.al[runWithout.al.length - 1];

    // allyAtkBonus あり（11）の方が なし（10）より atk が大きいことを決定的に検証
    expect(recruitedWith.atk).toBe(11);
    expect(recruitedWithout.atk).toBe(10);
    expect(recruitedWith.atk).toBeGreaterThan(recruitedWithout.atk);
  });

});
