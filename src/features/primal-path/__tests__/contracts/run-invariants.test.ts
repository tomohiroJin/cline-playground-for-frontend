/**
 * RunState 不変条件のテスト
 */
import { assertRunInvariant } from '../../contracts/run-invariants';
import { makeRun } from '../test-helpers';

describe('assertRunInvariant', () => {
  describe('正常系', () => {
    it('正常な RunState で例外を投げない', () => {
      // Arrange
      const run = makeRun({
        hp: 50, mhp: 100, bc: 2, kills: 10, evs: [],
      });

      // Act & Assert
      expect(() => assertRunInvariant(run)).not.toThrow();
    });

    it('HP が 0 で最大HP が正の RunState は有効', () => {
      const run = makeRun({ hp: 0, mhp: 100 });
      expect(() => assertRunInvariant(run)).not.toThrow();
    });

    it('HP が最大HP に等しい場合も有効', () => {
      const run = makeRun({ hp: 80, mhp: 80 });
      expect(() => assertRunInvariant(run)).not.toThrow();
    });
  });

  describe('異常系', () => {
    it('HP が最大HP を超えている場合に例外を投げる', () => {
      const run = makeRun({ hp: 150, mhp: 100 });
      expect(() => assertRunInvariant(run)).toThrow(/HP.*maxHP/);
    });

    it('バイオームクリア数が負の場合に例外を投げる', () => {
      const run = makeRun({ bc: -1 });
      expect(() => assertRunInvariant(run)).toThrow(/バイオームクリア数/);
    });

    it('撃破数が負の場合に例外を投げる', () => {
      const run = makeRun({ kills: -1 });
      expect(() => assertRunInvariant(run)).toThrow(/撃破数/);
    });

    it('進化数が上限を超えている場合に例外を投げる', () => {
      const mockEvo = {
        n: 'テスト', t: 'tech' as const, d: '',
        e: { hp: 0, mhp: 0, atk: 0, def: 0, cr: 0, aM: 0, burn: 0, aHL: 0 },
        r: 0, tags: [],
      };
      const run = makeRun({
        evs: [mockEvo, mockEvo, mockEvo],
        maxEvo: 2,
      });
      expect(() => assertRunInvariant(run)).toThrow(/進化数/);
    });
  });
});
