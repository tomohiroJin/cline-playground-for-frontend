/**
 * 進化契約のテスト
 */
import { requireValidEvolution } from '../../contracts/evolution-contracts';
import { makeRun } from '../test-helpers';
import type { Evolution } from '../../types';

const mockEvo: Evolution = {
  n: 'テスト進化',
  t: 'tech',
  e: { mhp: 10, atk: 5 },
  d: 'テスト',
  r: 0,
  tags: [],
};

describe('requireValidEvolution', () => {
  describe('正常系', () => {
    it('上限内の進化数で例外を投げない', () => {
      // Arrange
      const run = makeRun({ evs: [mockEvo], maxEvo: 5 });

      // Act & Assert
      expect(() => requireValidEvolution(run)).not.toThrow();
    });

    it('maxEvo が未定義の場合は無制限として有効', () => {
      const run = makeRun({ evs: [mockEvo, mockEvo, mockEvo] });
      expect(() => requireValidEvolution(run)).not.toThrow();
    });

    it('進化数が 0 の場合も有効', () => {
      const run = makeRun({ evs: [] });
      expect(() => requireValidEvolution(run)).not.toThrow();
    });
  });

  describe('異常系', () => {
    it('進化数が上限を超えている場合に例外を投げる', () => {
      const run = makeRun({
        evs: [mockEvo, mockEvo, mockEvo],
        maxEvo: 2,
      });
      expect(() => requireValidEvolution(run)).toThrow(/進化数/);
    });
  });
});
