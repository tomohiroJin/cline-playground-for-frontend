import { createDivision, calculateShuffleMoves, getDivisionMultiplier } from './division';

describe('Division 値オブジェクト', () => {
  describe('createDivision', () => {
    describe('正常系', () => {
      it.each([2, 3, 4, 5, 6, 8, 10, 16, 32])('分割数 %d を作成できる', (value) => {
        expect(createDivision(value)).toBe(value);
      });
    });

    describe('異常系', () => {
      it('無効な分割数はエラーをスローする', () => {
        expect(() => createDivision(7)).toThrow('Assertion failed');
      });

      it('0はエラーをスローする', () => {
        expect(() => createDivision(0)).toThrow('Assertion failed');
      });

      it('負の数はエラーをスローする', () => {
        expect(() => createDivision(-1)).toThrow('Assertion failed');
      });
    });
  });

  describe('calculateShuffleMoves', () => {
    it('分割数2の場合、シャッフル回数は8', () => {
      expect(calculateShuffleMoves(2)).toBe(8);
    });

    it('分割数4の場合、シャッフル回数は32', () => {
      expect(calculateShuffleMoves(4)).toBe(32);
    });

    it('分割数32の場合、シャッフル回数は2048', () => {
      expect(calculateShuffleMoves(32)).toBe(2048);
    });
  });

  describe('getDivisionMultiplier', () => {
    it('分割数が大きいほど倍率が高い', () => {
      const mult2 = getDivisionMultiplier(2);
      const mult4 = getDivisionMultiplier(4);
      const mult32 = getDivisionMultiplier(32);
      expect(mult4).toBeGreaterThan(mult2);
      expect(mult32).toBeGreaterThan(mult4);
    });

    it('分割数4の場合、倍率は1.0', () => {
      expect(getDivisionMultiplier(4)).toBe(1.0);
    });

    it('分割数2の場合、倍率は0.3', () => {
      expect(getDivisionMultiplier(2)).toBe(0.3);
    });
  });
});
