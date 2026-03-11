/**
 * domain/battle/tick-phases のテスト
 */
import { tick } from '../../../domain/battle/tick-phases';
import { makeRun } from '../../test-helpers';

describe('domain/battle/tick-phases', () => {
  describe('tick', () => {
    it('敵がいない場合は何もせずに返す', () => {
      const run = makeRun({ en: null });
      const result = tick(run, false, () => 0.5);
      expect(result.events).toEqual([]);
    });

    it('1ターンの戦闘でターン数が増加する', () => {
      const run = makeRun({
        en: { n: 'test', hp: 1000, mhp: 1000, atk: 1, def: 0, bone: 1 },
        atk: 10, aM: 1, dm: 1,
      });
      const result = tick(run, false, () => 0.5);
      expect(result.nextRun.turn).toBe(1);
      expect(result.nextRun.wTurn).toBe(1);
    });

    it('敵を倒した場合にenemy_killedイベントが発生する', () => {
      const run = makeRun({
        en: { n: 'weak', hp: 1, mhp: 1, atk: 1, def: 0, bone: 5 },
        atk: 100, aM: 1, dm: 1,
      });
      const result = tick(run, false, () => 0.5);
      expect(result.events.some(e => e.type === 'enemy_killed')).toBe(true);
      expect(result.nextRun.kills).toBe(1);
    });

    it('最終ボスモードで敵を倒した場合にfinal_boss_killedイベントが発生する', () => {
      const run = makeRun({
        en: { n: 'boss', hp: 1, mhp: 1, atk: 1, def: 0, bone: 10 },
        atk: 100, aM: 1, dm: 1,
      });
      const result = tick(run, true, () => 0.5);
      expect(result.events.some(e => e.type === 'final_boss_killed')).toBe(true);
    });

    it('元のRunStateを変更しない（イミュータビリティ）', () => {
      const run = makeRun({
        en: { n: 'test', hp: 100, mhp: 100, atk: 5, def: 0, bone: 1 },
        hp: 50, mhp: 80, atk: 10, aM: 1, dm: 1,
      });
      const originalHp = run.hp;
      tick(run, false, () => 0.5);
      expect(run.hp).toBe(originalHp);
    });
  });
});
