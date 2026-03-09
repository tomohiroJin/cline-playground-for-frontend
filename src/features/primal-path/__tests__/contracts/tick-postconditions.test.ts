/**
 * 戦闘ティック事後条件のテスト
 */
import { ensureTickResult } from '../../contracts/tick-postconditions';
import { makeRun } from '../test-helpers';
import type { TickResult } from '../../types';

describe('ensureTickResult', () => {
  describe('正常系', () => {
    it('HP が最大HP 以下で例外を投げない', () => {
      // Arrange
      const result: TickResult = {
        nextRun: makeRun({ hp: 50, mhp: 100 }),
        events: [],
      };

      // Act & Assert
      expect(() => ensureTickResult(result)).not.toThrow();
    });

    it('HP が 0 の場合も有効', () => {
      const result: TickResult = {
        nextRun: makeRun({ hp: 0, mhp: 100 }),
        events: [],
      };
      expect(() => ensureTickResult(result)).not.toThrow();
    });
  });

  describe('異常系', () => {
    it('HP が最大HP を超えている場合に例外を投げる', () => {
      const result: TickResult = {
        nextRun: makeRun({ hp: 150, mhp: 100 }),
        events: [],
      };
      expect(() => ensureTickResult(result)).toThrow(/事後条件違反.*HP/);
    });

    it('HP が負の場合に例外を投げる', () => {
      const result: TickResult = {
        nextRun: makeRun({ hp: -5, mhp: 100 }),
        events: [],
      };
      expect(() => ensureTickResult(result)).toThrow(/事後条件違反.*HP/);
    });
  });
});
