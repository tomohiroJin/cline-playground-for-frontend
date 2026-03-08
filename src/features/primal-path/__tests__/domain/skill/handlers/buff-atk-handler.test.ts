/**
 * buffAtkHandler のテスト
 */
import { buffAtkHandler } from '../../../../domain/skill/handlers/buff-atk-handler';
import { makeRun } from '../../../test-helpers';
import type { ASkillDef } from '../../../../types';

const DEF: ASkillDef = {
  id: 'bR', nm: '血の狂乱', ds: '', ct: 'rit', rL: 3, cd: 5, ic: '🩸',
  fx: { t: 'buffAtk', aM: 1.5, hC: 10, dur: 3 },
};

describe('buffAtkHandler', () => {
  it('HP消費してバフを付与する', () => {
    // Arrange
    const run = makeRun({ hp: 50, mhp: 100 });

    // Act
    const { nextRun, events } = buffAtkHandler.execute(run, DEF);

    // Assert
    expect(nextRun.hp).toBe(40); // 50 - 10
    expect(nextRun.sk.bfs).toHaveLength(1);
    expect(nextRun.sk.bfs[0].sid).toBe('bR');
    expect(nextRun.sk.bfs[0].rT).toBe(3);
    expect(events).toContainEqual(expect.objectContaining({ type: 'sfx', sfx: 'skRage' }));
  });

  it('HPが1未満にならない', () => {
    // Arrange
    const run = makeRun({ hp: 5 });

    // Act
    const { nextRun } = buffAtkHandler.execute(run, DEF);

    // Assert
    expect(nextRun.hp).toBe(1);
  });
});
