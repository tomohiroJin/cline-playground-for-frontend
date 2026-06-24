/**
 * シグネチャーコンボ統合テスト（Phase 3）
 *
 * 各コンボの「狙った乗算効果が発火する」ことを検証する。
 * 必勝は断定しない（設計指針＝成立はするが必勝ではない）。
 */
import { tick, applyKeystone, applyTotem, applyEmberBiomeScale, keystonePlayerAtkMods, onKeystoneKill } from '../game-logic';
import { makeRun } from './test-helpers';

describe('コンボ1: 低空飛行（不滅の祈り＋狂血の覚醒＋血の祖）', () => {
  it('低HP維持で ATK×2、致死を祈りで耐える', () => {
    let r = makeRun({ atk: 100, mhp: 100, hp: 100 });
    r = applyTotem(r, 'blood');           // mhp×0.8=80, atk×1.2=120, cr+0.05
    r = applyKeystone(r, 'madblood');     // HP30%以下で ATK×1.6
    r = applyKeystone(r, 'undying_prayer');
    r.hp = Math.floor(r.mhp * 0.2);       // 低空飛行（30%以下）
    const mods = keystonePlayerAtkMods(r);
    expect(mods.mult).toBeCloseTo(1.6, 5); // 狂血の ATK×1.6 が発火
  });

  it('不滅の祈りで致死ダメージを HP1 で耐える', () => {
    let r = makeRun({ atk: 10, def: 0, hp: 5, mhp: 100, keystones: [] });
    r = applyKeystone(r, 'undying_prayer');
    r.ksGuardUsed = false;
    r.en = { n: '猛獣', hp: 100000, mhp: 100000, atk: 9999, def: 0, bone: 0 };
    const res = tick(r, false, () => 0.99);
    expect(res.nextRun.hp).toBe(1);       // 致死をHP1で耐える
  });
});

describe('コンボ2: 反射タンク（棘の守護＋岩の祖）', () => {
  it('岩の祖の環境抵抗が tb.iR/fR に加算される', () => {
    const r = applyTotem(makeRun({ def: 2 }), 'rock');
    expect(r.def).toBe(6);
    expect(r.tb.iR).toBeGreaterThanOrEqual(0.3);
  });

  it('反射で敵が同tick内で撃破される（Task4 の結合確認）', () => {
    const r = makeRun({
      keystones: ['thorn_guard'], atk: 8, def: 0, hp: 1000, mhp: 1000, cr: 0,
      en: { n: '岩亀', hp: 2, mhp: 100, atk: 100, def: 1000, bone: 3 },
    });
    const res = tick(r, false, () => 0.99);
    expect(res.nextRun.kills).toBe(1);
  });
});

describe('コンボ3: 火傷伝播（連鎖の業火＋火傷）', () => {
  it('火傷状態でのキルで火傷倍率スタックが恒久加算される', () => {
    const r = makeRun({ keystones: ['chain_blaze'], burn: 1, ksStacks: {} });
    onKeystoneKill(r);
    expect(r.ksStacks?.chain_blaze).toBeCloseTo(0.2, 5);
    onKeystoneKill(r);
    expect(r.ksStacks?.chain_blaze).toBeCloseTo(0.4, 5);
  });
});

describe('コンボ4: 群狼（群狼の戦術＋群れの祖）', () => {
  it('生存仲間数に比例してプレイヤーATKが乗算される', () => {
    let r = makeRun({ atk: 100 });
    r = applyTotem(r, 'pack');            // 開始仲間1体＋仲間枠
    r = applyKeystone(r, 'wolf_pack');
    const alive = r.al.filter(a => a.a).length;
    const mods = keystonePlayerAtkMods(r);
    expect(mods.mult).toBeCloseTo(1 + 0.1 * alive, 5);
    expect(alive).toBeGreaterThan(0);
  });
});

describe('コンボ5: 諸刃の逆転（諸刃の進化＋高DEF）', () => {
  it('高DEFが ATK へ ×3 変換される', () => {
    const r = applyKeystone(makeRun({ atk: 10, def: 30 }), 'double_edge');
    expect(r.def).toBe(0);
    expect(r.atk).toBe(10 + 30 * 3); // 100
  });
});

describe('コンボ6: 極・晩成（種火の祖＋狩人の蓄積）', () => {
  it('踏破スケールとキルスタックが累積する', () => {
    let r = makeRun({ atk: 100, def: 10, mhp: 200, hp: 200 });
    r = applyTotem(r, 'ember');           // atk×0.7=70, emberBase snapshot
    r = applyKeystone(r, 'hunter_stack');
    r.bc = 1;
    r = applyEmberBiomeScale(r);          // +floor(70×0.45)=31 → atk 101
    expect(r.atk).toBe(101);
    onKeystoneKill(r);                    // 狩人 +3
    expect(r.ksStacks?.hunter_stack).toBe(3);
    const mods = keystonePlayerAtkMods(r);
    expect(mods.flatAdd).toBe(3);         // 狩人スタックが攻撃に反映
  });
});
