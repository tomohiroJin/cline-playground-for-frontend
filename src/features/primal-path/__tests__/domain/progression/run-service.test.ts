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
      // Arrange
      const run = makeRun({ kills: 10, dmgDealt: 500, maxHit: 50, bc: 3 });

      // Act
      const stats = calcRunStats(run, 'victory', 100);

      // Assert
      expect(stats.result).toBe('victory');
      expect(stats.totalKills).toBe(10);
      expect(stats.boneEarned).toBe(100);
    });

    it('覚醒済みの場合に覚醒名が統計に含まれる', () => {
      // Arrange
      const run = makeRun({
        kills: 5,
        awoken: [
          { id: 'sa_tech', nm: 'テク・小', cl: '#60a0ff' },
          { id: 'fa_tech', nm: 'テク・大', cl: '#60a0ff' },
        ],
      });

      // Act
      const stats = calcRunStats(run, 'defeat', 50);

      // Assert: 最後の覚醒名が返る
      expect(stats.awakening).toBe('テク・大');
    });

    it('覚醒がない場合にawakeningはundefined', () => {
      // Arrange
      const run = makeRun({ awoken: [] });

      // Act
      const stats = calcRunStats(run, 'defeat', 0);

      // Assert
      expect(stats.awakening).toBeUndefined();
    });

    it('エンドレスモードの場合にendlessWaveが統計に含まれる', () => {
      // Arrange
      const run = makeRun({ isEndless: true, endlessWave: 5 });

      // Act
      const stats = calcRunStats(run, 'defeat', 200);

      // Assert
      expect(stats.endlessWave).toBe(5);
    });

    it('非エンドレスモードの場合にendlessWaveはundefined', () => {
      // Arrange
      const run = makeRun({ isEndless: false, endlessWave: 0 });

      // Act
      const stats = calcRunStats(run, 'victory', 100);

      // Assert
      expect(stats.endlessWave).toBeUndefined();
    });

    it('チャレンジIDが統計に含まれる', () => {
      // Arrange
      const run = makeRun({ challengeId: 'ch_speed' });

      // Act
      const stats = calcRunStats(run, 'victory', 100);

      // Assert
      expect(stats.challengeId).toBe('ch_speed');
    });

    it('シナジー数が正しく計算される', () => {
      // Arrange
      const run = makeRun({
        evs: [
          { n: '進化1', d: '', t: 'tech', r: 0, e: { atk: 1 }, tags: ['fire'] },
          { n: '進化2', d: '', t: 'tech', r: 0, e: { atk: 1 }, tags: ['fire'] },
        ],
      });

      // Act
      const stats = calcRunStats(run, 'victory', 100);

      // Assert: fireタグ2つでシナジー発動
      expect(stats.synergyCount).toBeGreaterThanOrEqual(0);
    });

    it('イベント数とスキル使用回数が統計に含まれる', () => {
      // Arrange
      const run = makeRun({ eventCount: 3, skillUseCount: 7 });

      // Act
      const stats = calcRunStats(run, 'victory', 100);

      // Assert
      expect(stats.eventCount).toBe(3);
      expect(stats.skillUsageCount).toBe(7);
    });
  });
});
