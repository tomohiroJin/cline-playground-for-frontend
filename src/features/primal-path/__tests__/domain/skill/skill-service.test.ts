/**
 * domain/skill/skill-service のテスト
 */
import { calcAvlSkills, applySkill, tickBuffs, decSkillCds } from '../../../domain/skill/skill-service';
import { makeRun } from '../../test-helpers';
import type { SkillSt } from '../../../types';

describe('domain/skill/skill-service', () => {
  describe('calcAvlSkills', () => {
    it('文明レベルが低い場合は空配列を返す', () => {
      const run = makeRun({ cT: 0, cL: 0, cR: 0 });
      expect(calcAvlSkills(run)).toEqual([]);
    });
  });

  describe('applySkill', () => {
    it('存在しないスキルIDの場合は元のRunStateを返す', () => {
      const run = makeRun();
      const result = applySkill(run, 'nonexistent' as never);
      expect(result.nextRun).toBe(run);
    });

    it('クールダウン中の場合は元のRunStateを返す', () => {
      const run = makeRun({
        sk: { avl: ['fB'], cds: { fB: 3 }, bfs: [] },
      });
      const result = applySkill(run, 'fB');
      expect(result.nextRun).toBe(run);
    });
  });

  describe('tickBuffs', () => {
    it('バフのターンをデクリメントする', () => {
      const sk: SkillSt = {
        avl: [],
        cds: {},
        bfs: [{ sid: 'test' as never, rT: 3, fx: { t: 'buffAtk', aM: 1.5, hC: 10, dur: 3 } }],
      };
      const result = tickBuffs(sk);
      expect(result.bfs[0].rT).toBe(2);
    });

    it('残りターンが0になったバフを除去する', () => {
      const sk: SkillSt = {
        avl: [],
        cds: {},
        bfs: [{ sid: 'test' as never, rT: 1, fx: { t: 'buffAtk', aM: 1.5, hC: 10, dur: 3 } }],
      };
      const result = tickBuffs(sk);
      expect(result.bfs).toHaveLength(0);
    });
  });

  describe('decSkillCds', () => {
    it('クールダウンをデクリメントする', () => {
      const sk: SkillSt = {
        avl: [],
        cds: { fB: 3 },
        bfs: [],
      };
      const result = decSkillCds(sk);
      expect(result.cds.fB).toBe(2);
    });

    it('クールダウンが0になったら除去する', () => {
      const sk: SkillSt = {
        avl: [],
        cds: { fB: 1 },
        bfs: [],
      };
      const result = decSkillCds(sk);
      expect(result.cds.fB).toBeUndefined();
    });
  });
});
