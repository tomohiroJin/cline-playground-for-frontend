/**
 * dmgAllHandler のテスト
 */
import { dmgAllHandler } from '../../../../domain/skill/handlers/dmg-all-handler';
import { makeRun } from '../../../test-helpers';
import type { ASkillDef } from '../../../../types';

const DEF: ASkillDef = {
  id: 'fB', nm: '炎の爆発', ds: '', ct: 'tech', rL: 3, cd: 3, ic: '🔥',
  fx: { t: 'dmgAll', bd: 50, mul: 2 },
};

describe('dmgAllHandler', () => {
  it('敵が存在する場合にダメージを与える', () => {
    // Arrange
    const run = makeRun({ en: { n: 'スライム', hp: 100, mhp: 100, atk: 5, def: 0, bone: 1 } });

    // Act
    const { nextRun, events } = dmgAllHandler.execute(run, DEF);

    // Assert
    expect(nextRun.en!.hp).toBe(0); // 100 - floor(50 * 2) = 0
    expect(nextRun.dmgDealt).toBe(100);
    expect(nextRun.log).toHaveLength(1);
    expect(events).toContainEqual(expect.objectContaining({ type: 'sfx', sfx: 'skFire' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'popup', tgt: 'en' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'skill_fx', sid: 'fB' }));
  });

  it('敵が存在しない場合は何もしない', () => {
    // Arrange
    const run = makeRun({ en: null });

    // Act
    const { nextRun, events } = dmgAllHandler.execute(run, DEF);

    // Assert
    expect(nextRun.dmgDealt).toBe(0);
    expect(events).toHaveLength(0);
  });
});
