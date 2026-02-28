/**
 * 原始進化録 - シナジーシステムのユニットテスト
 */
import type { Evolution, ActiveSynergy, SynergyTag, RunState } from '../types';
import { calcSynergies, applySynergyBonuses, tick, applyEvo } from '../game-logic';
import { SYNERGY_BONUSES, TB_DEFAULTS, DIFFS, EVOS } from '../constants';

/* ===== テスト用ヘルパー ===== */

/** タグ付き進化を生成する */
function mkEvo(tags: SynergyTag[]): Evolution {
  return { n: 'test', d: 'test', t: 'tech', r: 0, e: { atk: 1 }, tags };
}

/* ===== calcSynergies ===== */

describe('calcSynergies', () => {
  describe('タグ集計', () => {
    it('タグなしの進化ではシナジーが発動しない', () => {
      const evos: Evolution[] = [
        { n: 'a', d: '', t: 'tech', r: 0, e: { atk: 1 } },
        { n: 'b', d: '', t: 'life', r: 0, e: { def: 1 } },
      ];
      const result = calcSynergies(evos);
      expect(result).toHaveLength(0);
    });

    it('同タグ1個ではシナジーが発動しない', () => {
      const evos = [mkEvo(['fire']), mkEvo(['ice'])];
      const result = calcSynergies(evos);
      expect(result).toHaveLength(0);
    });

    it('同タグ2個でTier1シナジーが発動する', () => {
      const evos = [mkEvo(['fire']), mkEvo(['fire', 'ice'])];
      const result = calcSynergies(evos);
      const fireSyn = result.find(s => s.tag === 'fire');
      expect(fireSyn).toBeDefined();
      expect(fireSyn!.tier).toBe(1);
      expect(fireSyn!.count).toBe(2);
    });

    it('同タグ3個でTier2シナジーが発動する', () => {
      const evos = [mkEvo(['fire']), mkEvo(['fire']), mkEvo(['fire', 'ice'])];
      const result = calcSynergies(evos);
      const fireSyn = result.find(s => s.tag === 'fire');
      expect(fireSyn).toBeDefined();
      expect(fireSyn!.tier).toBe(2);
      expect(fireSyn!.count).toBe(3);
    });

    it('同タグ4個以上でもTier2のまま', () => {
      const evos = [mkEvo(['fire']), mkEvo(['fire']), mkEvo(['fire']), mkEvo(['fire'])];
      const result = calcSynergies(evos);
      const fireSyn = result.find(s => s.tag === 'fire');
      expect(fireSyn).toBeDefined();
      expect(fireSyn!.tier).toBe(2);
      expect(fireSyn!.count).toBe(4);
    });

    it('複数タグのシナジーが同時に発動する', () => {
      const evos = [
        mkEvo(['fire', 'hunt']),
        mkEvo(['fire', 'hunt']),
        mkEvo(['ice']),
        mkEvo(['ice']),
      ];
      const result = calcSynergies(evos);
      expect(result).toHaveLength(3); // fire, hunt, ice
      expect(result.find(s => s.tag === 'fire')?.tier).toBe(1);
      expect(result.find(s => s.tag === 'hunt')?.tier).toBe(1);
      expect(result.find(s => s.tag === 'ice')?.tier).toBe(1);
    });

    it('空の進化配列では空配列を返す', () => {
      expect(calcSynergies([])).toHaveLength(0);
    });

    it('複数Tier2シナジーが同時発動する', () => {
      const evos = [
        mkEvo(['fire', 'hunt']), mkEvo(['fire']), mkEvo(['fire']),
        mkEvo(['hunt']), mkEvo(['hunt']),
      ];
      const result = calcSynergies(evos);
      const fireSyn = result.find(s => s.tag === 'fire');
      const huntSyn = result.find(s => s.tag === 'hunt');
      expect(fireSyn!.tier).toBe(2);
      expect(fireSyn!.count).toBe(3);
      expect(huntSyn!.tier).toBe(2);
      expect(huntSyn!.count).toBe(3);
    });

    it('bonusNameが正しく設定される', () => {
      const evos = [mkEvo(['hunt']), mkEvo(['hunt'])];
      const result = calcSynergies(evos);
      const huntSyn = result.find(s => s.tag === 'hunt');
      expect(huntSyn).toBeDefined();
      const def = SYNERGY_BONUSES.find(b => b.tag === 'hunt');
      expect(huntSyn!.bonusName).toBe(def!.tier1.name);
    });

    it('Tier2ではTier2のbonusNameが設定される', () => {
      const evos = [mkEvo(['hunt']), mkEvo(['hunt']), mkEvo(['hunt'])];
      const result = calcSynergies(evos);
      const huntSyn = result.find(s => s.tag === 'hunt');
      const def = SYNERGY_BONUSES.find(b => b.tag === 'hunt');
      expect(huntSyn!.bonusName).toBe(def!.tier2.name);
    });
  });
});

/* ===== applySynergyBonuses ===== */

describe('applySynergyBonuses', () => {
  it('シナジーなしではボーナスが0', () => {
    const result = applySynergyBonuses([]);
    expect(result.atkBonus).toBe(0);
    expect(result.defBonus).toBe(0);
    expect(result.hpBonus).toBe(0);
    expect(result.crBonus).toBe(0);
    expect(result.burnMul).toBe(1);
    expect(result.healBonusRatio).toBe(0);
    expect(result.allyAtkBonus).toBe(0);
    expect(result.allyHpBonus).toBe(0);
  });

  it('huntタグTier1でATK+8', () => {
    const synergies: ActiveSynergy[] = [
      { tag: 'hunt', count: 2, tier: 1, bonusName: '鋭い爪' },
    ];
    const result = applySynergyBonuses(synergies);
    expect(result.atkBonus).toBe(8);
  });

  it('huntタグTier2でATK+15 会心+10', () => {
    const synergies: ActiveSynergy[] = [
      { tag: 'hunt', count: 3, tier: 2, bonusName: '捕食者の本能' },
    ];
    const result = applySynergyBonuses(synergies);
    expect(result.atkBonus).toBe(15);
    expect(result.crBonus).toBe(10);
  });

  it('fireTier1で火傷ダメージ+30%', () => {
    const synergies: ActiveSynergy[] = [
      { tag: 'fire', count: 2, tier: 1, bonusName: '灼熱の魂' },
    ];
    const result = applySynergyBonuses(synergies);
    expect(result.burnMul).toBeCloseTo(1.3);
  });

  it('fireTier2で火傷2倍+ATK+10', () => {
    const synergies: ActiveSynergy[] = [
      { tag: 'fire', count: 3, tier: 2, bonusName: '業火の化身' },
    ];
    const result = applySynergyBonuses(synergies);
    expect(result.burnMul).toBeCloseTo(2.0);
    expect(result.atkBonus).toBe(10);
  });

  it('regenTier1でhealBonusRatio+0.5', () => {
    const synergies: ActiveSynergy[] = [
      { tag: 'regen', count: 2, tier: 1, bonusName: '生命の息吹' },
    ];
    const result = applySynergyBonuses(synergies);
    expect(result.healBonusRatio).toBeCloseTo(0.5);
  });

  it('tribeTier1で仲間ATK+5', () => {
    const synergies: ActiveSynergy[] = [
      { tag: 'tribe', count: 2, tier: 1, bonusName: '部族の絆' },
    ];
    const result = applySynergyBonuses(synergies);
    expect(result.allyAtkBonus).toBe(5);
  });

  it('tribeTier2で仲間ATK+12 仲間HP+15', () => {
    const synergies: ActiveSynergy[] = [
      { tag: 'tribe', count: 3, tier: 2, bonusName: '大部族の誇り' },
    ];
    const result = applySynergyBonuses(synergies);
    expect(result.allyAtkBonus).toBe(12);
    expect(result.allyHpBonus).toBe(15);
  });

  it('複数シナジーのボーナスが加算される', () => {
    const synergies: ActiveSynergy[] = [
      { tag: 'hunt', count: 2, tier: 1, bonusName: '鋭い爪' },
      { tag: 'shield', count: 2, tier: 1, bonusName: '硬い皮膚' },
    ];
    const result = applySynergyBonuses(synergies);
    expect(result.atkBonus).toBe(8);
    expect(result.defBonus).toBe(3);
  });

  it('iceTier1でDEF+5', () => {
    const synergies: ActiveSynergy[] = [
      { tag: 'ice', count: 2, tier: 1, bonusName: '凍てつく風' },
    ];
    const result = applySynergyBonuses(synergies);
    expect(result.defBonus).toBe(5);
  });

  it('wildTier1で会心+5', () => {
    const synergies: ActiveSynergy[] = [
      { tag: 'wild', count: 2, tier: 1, bonusName: '野生の勘' },
    ];
    const result = applySynergyBonuses(synergies);
    expect(result.crBonus).toBe(5);
  });
});

/* ===== tick() シナジー統合テスト ===== */

/** テスト用RunState生成ヘルパー */
function makeRun(overrides: Partial<RunState> = {}): RunState {
  return {
    hp: 80, mhp: 80, atk: 8, def: 2, cr: 0.05, burn: 0, aM: 1, dm: 1,
    cT: 0, cL: 0, cR: 0,
    al: [], bms: ['grassland', 'glacier', 'volcano'],
    cB: 1, cBT: 'grassland', cW: 1, wpb: 4, bE: 0, bb: 0,
    di: 0, dd: DIFFS[0], fe: null, tb: { ...TB_DEFAULTS },
    mxA: 3, evoN: 3, fReq: 5, saReq: 4,
    rvU: 0, bc: 0, log: [], turn: 0, kills: 0,
    dmgDealt: 0, dmgTaken: 0, maxHit: 0, wDmg: 0, wTurn: 0,
    awoken: [], en: null, sk: { avl: [], cds: {}, bfs: [] },
    evs: [],
    btlCount: 0, eventCount: 0,
    _wDmgBase: 0, _fbk: '', _fPhase: 0,
    ...overrides,
  };
}

describe('tick() シナジー統合', () => {
  it('huntシナジーでATKボーナスが攻撃ダメージに反映される', () => {
    // Arrange: huntタグ進化2枚 → Tier1 ATK+8
    const huntEvos: Evolution[] = [mkEvo(['hunt']), mkEvo(['hunt'])];
    const enemy = { n: 'テスト', hp: 500, mhp: 500, atk: 5, def: 0, bone: 1 };
    const runWithSyn = makeRun({ evs: huntEvos, en: enemy });
    const runNoSyn = makeRun({ en: { ...enemy }, evs: [] });

    // Act
    const { nextRun: r1 } = tick(runWithSyn, false, () => 0.99);
    const { nextRun: r2 } = tick(runNoSyn, false, () => 0.99);

    // Assert: シナジーありの方がダメージが多い
    expect(r1.dmgDealt).toBeGreaterThan(r2.dmgDealt);
  });

  it('fireシナジーで火傷ダメージが増加する', () => {
    // Arrange: fireタグ進化2枚 → Tier1 burnMul=1.3
    const fireEvos: Evolution[] = [mkEvo(['fire']), mkEvo(['fire'])];
    const enemy = { n: 'テスト', hp: 500, mhp: 500, atk: 5, def: 0, bone: 1 };
    const runWithSyn = makeRun({ burn: 1, evs: fireEvos, en: enemy });
    const runNoSyn = makeRun({ burn: 1, en: { ...enemy }, evs: [] });

    // Act
    const { nextRun: r1 } = tick(runWithSyn, false, () => 0.99);
    const { nextRun: r2 } = tick(runNoSyn, false, () => 0.99);

    // Assert: シナジーありの方が総ダメージが多い（火傷ダメージ増加分）
    expect(r1.dmgDealt).toBeGreaterThan(r2.dmgDealt);
  });

  it('shieldシナジーでDEFボーナスにより被ダメが軽減される', () => {
    // Arrange: shieldタグ進化2枚 → Tier1 DEF+3
    const shieldEvos: Evolution[] = [mkEvo(['shield']), mkEvo(['shield'])];
    const enemy = { n: 'テスト', hp: 500, mhp: 500, atk: 20, def: 0, bone: 1 };
    const runWithSyn = makeRun({ evs: shieldEvos, en: enemy });
    const runNoSyn = makeRun({ en: { ...enemy }, evs: [] });

    // Act
    const { nextRun: r1 } = tick(runWithSyn, false, () => 0.99);
    const { nextRun: r2 } = tick(runNoSyn, false, () => 0.99);

    // Assert: シナジーありの方が被ダメが少ない
    expect(r1.dmgTaken).toBeLessThan(r2.dmgTaken);
  });

  it('tribeシナジーで仲間の攻撃ダメージが増加する', () => {
    // Arrange: tribeタグ進化2枚 → Tier1 allyAtkBonus+5
    const tribeEvos: Evolution[] = [mkEvo(['tribe']), mkEvo(['tribe'])];
    const ally = { n: '仲間', hp: 50, mhp: 50, atk: 10, t: 'tech' as const, a: 1 };
    const enemy = { n: 'テスト', hp: 500, mhp: 500, atk: 5, def: 0, bone: 1 };
    const runWithSyn = makeRun({ al: [{ ...ally }], evs: tribeEvos, en: enemy });
    const runNoSyn = makeRun({ al: [{ ...ally }], en: { ...enemy }, evs: [] });

    // Act
    const { nextRun: r1 } = tick(runWithSyn, false, () => 0.99);
    const { nextRun: r2 } = tick(runNoSyn, false, () => 0.99);

    // Assert: シナジーありの方が合計ダメージが多い
    expect(r1.dmgDealt).toBeGreaterThan(r2.dmgDealt);
  });

  it('applyEvo で進化が evs に記録される', () => {
    const run = makeRun();
    const evo = EVOS[0];
    const { nextRun } = applyEvo(run, evo);
    expect(nextRun.evs).toHaveLength(1);
    expect(nextRun.evs[0]).toBe(evo);
    // 元のステートは不変
    expect(run.evs).toHaveLength(0);
  });

  it('新規進化6種がEVOS内に存在しデュアルタグを持つ', () => {
    const newNames = ['霜の牙', '野火の種', '根の盾', '祖霊の祝福', '血の熱狂', '凍れる祈り'];
    for (const name of newNames) {
      const evo = EVOS.find(e => e.n === name);
      expect(evo).toBeDefined();
      expect(evo!.tags).toBeDefined();
      expect(evo!.tags!.length).toBe(2);
    }
  });

  it('regenシナジーでHP回復量が増加する', () => {
    // Arrange: regenタグ進化2枚 → Tier1 healBonusRatio=0.5
    const regenEvos: Evolution[] = [mkEvo(['regen']), mkEvo(['regen'])];
    const enemy = { n: 'テスト', hp: 500, mhp: 500, atk: 5, def: 0, bone: 1 };
    // tb.rg > 0 でリジェネ有効
    const tb = { ...TB_DEFAULTS, rg: 0.02 };
    const runWithSyn = makeRun({ hp: 50, mhp: 80, evs: regenEvos, en: enemy, tb });
    const runNoSyn = makeRun({ hp: 50, mhp: 80, en: { ...enemy }, tb: { ...tb }, evs: [] });

    // Act
    const { nextRun: r1 } = tick(runWithSyn, false, () => 0.99);
    const { nextRun: r2 } = tick(runNoSyn, false, () => 0.99);

    // Assert: シナジーありの方がHP回復が多い（被ダメ考慮後も）
    // HPの差で比較: r1.hp - r2.hp > 0 （同じ被ダメなので回復分だけ差がつく）
    const hpDiff1 = r1.hp - 50;
    const hpDiff2 = r2.hp - 50;
    expect(hpDiff1).toBeGreaterThan(hpDiff2);
  });
});
