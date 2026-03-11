/**
 * shieldHandler のテスト
 */
import { shieldHandler } from '../../../../domain/skill/handlers/shield-handler';
import { makeRun } from '../../../test-helpers';
import type { ASkillDef } from '../../../../types';

const DEF: ASkillDef = {
  id: 'sW', nm: '盾の壁', ds: '', ct: 'bal', rL: 4, cd: 4, ic: '🛡️',
  fx: { t: 'shield', dR: 0.5, dur: 3 },
};

describe('shieldHandler', () => {
  it('シールドバフを付与する', () => {
    // Arrange
    const run = makeRun();

    // Act
    const { nextRun, events } = shieldHandler.execute(run, DEF);

    // Assert
    expect(nextRun.sk.bfs).toHaveLength(1);
    expect(nextRun.sk.bfs[0].sid).toBe('sW');
    expect(nextRun.sk.bfs[0].rT).toBe(3);
    expect(nextRun.sk.bfs[0].fx).toEqual({ t: 'shield', dR: 0.5, dur: 3 });
    expect(nextRun.log[0].c).toBe('cc');
    expect(events).toContainEqual(expect.objectContaining({ type: 'sfx', sfx: 'skShield' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'skill_fx', sid: 'sW' }));
  });
});
