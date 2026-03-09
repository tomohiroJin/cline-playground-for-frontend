/**
 * バトル契約のテスト
 */
import { requireActiveBattle } from '../../contracts/battle-contracts';
import { makeRun } from '../test-helpers';

describe('requireActiveBattle', () => {
  describe('正常系', () => {
    it('敵が存在する場合に例外を投げない', () => {
      // Arrange
      const run = makeRun({
        en: { n: 'テスト敵', hp: 50, mhp: 50, atk: 5, def: 2, bone: 3 },
        turn: 1,
      });

      // Act & Assert
      expect(() => requireActiveBattle(run)).not.toThrow();
    });

    it('ターン 0 でも敵が存在すれば有効', () => {
      const run = makeRun({
        en: { n: 'テスト敵', hp: 50, mhp: 50, atk: 5, def: 2, bone: 3 },
        turn: 0,
      });
      expect(() => requireActiveBattle(run)).not.toThrow();
    });
  });

  describe('異常系', () => {
    it('敵が null の場合に例外を投げる', () => {
      const run = makeRun({ en: null });
      expect(() => requireActiveBattle(run)).toThrow(/敵/);
    });

    it('ターン数が負の場合に例外を投げる', () => {
      const run = makeRun({
        en: { n: 'テスト敵', hp: 50, mhp: 50, atk: 5, def: 2, bone: 3 },
        turn: -1,
      });
      expect(() => requireActiveBattle(run)).toThrow(/ターン/);
    });
  });
});
