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
import type { RunState, StatSnapshot, SaveData, TreeBonus, Evolution } from '../types';
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
    awoken: [], en: null, sk: { avl: [], cds: {}, bfs: [] },
    evs: [],
    _wDmgBase: 0, _fbk: '', _fPhase: 0,
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
  it('通常ダメージは白色で標準サイズ', () => {
    const p = mkPopup(10, false, false);
    expect(p.v).toBe(10);
    expect(p.cl).toBe('#ffffff');
    expect(p.fs).toBe(15);
    expect(p.a).toBe(1);
  });

  it('会心ダメージは赤色で大サイズ', () => {
    const p = mkPopup(25, true, false);
    expect(p.cl).toBe('#ff3030');
    expect(p.fs).toBe(24);
  });

  it('回復は緑色', () => {
    const p = mkPopup(15, false, true);
    expect(p.cl).toBe('#50ff90');
    expect(p.fs).toBe(16);
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

/* ===== FB-4: 血の契約（HP半減）結合テスト ===== */

describe('血の契約: applyEvo 結合テスト', () => {
  /** 血の契約の進化定義を取得 */
  const bloodPact = EVOS.find(e => e.n === '血の契約') as Evolution;

  it('血の契約がEVOS定数に正しく定義されている', () => {
    // Arrange & Assert
    expect(bloodPact).toBeDefined();
    expect(bloodPact.e.half).toBe(1);
    expect(bloodPact.e.aM).toBe(2);
    expect(bloodPact.t).toBe('rit');
    expect(bloodPact.r).toBe(1);
  });

  it('applyEvo で血の契約を適用するとHP半減・ATK倍率2倍になる', () => {
    // Arrange
    const run = makeRun({ hp: 80, mhp: 80, atk: 10, aM: 1 });

    // Act
    const { nextRun } = applyEvo(run, bloodPact);

    // Assert: HP半減
    expect(nextRun.mhp).toBe(40);
    expect(nextRun.hp).toBe(40);
    // Assert: ATK倍率2倍
    expect(nextRun.aM).toBe(2);
    // Assert: 文明レベル（rit）が増加
    expect(nextRun.cR).toBe(1);
  });

  it('血の契約を適用しても元のステートは変更されない', () => {
    // Arrange
    const run = makeRun({ hp: 80, mhp: 80, atk: 10, aM: 1 });

    // Act
    applyEvo(run, bloodPact);

    // Assert: イミュータブル
    expect(run.hp).toBe(80);
    expect(run.mhp).toBe(80);
    expect(run.aM).toBe(1);
  });

  it('ダメージを受けた状態で血の契約を適用するとhp <= mhp/2 になる', () => {
    // Arrange: HP30/80 の状態
    const run = makeRun({ hp: 30, mhp: 80, aM: 1 });

    // Act
    const { nextRun } = applyEvo(run, bloodPact);

    // Assert: mhp=40, hp=min(30,40)=30
    expect(nextRun.mhp).toBe(40);
    expect(nextRun.hp).toBe(30);
  });

  it('aM が既に2の状態で血の契約を適用すると aM=4 になる', () => {
    // Arrange: aM=2 の状態（既にバフあり）
    const run = makeRun({ aM: 2, hp: 80, mhp: 80 });

    // Act
    const { nextRun } = applyEvo(run, bloodPact);

    // Assert: 2 * 2 = 4
    expect(nextRun.aM).toBe(4);
  });

  it('simEvo で血の契約のプレビューが正しい', () => {
    // Arrange
    const run = makeRun({ hp: 80, mhp: 80, atk: 10, aM: 1, dm: 1 });

    // Act
    const preview = simEvo(run, bloodPact);

    // Assert: mhp半減、ATK倍率反映
    expect(preview.mhp).toBe(40);
    expect(preview.hp).toBe(40);
    // effATK = floor(10 * 2 * 1) = 20
    expect(preview.atk).toBe(20);
  });

  it('simEvo でダメージ状態から血の契約プレビューが正しい', () => {
    // Arrange: HP が既に低い状態
    const run = makeRun({ hp: 30, mhp: 80, atk: 10, aM: 1, dm: 1 });

    // Act
    const preview = simEvo(run, bloodPact);

    // Assert: hp = min(30, 40) = 30
    expect(preview.mhp).toBe(40);
    expect(preview.hp).toBe(30);
    expect(preview.atk).toBe(20);
  });

  it('applyStatFx で half と aM を同時適用する順序が正しい', () => {
    // Arrange: half が先に処理され、aM が後に処理されることを確認
    const base: StatSnapshot = { atk: 10, mhp: 100, hp: 100, def: 2, cr: 0.05, aM: 1, burn: 0, bb: 0 };

    // Act
    const result = applyStatFx(base, { half: 1, aM: 2 });

    // Assert: mhp=50, hp=50, aM=2
    expect(result.mhp).toBe(50);
    expect(result.hp).toBe(50);
    expect(result.aM).toBe(2);
  });
});

/* ===== FB-R2-1: 血の契約 → startBattle 結合テスト ===== */

describe('血の契約: applyEvo → startBattle 結合テスト', () => {
  const bloodPact = EVOS.find(e => e.n === '血の契約') as Evolution;

  it('applyEvo → startBattle でHP半減が維持される', () => {
    // Arrange
    const run = makeRun({ hp: 80, mhp: 80, atk: 10, aM: 1 });

    // Act: 進化適用 → 戦闘開始
    const { nextRun } = applyEvo(run, bloodPact);
    const battleRun = startBattle(nextRun, false);

    // Assert: startBattle 後もHP半減が維持される
    expect(battleRun.mhp).toBe(40);
    expect(battleRun.hp).toBe(40);
    expect(battleRun.aM).toBe(2);
    // 敵が生成されている
    expect(battleRun.en).not.toBeNull();
  });

  it('ダメージ状態から applyEvo → startBattle でHP半減が維持される', () => {
    // Arrange: HP30/80
    const run = makeRun({ hp: 30, mhp: 80, atk: 10, aM: 1 });

    // Act
    const { nextRun } = applyEvo(run, bloodPact);
    const battleRun = startBattle(nextRun, false);

    // Assert: mhp=40, hp=min(30,40)=30
    expect(battleRun.mhp).toBe(40);
    expect(battleRun.hp).toBe(30);
  });

  it('連続2回の進化適用 → startBattle でステートが正しい', () => {
    // Arrange: 最初に通常進化を適用してから血の契約を適用
    const normalEvo: Evolution = { n: 'テスト', d: 'ATK+5', t: 'tech', r: 0, e: { atk: 5 } };
    const run = makeRun({ hp: 80, mhp: 80, atk: 8, aM: 1 });

    // Act: 通常進化 → 血の契約 → 戦闘開始
    const { nextRun: r1 } = applyEvo(run, normalEvo);
    const { nextRun: r2 } = applyEvo(r1, bloodPact);
    const battleRun = startBattle(r2, false);

    // Assert
    expect(battleRun.mhp).toBe(40);   // 80 → 半減 → 40
    expect(battleRun.hp).toBe(40);
    expect(battleRun.atk).toBe(13);    // 8 + 5 = 13
    expect(battleRun.aM).toBe(2);
  });

  it('afterBattle → 次の進化で血の契約を適用してもHP半減が正しい', () => {
    // Arrange: 戦闘後の状態を模擬（ダメージを受けた状態）
    const run = makeRun({
      hp: 60, mhp: 80, atk: 10, aM: 1,
      cW: 2, en: { n: 'test', hp: 0, mhp: 20, atk: 5, def: 0, bone: 1 },
    });

    // Act: 戦闘終了 → 血の契約選択 → 次の戦闘開始
    const { nextRun: afterRun } = afterBattle(run);
    const { nextRun: evoRun } = applyEvo(afterRun, bloodPact);
    const battleRun = startBattle(evoRun, false);

    // Assert
    expect(battleRun.mhp).toBe(40);
    expect(battleRun.hp).toBe(40);   // min(60, 40) = 40
    expect(battleRun.aM).toBe(2);
  });
});
