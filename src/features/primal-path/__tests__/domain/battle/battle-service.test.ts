/**
 * domain/battle/battle-service のテスト
 */
import { startBattle, afterBattle } from '../../../domain/battle/battle-service';
import { makeRun } from '../../test-helpers';

describe('domain/battle/battle-service', () => {
  describe('startBattle', () => {
    it('バトル開始時に敵が生成される', () => {
      const run = makeRun({ cB: 1, cBT: 'grassland', cW: 0 });
      const result = startBattle(run, false);
      expect(result.en).not.toBeNull();
      expect(result.cW).toBe(1);
      expect(result.log).toEqual([]);
    });

    it('エンドレスモードでスケーリングが適用される', () => {
      const run = makeRun({ cB: 1, cBT: 'grassland', cW: 0, isEndless: true, endlessWave: 2, aM: 1 });
      const result = startBattle(run, false);
      expect(result.en).not.toBeNull();
      // エンドレスWave2なので敵が強化されている
      const normalRun = makeRun({ cB: 1, cBT: 'grassland', cW: 0 });
      const normalResult = startBattle(normalRun, false);
      expect(result.en!.hp).toBeGreaterThan(normalResult.en!.hp);
    });
  });

  describe('afterBattle', () => {
    it('通常敵撃破時にバイオームクリアしない', () => {
      const run = makeRun({ cW: 2, wpb: 4 });
      const { nextRun, biomeCleared } = afterBattle(run);
      expect(biomeCleared).toBe(false);
      expect(nextRun.btlCount).toBe(1);
    });

    it('ボス撃破時にバイオームクリアする', () => {
      const run = makeRun({ cW: 5, wpb: 4 });
      const { nextRun, biomeCleared } = afterBattle(run);
      expect(biomeCleared).toBe(true);
      expect(nextRun.bc).toBe(1);
      expect(nextRun.cW).toBe(0);
    });
  });
});
