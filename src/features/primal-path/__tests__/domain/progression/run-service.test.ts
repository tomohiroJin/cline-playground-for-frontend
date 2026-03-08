/**
 * domain/progression/run-service のテスト
 */
import { startRunState, calcBoneReward, allyReviveCost, calcRunStats } from '../../../domain/progression/run-service';
import { makeRun, makeSave } from '../../test-helpers';

describe('domain/progression/run-service', () => {
  describe('startRunState', () => {
    it('初期ランステートを生成する', () => {
      const save = makeSave();
      const run = startRunState(0, save);
      expect(run.hp).toBeGreaterThan(0);
      expect(run.mhp).toBeGreaterThan(0);
      expect(run.atk).toBeGreaterThan(0);
      expect(run.di).toBe(0);
      expect(run.en).toBeNull();
      expect(run.evs).toEqual([]);
    });

    it('周回倍率が適用される', () => {
      const save1 = makeSave({ loopCount: 0 });
      const save2 = makeSave({ loopCount: 2 });
      const run1 = startRunState(0, save1);
      const run2 = startRunState(0, save2);
      expect(run2.dd.hm).toBeGreaterThan(run1.dd.hm);
    });
  });

  describe('calcBoneReward', () => {
    it('基本報酬を計算する', () => {
      const run = makeRun({ bE: 10, bb: 5 });
      const reward = calcBoneReward(run, false);
      expect(reward).toBeGreaterThan(0);
    });

    it('勝利時にボーナス倍率が適用される', () => {
      const run = makeRun({ bE: 10, bb: 5 });
      const normalReward = calcBoneReward(run, false);
      const winReward = calcBoneReward(run, true);
      expect(winReward).toBeGreaterThan(normalReward);
    });

    it('儀式覚醒時にボーナス倍率が適用される', () => {
      const run = makeRun({ bE: 10, bb: 5, fe: 'rit' });
      const ritReward = calcBoneReward(run, false);
      const normalRun = makeRun({ bE: 10, bb: 5, fe: null });
      const normalReward = calcBoneReward(normalRun, false);
      expect(ritReward).toBeGreaterThan(normalReward);
    });

    it('最低1は返す', () => {
      const run = makeRun({ bE: 0, bb: 0 });
      expect(calcBoneReward(run, false)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('allyReviveCost', () => {
    it('バイオーム進行度で費用が増加する', () => {
      const run1 = makeRun({ bc: 0, di: 0 });
      const run2 = makeRun({ bc: 3, di: 0 });
      expect(allyReviveCost(run2)).toBeGreaterThan(allyReviveCost(run1));
    });

    it('最低2は返す', () => {
      const run = makeRun({ bc: 0, di: 0 });
      expect(allyReviveCost(run)).toBeGreaterThanOrEqual(2);
    });
  });

  describe('calcRunStats', () => {
    it('ラン統計を計算する', () => {
      const run = makeRun({ kills: 10, dmgDealt: 500, maxHit: 50, bc: 3 });
      const stats = calcRunStats(run, 'victory', 100);
      expect(stats.result).toBe('victory');
      expect(stats.totalKills).toBe(10);
      expect(stats.boneEarned).toBe(100);
    });
  });
});
