/**
 * MathUtils / FnUtils のテスト
 *
 * カバレッジ不足の randomRange, randomBool, FnUtils を追加する。
 */
import { MathUtils, FnUtils } from '../../domain/math-utils';

describe('MathUtils', () => {
  describe('randomRange', () => {
    let randomSpy: jest.SpyInstance;

    beforeEach(() => {
      randomSpy = jest.spyOn(Math, 'random');
    });

    afterEach(() => {
      randomSpy.mockRestore();
    });

    it('最小値と最大値の間のランダムな値を返す', () => {
      // Arrange
      randomSpy.mockReturnValue(0.5);

      // Act
      const result = MathUtils.randomRange(10, 20);

      // Assert: 10 + 0.5 * (20 - 10) = 15
      expect(result).toBe(15);
    });

    it('乱数が 0 の場合に最小値を返す', () => {
      // Arrange
      randomSpy.mockReturnValue(0);

      // Act
      const result = MathUtils.randomRange(5, 10);

      // Assert
      expect(result).toBe(5);
    });

    it('NaN を渡した場合にエラーをスローする', () => {
      // Act & Assert
      expect(() => MathUtils.randomRange(NaN, 10)).toThrow();
    });

    it('min > max の場合にエラーをスローする', () => {
      // Act & Assert
      expect(() => MathUtils.randomRange(10, 5)).toThrow();
    });
  });

  describe('randomBool', () => {
    let randomSpy: jest.SpyInstance;

    beforeEach(() => {
      randomSpy = jest.spyOn(Math, 'random');
    });

    afterEach(() => {
      randomSpy.mockRestore();
    });

    it('乱数が確率未満の場合に true を返す', () => {
      // Arrange
      randomSpy.mockReturnValue(0.3);

      // Act & Assert
      expect(MathUtils.randomBool(0.5)).toBe(true);
    });

    it('乱数が確率以上の場合に false を返す', () => {
      // Arrange
      randomSpy.mockReturnValue(0.7);

      // Act & Assert
      expect(MathUtils.randomBool(0.5)).toBe(false);
    });

    it('デフォルト確率は 0.5 で動作する', () => {
      // Arrange
      randomSpy.mockReturnValue(0.3);

      // Act & Assert
      expect(MathUtils.randomBool()).toBe(true);
    });

    it('NaN を渡した場合にエラーをスローする', () => {
      // Act & Assert
      expect(() => MathUtils.randomBool(NaN)).toThrow();
    });
  });

  describe('clamp - 異常系', () => {
    it('NaN を渡した場合にエラーをスローする', () => {
      // Act & Assert
      expect(() => MathUtils.clamp(NaN, 0, 10)).toThrow();
    });

    it('min > max の場合にエラーをスローする', () => {
      // Act & Assert
      expect(() => MathUtils.clamp(5, 10, 0)).toThrow();
    });
  });

  describe('lerp - 異常系', () => {
    it('NaN を渡した場合にエラーをスローする', () => {
      // Act & Assert
      expect(() => MathUtils.lerp(NaN, 10, 0.5)).toThrow();
    });
  });
});

describe('FnUtils', () => {
  describe('identity', () => {
    it('渡された値をそのまま返す', () => {
      // Act & Assert
      expect(FnUtils.identity(42)).toBe(42);
      expect(FnUtils.identity('hello')).toBe('hello');
    });
  });

  describe('pipe', () => {
    it('複数の関数を順番に適用する', () => {
      // Arrange
      const double = (x: number) => x * 2;
      const addOne = (x: number) => x + 1;

      // Act
      const result = FnUtils.pipe(double, addOne)(5);

      // Assert: (5 * 2) + 1 = 11
      expect(result).toBe(11);
    });

    it('関数が0個の場合に元の値を返す', () => {
      // Act
      const result = FnUtils.pipe<number>()(10);

      // Assert
      expect(result).toBe(10);
    });
  });
});
