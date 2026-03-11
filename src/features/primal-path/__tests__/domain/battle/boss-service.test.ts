/**
 * domain/battle/boss-service のテスト
 */
import { resolveFinalBossKey, startFinalBoss, handleFinalBossKill } from '../../../domain/battle/boss-service';
import { makeRun } from '../../test-helpers';

describe('domain/battle/boss-service', () => {
  describe('resolveFinalBossKey', () => {
    it('techが最高の場合ftを返す', () => {
      const run = makeRun({ cT: 5, cL: 3, cR: 2, fe: null });
      expect(resolveFinalBossKey(run)).toBe('ft');
    });

    it('覚醒属性が設定されている場合それに対応するキーを返す', () => {
      const run = makeRun({ fe: 'rit' });
      expect(resolveFinalBossKey(run)).toBe('fr');
    });
  });

  describe('startFinalBoss', () => {
    it('最終ボス戦を開始する', () => {
      const run = makeRun({ cT: 5, cL: 3, cR: 2, fe: null });
      const { nextRun, bossKey } = startFinalBoss(run);
      expect(bossKey).toBe('ft');
      expect(nextRun.cBT).toBe('final');
      expect(nextRun._fPhase).toBe(1);
      expect(nextRun.en).not.toBeNull();
    });
  });

  describe('handleFinalBossKill', () => {
    it('連戦フェーズが残っている場合は次のボスを出現させる', () => {
      const run = makeRun({ _fPhase: 1, _fbk: 'ft', dd: { ...makeRun().dd, bb: 3 } });
      run.en = { n: 'boss', hp: 0, mhp: 100, atk: 10, def: 0, bone: 10 };
      const { nextRun, gameWon } = handleFinalBossKill(run);
      expect(gameWon).toBe(false);
      expect(nextRun._fPhase).toBe(2);
      expect(nextRun.en).not.toBeNull();
    });

    it('最終フェーズ到達時にゲーム勝利を返す', () => {
      const run = makeRun({ _fPhase: 3, _fbk: 'ft', dd: { ...makeRun().dd, bb: 3 } });
      const { gameWon } = handleFinalBossKill(run);
      expect(gameWon).toBe(true);
    });
  });
});
