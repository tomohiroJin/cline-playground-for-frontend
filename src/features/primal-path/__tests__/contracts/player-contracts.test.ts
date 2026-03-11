/**
 * プレイヤー契約のテスト
 */
import { requireValidPlayer } from '../../contracts/player-contracts';
import { makeRun } from '../test-helpers';

describe('requireValidPlayer', () => {
  describe('正常系', () => {
    it('有効なプレイヤー状態で例外を投げない', () => {
      // Arrange
      const run = makeRun({ hp: 50, mhp: 100, atk: 10, def: 5, cr: 0.5 });

      // Act & Assert
      expect(() => requireValidPlayer(run)).not.toThrow();
    });

    it('HP が 0 の場合も有効', () => {
      const run = makeRun({ hp: 0, mhp: 100 });
      expect(() => requireValidPlayer(run)).not.toThrow();
    });

    it('HP が最大HP と等しい場合も有効', () => {
      const run = makeRun({ hp: 100, mhp: 100 });
      expect(() => requireValidPlayer(run)).not.toThrow();
    });
  });

  describe('異常系', () => {
    it('HP が負の場合に例外を投げる', () => {
      const run = makeRun({ hp: -1, mhp: 100 });
      expect(() => requireValidPlayer(run)).toThrow(/HP/);
    });

    it('最大HP が 0 の場合に例外を投げる', () => {
      const run = makeRun({ mhp: 0 });
      expect(() => requireValidPlayer(run)).toThrow(/最大HP/);
    });

    it('最大HP が負の場合に例外を投げる', () => {
      const run = makeRun({ mhp: -10 });
      expect(() => requireValidPlayer(run)).toThrow(/最大HP/);
    });

    it('ATK が負の場合に例外を投げる', () => {
      const run = makeRun({ atk: -1 });
      expect(() => requireValidPlayer(run)).toThrow(/ATK/);
    });

    it('DEF が負の場合に例外を投げる', () => {
      const run = makeRun({ def: -1 });
      expect(() => requireValidPlayer(run)).toThrow(/DEF/);
    });
  });
});
