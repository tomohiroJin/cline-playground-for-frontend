/**
 * 原始進化録 - PRIMAL PATH - ゲームロジックテスト
 */
import {
  clamp, applyStatFx, getSnap, effATK, civLvs, civMin, civLv,
  biomeBonus, calcEnvDmg, getTB, scaleEnemy, simEvo, rollE,
  applyEvo, calcPlayerAtk, tick, startRunState, calcBoneReward,
  allyReviveCost, aliveAllies, deadAllies, bestDiffLabel,
  startBattle, afterBattle, resolveFinalBossKey, tbSummary,
  pickBiomeAuto, mkPopup, updatePopups, handleFinalBossKill,
  applyChallenge, applyEndlessLoop, calcEndlessScale, calcEndlessScaleWithAM,
} from '../game-logic';
import type { RunState, StatSnapshot, SaveData, TreeBonus, Evolution } from '../types';
import { TB_DEFAULTS, DIFFS, EVOS, BOSS_CHAIN_SCALE, BOSS, FINAL_BOSS_ORDER, LOOP_SCALE_FACTOR, CHALLENGES, ENDLESS_AM_REFLECT_RATIO } from '../constants';
import { makeRun, makeSave } from './test-helpers';

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

/* ===== SE イベント発火テスト ===== */

describe('SE イベント発火', () => {
  it('tick で敵から攻撃を受けると plDmg SE が発火する', () => {
    // Arrange: 敵が硬く倒されない状態にして敵の攻撃フェーズに到達させる
    const run = makeRun({
      hp: 80, mhp: 80, atk: 5, def: 0, cr: 0,
      en: { n: 'テスト敵', hp: 500, mhp: 500, atk: 10, def: 0, bone: 1 },
    });

    // Act
    const { events } = tick(run, false, () => 0.5);

    // Assert: plDmg SE が含まれている
    const plDmgEvents = events.filter(e => e.type === 'sfx' && e.sfx === 'plDmg');
    expect(plDmgEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('環境ダメージのあるバイオームで envDmg SE が発火する', () => {
    // Arrange: 氷河バイオーム（環境ダメージあり）
    const run = makeRun({
      hp: 80, mhp: 80, atk: 100, def: 0, cr: 0,
      cBT: 'glacier',
      en: { n: 'テスト敵', hp: 200, mhp: 200, atk: 5, def: 0, bone: 1 },
    });

    // Act
    const { events } = tick(run, false, () => 0.5);

    // Assert: envDmg SE が含まれている
    const envDmgEvents = events.filter(e => e.type === 'sfx' && e.sfx === 'envDmg');
    expect(envDmgEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('草原バイオームでも環境ダメージはないため envDmg SE は発火しない', () => {
    // Arrange: 草原バイオーム（環境ダメージなし）
    const run = makeRun({
      hp: 80, mhp: 80, atk: 100, def: 0, cr: 0,
      cBT: 'grassland',
      en: { n: 'テスト敵', hp: 200, mhp: 200, atk: 5, def: 0, bone: 1 },
    });

    // Act
    const { events } = tick(run, false, () => 0.5);

    // Assert: envDmg SE が含まれていない
    const envDmgEvents = events.filter(e => e.type === 'sfx' && e.sfx === 'envDmg');
    expect(envDmgEvents).toHaveLength(0);
  });
});

/* ===== afterBattle（ボス撃破で即バイオームクリア）===== */

describe('afterBattle（通常ボス連戦撤去後）', () => {
  it('ボス撃破で即biomeCleared=trueを返す', () => {
    // Arrange: ボス戦（cW > wpb）
    const run = makeRun({
      di: 0, dd: DIFFS[0],
      cW: 5, wpb: 4, bc: 0,
      hp: 80, mhp: 80,
      en: { n: 'サーベルタイガー', hp: 0, mhp: 120, atk: 14, def: 3, bone: 5 },
    });

    // Act
    const result = afterBattle(run);

    // Assert
    expect(result.biomeCleared).toBe(true);
    expect(result.nextRun.bc).toBe(1);
  });

  it('通常敵撃破時はbiomeCleared=false', () => {
    // Arrange: 通常敵（cW <= wpb）
    const run = makeRun({
      di: 1, dd: DIFFS[1],
      cW: 3, wpb: 4, bc: 0,
      en: { n: '雪狼', hp: 0, mhp: 38, atk: 8, def: 2, bone: 2 },
    });

    // Act
    const result = afterBattle(run);

    // Assert
    expect(result.biomeCleared).toBe(false);
  });

  it('高難易度でもボス撃破で即バイオームクリア（bossChainContinueなし）', () => {
    // Arrange: 神話世界（bb=5）でもバイオームボスは1体
    const run = makeRun({
      di: 3, dd: DIFFS[3],
      cW: 5, wpb: 4, bc: 0,
      hp: 80, mhp: 80,
      en: { n: 'サーベルタイガー', hp: 0, mhp: 120, atk: 14, def: 3, bone: 5 },
    });

    // Act
    const result = afterBattle(run);

    // Assert: 即クリア、bossChainContinue プロパティは存在しない
    expect(result.biomeCleared).toBe(true);
    expect('bossChainContinue' in result).toBe(false);
  });
});

/* ===== 最終ボス連戦テスト（handleFinalBossKill）===== */

describe('handleFinalBossKill（最終ボス連戦）', () => {
  describe('DIFFS のbb設定', () => {
    it('原始はbb=1', () => { expect(DIFFS[0].bb).toBe(1); });
    it('氷河期はbb=2', () => { expect(DIFFS[1].bb).toBe(2); });
    it('大災厄はbb=3', () => { expect(DIFFS[2].bb).toBe(3); });
    it('神話世界はbb=5', () => { expect(DIFFS[3].bb).toBe(5); });
  });

  describe('BOSS_CHAIN_SCALE 定数', () => {
    it('5段階のスケール倍率が定義されている', () => {
      expect(BOSS_CHAIN_SCALE).toEqual([1.0, 1.15, 1.3, 1.45, 1.6]);
    });
  });

  describe('新ボス(fa, fx)の存在確認', () => {
    it('天空の裁定者(fa)がBOSS定数に存在する', () => {
      expect(BOSS['fa']).toBeDefined();
      expect(BOSS['fa'].n).toBe('天空の裁定者');
      expect(BOSS['fa'].hp).toBe(350);
    });

    it('混沌の始祖龍(fx)がBOSS定数に存在する', () => {
      expect(BOSS['fx']).toBeDefined();
      expect(BOSS['fx'].n).toBe('混沌の始祖龍');
      expect(BOSS['fx'].hp).toBe(450);
    });
  });

  describe('FINAL_BOSS_ORDER の整合性', () => {
    it('ft/fl/fr それぞれの出現順テーブルが5体分定義されている', () => {
      expect(FINAL_BOSS_ORDER['ft']).toHaveLength(5);
      expect(FINAL_BOSS_ORDER['fl']).toHaveLength(5);
      expect(FINAL_BOSS_ORDER['fr']).toHaveLength(5);
    });

    it('各テーブルの先頭は初回ボスキーと一致する', () => {
      expect(FINAL_BOSS_ORDER['ft'][0]).toBe('ft');
      expect(FINAL_BOSS_ORDER['fl'][0]).toBe('fl');
      expect(FINAL_BOSS_ORDER['fr'][0]).toBe('fr');
    });

    it('各テーブルは全て異なるボスキーで構成されている', () => {
      for (const key of ['ft', 'fl', 'fr']) {
        const order = FINAL_BOSS_ORDER[key];
        expect(new Set(order).size).toBe(order.length);
      }
    });
  });

  describe('bb=1（原始）で即勝利', () => {
    it('_fPhase=1でbb=1の場合、gameWon=trueを返す', () => {
      // Arrange
      const run = makeRun({
        di: 0, dd: DIFFS[0], _fPhase: 1, _fbk: 'ft',
        cBT: 'final', cW: 5, wpb: 4,
        en: { n: '氷の神獣', hp: 0, mhp: 320, atk: 30, def: 7, bone: 10 },
      });

      // Act
      const result = handleFinalBossKill(run);

      // Assert
      expect(result.gameWon).toBe(true);
    });
  });

  describe('bb=2（氷河期）で2連戦', () => {
    it('1体目撃破で連戦継続（gameWon=false）', () => {
      // Arrange
      const run = makeRun({
        di: 1, dd: DIFFS[1], _fPhase: 1, _fbk: 'ft',
        hp: 60, mhp: 100, cBT: 'final', cW: 5, wpb: 4,
        en: { n: '氷の神獣', hp: 0, mhp: 320, atk: 30, def: 7, bone: 10 },
      });

      // Act
      const result = handleFinalBossKill(run);

      // Assert
      expect(result.gameWon).toBe(false);
      expect(result.nextRun._fPhase).toBe(2);
      expect(result.nextRun.en).not.toBeNull();
    });

    it('連戦で異なるボスが出現する', () => {
      // Arrange
      const run = makeRun({
        di: 1, dd: DIFFS[1], _fPhase: 1, _fbk: 'ft',
        hp: 60, mhp: 100, cBT: 'final', cW: 5, wpb: 4,
        en: { n: '氷の神獣', hp: 0, mhp: 320, atk: 30, def: 7, bone: 10 },
      });

      // Act
      const result = handleFinalBossKill(run);

      // Assert: ft の次は fl（FINAL_BOSS_ORDER['ft'][1]）
      expect(result.nextRun.en!.n).toBe(BOSS[FINAL_BOSS_ORDER['ft'][1]].n);
    });

    it('連戦継続時にHP20%回復する', () => {
      // Arrange
      const run = makeRun({
        di: 1, dd: DIFFS[1], _fPhase: 1, _fbk: 'ft',
        hp: 60, mhp: 100, cBT: 'final', cW: 5, wpb: 4,
        en: { n: '氷の神獣', hp: 0, mhp: 320, atk: 30, def: 7, bone: 10 },
      });

      // Act
      const result = handleFinalBossKill(run);

      // Assert: 60 + 20（100の20%）= 80
      expect(result.nextRun.hp).toBe(80);
    });

    it('HP回復が最大HPを超えない', () => {
      // Arrange
      const run = makeRun({
        di: 1, dd: DIFFS[1], _fPhase: 1, _fbk: 'ft',
        hp: 95, mhp: 100, cBT: 'final', cW: 5, wpb: 4,
        en: { n: '氷の神獣', hp: 0, mhp: 320, atk: 30, def: 7, bone: 10 },
      });

      // Act
      const result = handleFinalBossKill(run);

      // Assert: 95 + 20 = 115 → clamp → 100
      expect(result.nextRun.hp).toBe(100);
    });

    it('2体目撃破で勝利', () => {
      // Arrange
      const run = makeRun({
        di: 1, dd: DIFFS[1], _fPhase: 2, _fbk: 'ft',
        hp: 40, mhp: 100, cBT: 'final', cW: 5, wpb: 4,
        en: { n: '大地の守護者', hp: 0, mhp: 400, atk: 24, def: 10, bone: 10 },
      });

      // Act
      const result = handleFinalBossKill(run);

      // Assert
      expect(result.gameWon).toBe(true);
    });
  });

  describe('bb=5（神話世界）で5連戦', () => {
    it('5連戦で全て異なるボスが出現し、5体目撃破で勝利', () => {
      // Arrange
      const dd = DIFFS[3];
      let run = makeRun({
        di: 3, dd, _fPhase: 1, _fbk: 'ft',
        hp: 200, mhp: 200, cBT: 'final', cW: 5, wpb: 4,
        en: { n: '氷の神獣', hp: 0, mhp: 320, atk: 30, def: 7, bone: 10 },
      });

      const bossNames: string[] = [run.en!.n];

      // 1体目→2体目
      const r1 = handleFinalBossKill(run);
      expect(r1.gameWon).toBe(false);
      expect(r1.nextRun._fPhase).toBe(2);
      bossNames.push(r1.nextRun.en!.n);

      // 2体目→3体目
      run = { ...r1.nextRun, en: { ...r1.nextRun.en!, hp: 0 } };
      const r2 = handleFinalBossKill(run);
      expect(r2.gameWon).toBe(false);
      expect(r2.nextRun._fPhase).toBe(3);
      bossNames.push(r2.nextRun.en!.n);

      // 3体目→4体目
      run = { ...r2.nextRun, en: { ...r2.nextRun.en!, hp: 0 } };
      const r3 = handleFinalBossKill(run);
      expect(r3.gameWon).toBe(false);
      expect(r3.nextRun._fPhase).toBe(4);
      bossNames.push(r3.nextRun.en!.n);

      // 4体目→5体目
      run = { ...r3.nextRun, en: { ...r3.nextRun.en!, hp: 0 } };
      const r4 = handleFinalBossKill(run);
      expect(r4.gameWon).toBe(false);
      expect(r4.nextRun._fPhase).toBe(5);
      bossNames.push(r4.nextRun.en!.n);

      // 5体目撃破→勝利
      run = { ...r4.nextRun, en: { ...r4.nextRun.en!, hp: 0 } };
      const r5 = handleFinalBossKill(run);
      expect(r5.gameWon).toBe(true);

      // 全て異なるボス名であることを確認（最初の1体 + 連戦4体 = 5体）
      expect(new Set(bossNames).size).toBe(5);
    });

    it('BOSS_CHAIN_SCALE がフェーズに応じて適用される', () => {
      // Arrange: Phase 1→2 遷移時
      const dd = DIFFS[3];
      const run = makeRun({
        di: 3, dd, _fPhase: 1, _fbk: 'ft',
        hp: 200, mhp: 200, cBT: 'final', cW: 5, wpb: 4,
        en: { n: '氷の神獣', hp: 0, mhp: 320, atk: 30, def: 7, bone: 10 },
      });

      // Act
      const result = handleFinalBossKill(run);
      const nextBossKey = FINAL_BOSS_ORDER['ft'][1]; // 'fl'
      const expectedHp = Math.floor(BOSS[nextBossKey].hp * dd.hm * BOSS_CHAIN_SCALE[1]);

      // Assert: スケーリングが正しい
      expect(result.nextRun.en!.hp).toBe(expectedHp);
    });
  });
});

/* ===== FB#11: 周回システム ===== */

describe('FB#11: 周回システム', () => {
  describe('startRunState の周回倍率', () => {
    it('1周目（loopCount=0）は倍率なし', () => {
      const save = makeSave({ loopCount: 0 });
      const run = startRunState(0, save);
      // loopScale = 1 + 0 * 0.5 = 1.0 → dd.hm * 1.0 = 1.0
      expect(run.loopCount).toBe(0);
      // DIFFS[0].hm = 1, am = 1 → スケーリング無し
    });

    it('2周目（loopCount=1）は敵HP/ATK倍率×1.5', () => {
      const save = makeSave({ loopCount: 1 });
      const run = startRunState(0, save);
      expect(run.loopCount).toBe(1);
      // dd.hm, dd.am に loopScale=1.5 が乗算されている
      const expectedHm = DIFFS[0].hm * (1 + 1 * LOOP_SCALE_FACTOR);
      const expectedAm = DIFFS[0].am * (1 + 1 * LOOP_SCALE_FACTOR);
      expect(run.dd.hm).toBeCloseTo(expectedHm);
      expect(run.dd.am).toBeCloseTo(expectedAm);
    });

    it('3周目（loopCount=2）は敵HP/ATK倍率×2.0', () => {
      const save = makeSave({ loopCount: 2 });
      const run = startRunState(0, save);
      expect(run.loopCount).toBe(2);
      const expectedHm = DIFFS[0].hm * (1 + 2 * LOOP_SCALE_FACTOR);
      expect(run.dd.hm).toBeCloseTo(expectedHm);
    });

    it('高難易度でも周回倍率が適用される', () => {
      const save = makeSave({ loopCount: 1 });
      const run = startRunState(3, save);
      const loopScale = 1 + 1 * LOOP_SCALE_FACTOR;
      expect(run.dd.hm).toBeCloseTo(DIFFS[3].hm * loopScale);
      expect(run.dd.am).toBeCloseTo(DIFFS[3].am * loopScale);
    });
  });
});

/* ===== FB#4: エンドレスチャレンジ ===== */

describe('FB#4: エンドレスチャレンジ', () => {
  it('CHALLENGES に「無限の試練」が存在する', () => {
    const endless = CHALLENGES.find(c => c.id === 'endless');
    expect(endless).toBeDefined();
    expect(endless!.name).toBe('無限の試練');
    expect(endless!.modifiers).toEqual([{ type: 'endless' }]);
  });

  it('applyChallenge で endless 修飾子が適用される', () => {
    const run = makeRun();
    const ch = CHALLENGES.find(c => c.id === 'endless')!;
    const next = applyChallenge(run, ch);
    expect(next.isEndless).toBe(true);
    expect(next.endlessWave).toBe(0);
    expect(next.challengeId).toBe('endless');
  });

  it('startRunState に isEndless/endlessWave の初期値がある', () => {
    const save = makeSave();
    const run = startRunState(0, save);
    expect(run.isEndless).toBe(false);
    expect(run.endlessWave).toBe(0);
  });

  it('applyEndlessLoop で bc/cW がリセットされ endlessWave がインクリメントされる', () => {
    const run = makeRun({
      bc: 3, cW: 5, isEndless: true, endlessWave: 0,
      bms: ['grassland', 'glacier', 'volcano'],
    });
    const next = applyEndlessLoop(run);
    expect(next.endlessWave).toBe(1);
    expect(next.bc).toBe(0);
    expect(next.cW).toBe(0);
    expect(next.cB).toBe(0);
    // バイオームがリシャッフルされている
    expect(next.bms).toHaveLength(3);
    expect(next.cBT).toBe(next.bms[0]);
  });

  it('applyEndlessLoop が元の RunState を変更しない', () => {
    const run = makeRun({
      bc: 3, cW: 5, isEndless: true, endlessWave: 2,
    });
    const originalBc = run.bc;
    applyEndlessLoop(run);
    expect(run.bc).toBe(originalBc);
    expect(run.endlessWave).toBe(2);
  });

  it('startBattle でエンドレススケールが適用される', () => {
    const run = makeRun({
      isEndless: true, endlessWave: 5,
      cBT: 'grassland', cW: 0, cB: 1,
    });
    const battle = startBattle(run, false);
    // endlessScale = 1 + 5 * 0.1 = 1.5 → 敵のHPがスケーリングされている
    expect(battle.en).not.toBeNull();
    // 直接の値は検証が難しいので、エンドレスでない場合と比較
    const normalRun = makeRun({
      isEndless: false, endlessWave: 0,
      cBT: 'grassland', cW: 0, cB: 1,
    });
    const normalBattle = startBattle(normalRun, false);
    expect(battle.en!.hp).toBeGreaterThan(normalBattle.en!.hp);
  });
});

/* ===== calcEndlessScale ===== */

describe('calcEndlessScale', () => {
  it('wave 0 → 1 を返す', () => {
    expect(calcEndlessScale(0)).toBe(1);
  });

  it('負の wave → 1 を返す', () => {
    expect(calcEndlessScale(-1)).toBe(1);
    expect(calcEndlessScale(-5)).toBe(1);
  });

  it('wave が進むと指数的に増加する', () => {
    const s3 = calcEndlessScale(3);
    const s5 = calcEndlessScale(5);
    const s10 = calcEndlessScale(10);

    // 各値が 1 より大きい
    expect(s3).toBeGreaterThan(1);
    expect(s5).toBeGreaterThan(s3);
    expect(s10).toBeGreaterThan(s5);

    // 指数的成長: wave 10 は wave 5 の2倍以上
    expect(s10 / s5).toBeGreaterThan(2);
  });

  it('wave 0 での値は旧スケールと同じ（1.0）', () => {
    expect(calcEndlessScale(0)).toBe(1);
  });
});

/* ===== calcEndlessScaleWithAM ===== */

describe('calcEndlessScaleWithAM', () => {
  it('wave 0 では aM に関わらず 1 を返す', () => {
    expect(calcEndlessScaleWithAM(0, 1)).toBe(1);
    expect(calcEndlessScaleWithAM(0, 2)).toBe(1);
    expect(calcEndlessScaleWithAM(0, 4)).toBe(1);
  });

  it('aM=1 の場合は calcEndlessScale と同じ値を返す', () => {
    for (const w of [1, 3, 5, 10]) {
      expect(calcEndlessScaleWithAM(w, 1)).toBeCloseTo(calcEndlessScale(w));
    }
  });

  it('aM=2 の場合、敵スケーリングが ×1.5 される', () => {
    const wave = 3;
    const base = calcEndlessScale(wave);
    const withAM2 = calcEndlessScaleWithAM(wave, 2);
    // amExcess=1, amReflect=1+1*0.5=1.5
    expect(withAM2).toBeCloseTo(base * 1.5);
  });

  it('aM=4 の場合、敵スケーリングが ×2.5 される', () => {
    const wave = 5;
    const base = calcEndlessScale(wave);
    const withAM4 = calcEndlessScaleWithAM(wave, 4);
    // amExcess=3, amReflect=1+3*0.5=2.5
    expect(withAM4).toBeCloseTo(base * 2.5);
  });

  it('負の wave では aM に関わらず 1 を返す', () => {
    expect(calcEndlessScaleWithAM(-1, 2)).toBe(1);
  });

  it('ENDLESS_AM_REFLECT_RATIO で反映率が制御される', () => {
    const wave = 5;
    const base = calcEndlessScale(wave);
    const playerAM = 3;
    const expected = base * (1 + (playerAM - 1) * ENDLESS_AM_REFLECT_RATIO);
    expect(calcEndlessScaleWithAM(wave, playerAM)).toBeCloseTo(expected);
  });
});

/* ===== aM 反映統合テスト ===== */

describe('エンドレスモード aM 反映統合テスト', () => {
  it('aM=2 のエンドレスモードでは aM=1 より敵が強い', () => {
    // Arrange: aM=1 のエンドレスラン
    const runAM1 = makeRun({
      isEndless: true, endlessWave: 3, aM: 1,
      cBT: 'grassland', cW: 0, cB: 1,
    });
    // Arrange: aM=2 のエンドレスラン（血の契約使用）
    const runAM2 = makeRun({
      isEndless: true, endlessWave: 3, aM: 2,
      cBT: 'grassland', cW: 0, cB: 1,
    });

    // Act
    const battleAM1 = startBattle(runAM1, false);
    const battleAM2 = startBattle(runAM2, false);

    // Assert: aM=2 の方が敵HP/ATKが高い
    expect(battleAM2.en!.hp).toBeGreaterThan(battleAM1.en!.hp);
    expect(battleAM2.en!.atk).toBeGreaterThan(battleAM1.en!.atk);
  });

  it('非エンドレスモードでは aM が敵スケーリングに影響しない', () => {
    // Arrange: 非エンドレスモードの aM=1 と aM=2
    const runAM1 = makeRun({
      isEndless: false, aM: 1,
      cBT: 'grassland', cW: 0, cB: 1,
    });
    const runAM2 = makeRun({
      isEndless: false, aM: 2,
      cBT: 'grassland', cW: 0, cB: 1,
    });

    // Act
    const battleAM1 = startBattle(runAM1, false);
    const battleAM2 = startBattle(runAM2, false);

    // Assert: 非エンドレスでは敵ステータスが同じ
    expect(battleAM2.en!.hp).toBe(battleAM1.en!.hp);
    expect(battleAM2.en!.atk).toBe(battleAM1.en!.atk);
  });
});
