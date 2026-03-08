/**
 * domain/awakening/awakening-service のテスト
 */
import { checkAwakeningRules, applyAwkFx, awkInfo } from '../../../domain/awakening/awakening-service';
import { makeRun } from '../../test-helpers';

describe('domain/awakening/awakening-service', () => {
  describe('checkAwakeningRules', () => {
    it('全文明レベル3以上で調和・小が解除可能になる', () => {
      const run = makeRun({ cT: 3, cL: 3, cR: 3, awoken: [] });
      const rule = checkAwakeningRules(run);
      expect(rule).not.toBeNull();
      expect(rule!.id).toBe('sa_bal');
    });

    it('条件を満たしていない場合はnullを返す', () => {
      const run = makeRun({ cT: 1, cL: 1, cR: 1, awoken: [] });
      const rule = checkAwakeningRules(run);
      expect(rule).toBeNull();
    });

    it('既に解除済みの覚醒はスキップする', () => {
      const run = makeRun({
        cT: 3, cL: 3, cR: 3,
        awoken: [{ id: 'sa_bal', nm: '調和・小', cl: '#e0c060' }],
      });
      const rule = checkAwakeningRules(run);
      // sa_balは解除済みなので次の候補を探す
      expect(rule === null || rule.id !== 'sa_bal').toBe(true);
    });
  });

  describe('applyAwkFx', () => {
    it('覚醒効果を適用して記録する', () => {
      const run = makeRun({ atk: 10, awoken: [] });
      const result = applyAwkFx(run, { atk: 5 }, 'sa_tech', 'テク・小', '#60a0ff', null);
      expect(result.atk).toBe(15);
      expect(result.awoken).toHaveLength(1);
      expect(result.awoken[0].id).toBe('sa_tech');
    });

    it('元のRunStateを変更しない', () => {
      const run = makeRun({ atk: 10, awoken: [] });
      applyAwkFx(run, { atk: 5 }, 'sa_tech', 'テク・小', '#60a0ff', null);
      expect(run.atk).toBe(10);
      expect(run.awoken).toHaveLength(0);
    });
  });

  describe('awkInfo', () => {
    it('次の覚醒候補を返す（最大3個）', () => {
      const run = makeRun({ cT: 1, cL: 1, cR: 1, awoken: [] });
      const info = awkInfo(run);
      expect(info.length).toBeLessThanOrEqual(3);
      expect(info.length).toBeGreaterThan(0);
    });
  });
});
