/**
 * domain/evolution/evolution-service のテスト
 */
import { rollE, applyEvo, simEvo } from '../../../domain/evolution/evolution-service';
import { makeRun } from '../../test-helpers';
import { EVOS } from '../../../constants';

describe('domain/evolution/evolution-service', () => {
  describe('simEvo', () => {
    it('進化適用のプレビューを返す', () => {
      const run = makeRun({ atk: 10, aM: 1, dm: 1, mhp: 100, hp: 80, def: 5, cr: 0.1 });
      const evo = EVOS[0];
      const result = simEvo(run, evo);
      expect(result).toHaveProperty('atk');
      expect(result).toHaveProperty('hp');
      expect(result).toHaveProperty('mhp');
      expect(result).toHaveProperty('def');
      expect(result).toHaveProperty('cr');
    });
  });

  describe('rollE', () => {
    it('evoN個の進化を返す', () => {
      const run = makeRun({ evoN: 3 });
      const result = rollE(run, () => 0.5);
      expect(result).toHaveLength(3);
    });

    it('各文明から最低1つは選択される', () => {
      const run = makeRun({ evoN: 3 });
      const result = rollE(run, () => 0.5);
      const types = new Set(result.map(e => e.t));
      expect(types.size).toBe(3);
    });

    it('重複なしで選択される', () => {
      const run = makeRun({ evoN: 5 });
      const result = rollE(run, () => 0.5);
      const names = result.map(e => e.n);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('applyEvo', () => {
    it('進化を適用して文明レベルが増加する', () => {
      const evo = EVOS.find(e => e.t === 'tech')!;
      const run = makeRun({ cT: 0 });
      const { nextRun } = applyEvo(run, evo, () => 0.5);
      expect(nextRun.cT).toBe(1);
      expect(nextRun.evs).toHaveLength(1);
    });

    it('元のRunStateを変更しない', () => {
      const evo = EVOS.find(e => e.t === 'tech')!;
      const run = makeRun({ cT: 0 });
      applyEvo(run, evo, () => 0.5);
      expect(run.cT).toBe(0);
      expect(run.evs).toHaveLength(0);
    });
  });
});
