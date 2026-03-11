/**
 * healAllHandler のテスト
 */
import { healAllHandler } from '../../../../domain/skill/handlers/heal-all-handler';
import { makeRun } from '../../../test-helpers';
import type { ASkillDef } from '../../../../types';

const DEF: ASkillDef = {
  id: 'nH', nm: '自然の癒し', ds: '', ct: 'life', rL: 3, cd: 4, ic: '🌿',
  fx: { t: 'healAll', bh: 30, aR: 0.3 },
};

describe('healAllHandler', () => {
  it('プレイヤーのHPを回復する', () => {
    // Arrange
    const run = makeRun({ hp: 50, mhp: 100 });

    // Act
    const { nextRun, events } = healAllHandler.execute(run, DEF);

    // Assert
    expect(nextRun.hp).toBe(80);
    expect(events).toContainEqual(expect.objectContaining({ type: 'popup', heal: true, tgt: 'pl' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'sfx', sfx: 'skHeal' }));
  });

  it('HPが最大HPを超えない', () => {
    // Arrange
    const run = makeRun({ hp: 90, mhp: 100 });

    // Act
    const { nextRun } = healAllHandler.execute(run, DEF);

    // Assert
    expect(nextRun.hp).toBe(100);
  });

  it('仲間も回復する', () => {
    // Arrange
    const ally = { n: '仲間', hp: 10, mhp: 100, atk: 5, t: 'tech' as const, a: 1, h: 0, tk: 0 };
    const run = makeRun({ hp: 50, mhp: 100, al: [ally] });

    // Act
    const { nextRun } = healAllHandler.execute(run, DEF);

    // Assert
    expect(nextRun.al[0].hp).toBe(40); // 10 + floor(100 * 0.3) = 40
  });

  it('回復禁止中は回復せず早期リターンする', () => {
    // Arrange
    const run = makeRun({ hp: 50, mhp: 100, noHealing: true });

    // Act
    const { nextRun, events } = healAllHandler.execute(run, DEF);

    // Assert
    expect(nextRun.hp).toBe(50);
    expect(nextRun.log[0].c).toBe('xc');
    expect(events).toHaveLength(0);
  });
});
