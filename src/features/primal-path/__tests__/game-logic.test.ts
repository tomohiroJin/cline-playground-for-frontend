/**
 * 原始進化録 - PRIMAL PATH - ゲームロジックテスト
 */
import {
  clamp, applyStatFx, getSnap, effATK, civLvs, civMin, civLv,
  biomeBonus, calcEnvDmg, getTB, scaleEnemy, simEvo, rollE,
  applyEvo, calcPlayerAtk, tick, startRunState, calcBoneReward,
  allyReviveCost, aliveAllies, deadAllies, bestDiffLabel,
  startBattle, afterBattle, resolveFinalBossKey, tbSummary,
  pickBiomeAuto, mkPopup, updatePopups,
} from '../game-logic';
import type { RunState, StatSnapshot, SaveData, TreeBonus } from '../types';
import { TB_DEFAULTS, DIFFS, EVOS } from '../constants';

/* ===== Helpers ===== */

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
    awoken: [], en: null, _wDmgBase: 0, _fbk: '', _fPhase: 0,
    ...overrides,
  };
}

function makeSave(overrides: Partial<SaveData> = {}): SaveData {
  return { bones: 0, tree: {}, clears: 0, runs: 0, best: {}, ...overrides };
}

/* ===== clamp ===== */

describe('clamp', () => {
  it('値を範囲内にクランプする', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

/* ===== applyStatFx ===== */

describe('applyStatFx', () => {
  const base: StatSnapshot = { atk: 10, mhp: 80, hp: 80, def: 2, cr: 0.05, aM: 1, burn: 0, bb: 0 };

  it('ATK増加を適用する', () => {
    const s = applyStatFx(base, { atk: 5 });
    expect(s.atk).toBe(15);
  });

  it('DEF増加を適用する', () => {
    const s = applyStatFx(base, { def: 3 });
    expect(s.def).toBe(5);
  });

  it('会心率を上限1でクランプする', () => {
    const s = applyStatFx(base, { cr: 2 });
    expect(s.cr).toBe(1);
  });

  it('最大HPと現HPを同時に増加する', () => {
    const s = applyStatFx(base, { mhp: 20 });
    expect(s.mhp).toBe(100);
    expect(s.hp).toBe(100);
  });

  it('回復はmhpを超えない', () => {
    const dmg = { ...base, hp: 50 };
    const s = applyStatFx(dmg, { heal: 100 });
    expect(s.hp).toBe(80);
  });

  it('全回復を適用する', () => {
    const dmg = { ...base, hp: 10 };
    const s = applyStatFx(dmg, { full: 1 });
    expect(s.hp).toBe(80);
  });

  it('自傷ダメージを適用する（HP最低1）', () => {
    const low = { ...base, hp: 5 };
    const s = applyStatFx(low, { sd: 10 });
    expect(s.hp).toBe(1);
  });

  it('火傷フラグを設定する', () => {
    const s = applyStatFx(base, { burn: 1 });
    expect(s.burn).toBe(1);
  });

  it('HP半減を適用する', () => {
    const s = applyStatFx(base, { half: 1 });
    expect(s.mhp).toBe(40);
    expect(s.hp).toBe(40);
  });

  it('ATK倍率を乗算する', () => {
    const s = applyStatFx(base, { aM: 2 });
    expect(s.aM).toBe(2);
  });

  it('骨ボーナスを加算する', () => {
    const s = applyStatFx(base, { bb: 3 });
    expect(s.bb).toBe(3);
  });
});

/* ===== Civilization ===== */

describe('civLvs / civMin / civLv', () => {
  it('文明レベルを正しく取得する', () => {
    const run = makeRun({ cT: 3, cL: 2, cR: 5 });
    expect(civLvs(run)).toEqual({ tech: 3, life: 2, rit: 5 });
    expect(civMin(run)).toBe(2);
    expect(civLv(run, 'tech')).toBe(3);
  });
});

/* ===== effATK ===== */

describe('effATK', () => {
  it('実効ATKを計算する', () => {
    const run = makeRun({ atk: 10, aM: 2, dm: 1.5 });
    expect(effATK(run)).toBe(30); // floor(10 * 2 * 1.5) = 30
  });
});

/* ===== biomeBonus ===== */

describe('biomeBonus', () => {
  it('草原で生活が最高の場合ボーナスが発生する', () => {
    expect(biomeBonus('grassland', { tech: 1, life: 3, rit: 1 })).toBe(1.2);
  });

  it('氷河で技術が最高の場合ボーナスが発生する', () => {
    expect(biomeBonus('glacier', { tech: 3, life: 1, rit: 1 })).toBe(1.3);
  });

  it('fire山で儀式が最高の場合ボーナスが発生する', () => {
    expect(biomeBonus('volcano', { tech: 1, life: 1, rit: 3 })).toBe(1.3);
  });

  it('条件を満たさない場合1を返す', () => {
    expect(biomeBonus('grassland', { tech: 3, life: 1, rit: 1 })).toBe(1);
  });

  it('finalバイオームは常に1', () => {
    expect(biomeBonus('final', { tech: 3, life: 1, rit: 1 })).toBe(1);
  });
});

/* ===== calcEnvDmg ===== */

describe('calcEnvDmg', () => {
  it('草原では環境ダメージなし', () => {
    expect(calcEnvDmg('grassland', 1, TB_DEFAULTS, null)).toBe(0);
  });

  it('氷河で基本ダメージを計算する', () => {
    expect(calcEnvDmg('glacier', 1, TB_DEFAULTS, null)).toBe(3);
  });

  it('耐性で軽減する', () => {
    const tb = { ...TB_DEFAULTS, iR: 0.5 };
    expect(calcEnvDmg('glacier', 1, tb, null)).toBe(1);
  });

  it('tech覚醒で氷河免疫', () => {
    expect(calcEnvDmg('glacier', 1, TB_DEFAULTS, 'tech')).toBe(0);
  });
});

/* ===== getTB ===== */

describe('getTB', () => {
  it('空ツリーでデフォルト値を返す', () => {
    const tb = getTB({});
    expect(tb.bA).toBe(0);
    expect(tb.bH).toBe(0);
  });

  it('購入ノードのボーナスを集計する', () => {
    const tb = getTB({ atk1: 1, hp1: 1 });
    expect(tb.bA).toBe(1);
    expect(tb.bH).toBe(10);
  });

  it('複数ティアを集計する', () => {
    const tb = getTB({ atk1: 1, atk2: 1 });
    expect(tb.bA).toBe(3); // 1 + 2
  });
});

/* ===== scaleEnemy ===== */

describe('scaleEnemy', () => {
  it('敵をスケーリングする', () => {
    const e = scaleEnemy({ n: 'テスト', hp: 100, atk: 10, def: 5, bone: 3 }, 2, 1.5, 1);
    expect(e.n).toBe('テスト');
    expect(e.hp).toBe(200);
    expect(e.mhp).toBe(200);
    expect(e.atk).toBe(15);
    expect(e.def).toBe(5);
    expect(e.bone).toBe(3);
  });
});

/* ===== rollE ===== */

describe('rollE', () => {
  it('指定数の進化を返す', () => {
    const run = makeRun({ evoN: 3 });
    const evos = rollE(run, () => 0.5);
    expect(evos.length).toBe(3);
  });

  it('各文明から少なくとも1つずつ選ぶ', () => {
    const run = makeRun({ evoN: 3 });
    let callCount = 0;
    const evos = rollE(run, () => { callCount++; return 0.01; }); // low rng ensures rare pass
    const types = new Set(evos.map(e => e.t));
    expect(types.size).toBe(3);
  });
});

/* ===== applyEvo ===== */

describe('applyEvo', () => {
  it('進化を適用して文明レベルを増加する', () => {
    const run = makeRun();
    const evo = EVOS[0]; // 火おこし: tech, atk+3
    const { nextRun } = applyEvo(run, evo);
    expect(nextRun.atk).toBe(11); // 8 + 3
    expect(nextRun.cT).toBe(1);
  });

  it('元のステートを変更しない', () => {
    const run = makeRun();
    const evo = EVOS[0];
    applyEvo(run, evo);
    expect(run.atk).toBe(8);
    expect(run.cT).toBe(0);
  });
});

/* ===== tick ===== */

describe('tick', () => {
  it('敵にダメージを与える', () => {
    const run = makeRun({
      en: { n: 'テスト', hp: 100, mhp: 100, atk: 5, def: 0, bone: 1 },
    });
    const { nextRun } = tick(run, false, () => 0.99); // no crit
    expect(nextRun.en!.hp).toBeLessThan(100);
    expect(nextRun.dmgDealt).toBeGreaterThan(0);
  });

  it('敵を倒すとenemy_killedイベントが発生する', () => {
    const run = makeRun({
      en: { n: 'テスト', hp: 1, mhp: 100, atk: 5, def: 0, bone: 1 },
    });
    const { events } = tick(run, false, () => 0.99);
    expect(events.some(e => e.type === 'enemy_killed')).toBe(true);
  });

  it('プレイヤーが死亡するとplayer_deadイベントが発生する', () => {
    const run = makeRun({
      hp: 1, mhp: 80,
      en: { n: 'テスト', hp: 1000, mhp: 1000, atk: 100, def: 0, bone: 1 },
    });
    const { events } = tick(run, false, () => 0.99);
    expect(events.some(e => e.type === 'player_dead')).toBe(true);
  });

  it('復活の儀で復活する', () => {
    const run = makeRun({
      hp: 1, mhp: 100, tb: { ...TB_DEFAULTS, rv: 1 },
      en: { n: 'テスト', hp: 1000, mhp: 1000, atk: 200, def: 0, bone: 1 },
    });
    const { nextRun, events } = tick(run, false, () => 0.99);
    expect(nextRun.rvU).toBe(1);
    expect(nextRun.hp).toBeGreaterThan(0);
    expect(events.some(e => e.type === 'player_dead')).toBe(false);
  });
});

/* ===== startRunState ===== */

describe('startRunState', () => {
  it('正しい初期ステートを生成する', () => {
    const run = startRunState(0, makeSave());
    expect(run.hp).toBe(80);
    expect(run.mhp).toBe(80);
    expect(run.atk).toBe(8);
    expect(run.def).toBe(2);
    expect(run.di).toBe(0);
    expect(run.bms).toHaveLength(3);
  });

  it('ツリーボーナスを反映する', () => {
    const save = makeSave({ tree: { atk1: 1, hp1: 1 } });
    const run = startRunState(0, save);
    expect(run.hp).toBe(90); // 80 + 10
    expect(run.atk).toBe(9); // 8 + 1
  });
});

/* ===== calcBoneReward ===== */

describe('calcBoneReward', () => {
  it('勝利で骨を計算する', () => {
    const run = makeRun({ bE: 10, bb: 0 });
    const reward = calcBoneReward(run, true);
    expect(reward).toBeGreaterThan(0);
  });

  it('儀式覚醒で骨1.5倍', () => {
    const run = makeRun({ bE: 10, bb: 0, fe: 'rit' });
    const rewardRit = calcBoneReward(run, false);
    const runNorm = makeRun({ bE: 10, bb: 0, fe: null });
    const rewardNorm = calcBoneReward(runNorm, false);
    expect(rewardRit).toBeGreaterThan(rewardNorm);
  });
});

/* ===== bestDiffLabel ===== */

describe('bestDiffLabel', () => {
  it('空のbestは空文字を返す', () => {
    expect(bestDiffLabel(makeSave())).toBe('');
  });

  it('クリア済み難易度を表示する', () => {
    const save = makeSave({ best: { 0: 1 } });
    expect(bestDiffLabel(save)).toContain('原始');
  });
});

/* ===== tbSummary ===== */

describe('tbSummary', () => {
  it('ボーナスがない場合は空配列', () => {
    expect(tbSummary(TB_DEFAULTS)).toEqual([]);
  });

  it('ボーナスをフォーマットする', () => {
    const tb = { ...TB_DEFAULTS, bA: 5, bH: 20 };
    const parts = tbSummary(tb);
    expect(parts).toContain('ATK+5');
    expect(parts).toContain('HP+20');
  });
});

/* ===== startBattle biome scaling ===== */

describe('startBattle biome scaling', () => {
  it('1番目のバイオーム(cB=0)は敵が弱めにスケーリングされる', () => {
    const run = makeRun({ cB: 0, cBT: 'grassland', cW: 0, wpb: 4, bc: 0 });
    const result = startBattle(run, false);
    // biomeScale = 0.75 + 0*0.25 = 0.75, scale = 0.75 + 0*0.25 = 0.75
    expect(result.en).not.toBeNull();
    const enB0 = result.en!;

    const run2 = makeRun({ cB: 1, cBT: 'grassland', cW: 0, wpb: 4, bc: 0 });
    const result2 = startBattle(run2, false);
    // biomeScale = 0.75 + 1*0.25 = 1.0, scale = 1.0
    const enB1 = result2.en!;

    expect(enB0.hp).toBeLessThan(enB1.hp);
    expect(enB0.atk).toBeLessThanOrEqual(enB1.atk);
  });

  it('3番目のバイオーム(cB=2)は敵が強めにスケーリングされる', () => {
    const run = makeRun({ cB: 2, cBT: 'grassland', cW: 0, wpb: 4, bc: 0 });
    const result = startBattle(run, false);
    // biomeScale = 0.75 + 2*0.25 = 1.25, scale = 1.25
    const enB2 = result.en!;

    const run1 = makeRun({ cB: 1, cBT: 'grassland', cW: 0, wpb: 4, bc: 0 });
    const result1 = startBattle(run1, false);
    // biomeScale = 1.0, scale = 1.0
    const enB1 = result1.en!;

    expect(enB2.hp).toBeGreaterThan(enB1.hp);
    expect(enB2.atk).toBeGreaterThanOrEqual(enB1.atk);
  });

  it('bcによる進行スケーリングとバイオームスケーリングが組み合わさる', () => {
    const run = makeRun({ cB: 0, cBT: 'grassland', cW: 0, wpb: 4, bc: 2 });
    const result = startBattle(run, false);
    // biomeScale = 0.75, scale = 0.75 + 2*0.25 = 1.25
    const en = result.en!;

    const runNoBC = makeRun({ cB: 0, cBT: 'grassland', cW: 0, wpb: 4, bc: 0 });
    const resultNoBC = startBattle(runNoBC, false);
    // scale = 0.75
    const enNoBC = resultNoBC.en!;

    expect(en.hp).toBeGreaterThan(enNoBC.hp);
  });
});

/* ===== mkPopup ===== */

describe('mkPopup', () => {
  it('通常ダメージは黄色で標準サイズ', () => {
    const p = mkPopup(10, false, false);
    expect(p.v).toBe(10);
    expect(p.cl).toBe('#f0c040');
    expect(p.fs).toBe(11);
    expect(p.a).toBe(1);
  });

  it('会心ダメージは赤色で大サイズ', () => {
    const p = mkPopup(25, true, false);
    expect(p.cl).toBe('#ff4040');
    expect(p.fs).toBe(16);
  });

  it('回復は緑色', () => {
    const p = mkPopup(15, false, true);
    expect(p.cl).toBe('#50e090');
    expect(p.fs).toBe(12);
  });
});

/* ===== updatePopups ===== */

describe('updatePopups', () => {
  it('Y座標を上昇させ寿命をデクリメントする', () => {
    const popups = [mkPopup(10, false, false)];
    const updated = updatePopups(popups);
    expect(updated[0].y).toBeLessThan(popups[0].y);
    expect(updated[0].lt).toBe(popups[0].lt - 1);
  });

  it('寿命が0のポップアップを除去する', () => {
    const p = { ...mkPopup(10, false, false), lt: 1 };
    const updated = updatePopups([p]);
    expect(updated.length).toBe(0);
  });

  it('最大5個に制限する', () => {
    const popups = Array.from({ length: 8 }, () => mkPopup(1, false, false));
    const updated = updatePopups(popups);
    expect(updated.length).toBeLessThanOrEqual(5);
  });

  it('alphaが減衰する', () => {
    const popups = [mkPopup(10, false, false)];
    const updated = updatePopups(popups);
    expect(updated[0].a).toBeLessThan(1);
    expect(updated[0].a).toBeGreaterThan(0);
  });
});
