// DbC アサーション関数のテスト

import {
  assert,
  assertInRange,
  assertPositive,
  assertNonNegative,
  assertDefined,
  assertValidIndex,
} from '../../../domain/shared/assertions';

describe('assertions', () => {
  describe('assert', () => {
    it('条件が true の場合は例外を投げない', () => {
      expect(() => assert(true, 'ok')).not.toThrow();
    });

    it('条件が false の場合は例外を投げる', () => {
      expect(() => assert(false, 'failed')).toThrow('Assertion failed: failed');
    });

    it('メッセージなしの場合はデフォルトメッセージ', () => {
      expect(() => assert(false)).toThrow('Assertion failed: unknown');
    });
  });

  describe('assertInRange', () => {
    it('範囲内の値では例外を投げない', () => {
      expect(() => assertInRange(5, 0, 10, 'value')).not.toThrow();
    });

    it('境界値では例外を投げない', () => {
      expect(() => assertInRange(0, 0, 10, 'value')).not.toThrow();
      expect(() => assertInRange(10, 0, 10, 'value')).not.toThrow();
    });

    it('範囲外の値では例外を投げる', () => {
      expect(() => assertInRange(-1, 0, 10, 'value')).toThrow();
      expect(() => assertInRange(11, 0, 10, 'value')).toThrow();
    });
  });

  describe('assertPositive', () => {
    it('正の値では例外を投げない', () => {
      expect(() => assertPositive(1, 'value')).not.toThrow();
    });

    it('0 では例外を投げる', () => {
      expect(() => assertPositive(0, 'value')).toThrow();
    });

    it('負の値では例外を投げる', () => {
      expect(() => assertPositive(-1, 'value')).toThrow();
    });
  });

  describe('assertNonNegative', () => {
    it('0 では例外を投げない', () => {
      expect(() => assertNonNegative(0, 'value')).not.toThrow();
    });

    it('正の値では例外を投げない', () => {
      expect(() => assertNonNegative(5, 'value')).not.toThrow();
    });

    it('負の値では例外を投げる', () => {
      expect(() => assertNonNegative(-1, 'value')).toThrow();
    });
  });

  describe('assertDefined', () => {
    it('値が定義されている場合は例外を投げない', () => {
      expect(() => assertDefined('hello', 'value')).not.toThrow();
      expect(() => assertDefined(0, 'value')).not.toThrow();
      expect(() => assertDefined(false, 'value')).not.toThrow();
    });

    it('undefined の場合は例外を投げる', () => {
      expect(() => assertDefined(undefined, 'value')).toThrow();
    });

    it('null の場合は例外を投げる', () => {
      expect(() => assertDefined(null, 'value')).toThrow();
    });
  });

  describe('assertValidIndex', () => {
    it('有効なインデックスでは例外を投げない', () => {
      expect(() => assertValidIndex(0, 5, 'idx')).not.toThrow();
      expect(() => assertValidIndex(4, 5, 'idx')).not.toThrow();
    });

    it('範囲外のインデックスでは例外を投げる', () => {
      expect(() => assertValidIndex(-1, 5, 'idx')).toThrow();
      expect(() => assertValidIndex(5, 5, 'idx')).toThrow();
    });

    it('非整数のインデックスでは例外を投げる', () => {
      expect(() => assertValidIndex(1.5, 5, 'idx')).toThrow();
    });
  });
});
