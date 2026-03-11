/**
 * イベント効果ハンドラーのテスト
 */
import { statChangeHandler } from '../../../../domain/event/handlers/stat-change-handler';
import { healHandler } from '../../../../domain/event/handlers/heal-handler';
import { damageHandler } from '../../../../domain/event/handlers/damage-handler';
import { boneChangeHandler } from '../../../../domain/event/handlers/bone-change-handler';
import { addAllyHandler } from '../../../../domain/event/handlers/add-ally-handler';
import { randomEvolutionHandler } from '../../../../domain/event/handlers/random-evolution-handler';
import { civLevelUpHandler } from '../../../../domain/event/handlers/civ-level-up-handler';
import { nothingHandler } from '../../../../domain/event/handlers/nothing-handler';
import { makeRun } from '../../../test-helpers';

describe('statChangeHandler', () => {
  it('ATKを増加させる', () => {
    const run = makeRun({ atk: 10 });
    const result = statChangeHandler.apply(run, { type: 'stat_change', stat: 'atk', value: 5 }, Math.random);
    expect(result.atk).toBe(15);
  });

  it('最大HPを増加させる', () => {
    const run = makeRun({ mhp: 100 });
    const result = statChangeHandler.apply(run, { type: 'stat_change', stat: 'hp', value: 20 }, Math.random);
    expect(result.mhp).toBe(120);
  });

  it('DEFを増加させる', () => {
    const run = makeRun({ def: 5 });
    const result = statChangeHandler.apply(run, { type: 'stat_change', stat: 'def', value: 3 }, Math.random);
    expect(result.def).toBe(8);
  });

  it('ヒントカラーが黄色を返す', () => {
    expect(statChangeHandler.getHintColor()).toBe('#f0c040');
  });

  it('ヒントアイコンが📈を返す', () => {
    expect(statChangeHandler.getHintIcon()).toBe('📈');
  });

  it('結果メッセージを正しくフォーマットする', () => {
    const result = statChangeHandler.formatResult({ type: 'stat_change', stat: 'atk', value: 5 });
    expect(result.icon).toBe('💪');
    expect(result.text).toContain('ATK');
    expect(result.text).toContain('+5');
  });
});

describe('healHandler', () => {
  it('HPを回復する', () => {
    const run = makeRun({ hp: 50, mhp: 100 });
    const result = healHandler.apply(run, { type: 'heal', amount: 30 }, Math.random);
    expect(result.hp).toBe(80);
  });

  it('HPが最大HPを超えない', () => {
    const run = makeRun({ hp: 90, mhp: 100 });
    const result = healHandler.apply(run, { type: 'heal', amount: 30 }, Math.random);
    expect(result.hp).toBe(100);
  });

  it('ヒントカラーが緑色を返す', () => {
    expect(healHandler.getHintColor()).toBe('#50e090');
  });

  it('結果メッセージにHP回復を含む', () => {
    const result = healHandler.formatResult({ type: 'heal', amount: 30 });
    expect(result.text).toContain('30');
    expect(result.text).toContain('回復');
  });
});

describe('damageHandler', () => {
  it('ダメージを与える', () => {
    const run = makeRun({ hp: 50 });
    const result = damageHandler.apply(run, { type: 'damage', amount: 20 }, Math.random);
    expect(result.hp).toBe(30);
  });

  it('HPが1未満にならない', () => {
    const run = makeRun({ hp: 5 });
    const result = damageHandler.apply(run, { type: 'damage', amount: 100 }, Math.random);
    expect(result.hp).toBe(1);
  });

  it('ヒントカラーが赤色を返す', () => {
    expect(damageHandler.getHintColor()).toBe('#f05050');
  });
});

describe('boneChangeHandler', () => {
  it('骨を増やす', () => {
    const run = makeRun({ bE: 10 });
    const result = boneChangeHandler.apply(run, { type: 'bone_change', amount: 5 }, Math.random);
    expect(result.bE).toBe(15);
  });

  it('ヒントカラーが茶色を返す', () => {
    expect(boneChangeHandler.getHintColor()).toBe('#c0a040');
  });
});

describe('addAllyHandler', () => {
  it('仲間を追加する', () => {
    const run = makeRun({ al: [], mxA: 3, cT: 2, cL: 1, cR: 0 });
    const result = addAllyHandler.apply(run, { type: 'add_ally', allyTemplate: 'test' }, () => 0);
    expect(result.al.length).toBe(1);
  });

  it('最大人数の場合は追加しない', () => {
    const allies = [
      { n: 'A', hp: 10, mhp: 10, atk: 5, t: 'tech' as const, a: 1, h: 0, tk: 0 },
      { n: 'B', hp: 10, mhp: 10, atk: 5, t: 'tech' as const, a: 1, h: 0, tk: 0 },
      { n: 'C', hp: 10, mhp: 10, atk: 5, t: 'tech' as const, a: 1, h: 0, tk: 0 },
    ];
    const run = makeRun({ al: allies, mxA: 3 });
    const result = addAllyHandler.apply(run, { type: 'add_ally', allyTemplate: 'test' }, () => 0);
    expect(result.al.length).toBe(3);
  });

  it('ヒントカラーが青色を返す', () => {
    expect(addAllyHandler.getHintColor()).toBe('#50a0e0');
  });
});

describe('randomEvolutionHandler', () => {
  it('進化を追加する', () => {
    const run = makeRun({ evs: [] });
    const result = randomEvolutionHandler.apply(run, { type: 'random_evolution' }, () => 0);
    expect(result.evs.length).toBeGreaterThanOrEqual(1);
  });

  it('ヒントカラーが紫色を返す', () => {
    expect(randomEvolutionHandler.getHintColor()).toBe('#c060f0');
  });

  it('進化名つきの結果メッセージを生成する', () => {
    const result = randomEvolutionHandler.formatResult({ type: 'random_evolution' }, undefined, 'テスト進化');
    expect(result.text).toContain('テスト進化');
  });
});

describe('civLevelUpHandler', () => {
  it('tech文明レベルを上げる', () => {
    const run = makeRun({ cT: 2 });
    const result = civLevelUpHandler.apply(run, { type: 'civ_level_up', civType: 'tech' }, Math.random);
    expect(result.cT).toBe(3);
  });

  it('dominant指定で最も高い文明レベルを上げる', () => {
    const run = makeRun({ cT: 3, cL: 1, cR: 1 });
    const result = civLevelUpHandler.apply(run, { type: 'civ_level_up', civType: 'dominant' }, Math.random);
    expect(result.cT).toBe(4);
  });

  it('ヒントカラーが黄色を返す', () => {
    expect(civLevelUpHandler.getHintColor()).toBe('#f0c040');
  });
});

describe('nothingHandler', () => {
  it('何も変更しない', () => {
    const run = makeRun({ hp: 50 });
    const result = nothingHandler.apply(run, { type: 'nothing' }, Math.random);
    expect(result.hp).toBe(50);
  });

  it('ヒントカラーが灰色を返す', () => {
    expect(nothingHandler.getHintColor()).toBe('#606060');
  });
});
