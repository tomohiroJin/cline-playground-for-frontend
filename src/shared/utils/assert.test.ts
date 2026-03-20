import { assert, assertDefined } from './assert';

describe('assert', () => {
  describe('正常系', () => {
    it('条件がtrueの場合は例外をスローしない', () => {
      expect(() => assert(true, 'テスト')).not.toThrow();
    });
  });

  describe('異常系', () => {
    it('条件がfalseの場合はエラーをスローする', () => {
      expect(() => assert(false, 'エラーメッセージ')).toThrow(
        'Assertion failed: エラーメッセージ'
      );
    });

    it('カスタムメッセージがエラーに含まれる', () => {
      expect(() => assert(false, '値が範囲外です')).toThrow('値が範囲外です');
    });
  });
});

describe('assertDefined', () => {
  describe('正常系', () => {
    it('値が定義されている場合は例外をスローしない', () => {
      expect(() => assertDefined('hello', 'テスト')).not.toThrow();
    });

    it('0やfalseなど偽値でもnull/undefined以外は通過する', () => {
      expect(() => assertDefined(0, 'テスト')).not.toThrow();
      expect(() => assertDefined(false, 'テスト')).not.toThrow();
      expect(() => assertDefined('', 'テスト')).not.toThrow();
    });
  });

  describe('異常系', () => {
    it('undefinedの場合はエラーをスローする', () => {
      expect(() => assertDefined(undefined, '未定義です')).toThrow(
        'Assertion failed: 未定義です'
      );
    });

    it('nullの場合はエラーをスローする', () => {
      expect(() => assertDefined(null, 'nullです')).toThrow(
        'Assertion failed: nullです'
      );
    });
  });

  describe('型ガード', () => {
    it('assertDefined後は型が絞り込まれる', () => {
      const value: string | undefined = 'hello';
      assertDefined(value, 'テスト');
      // 型ガードが機能している場合、以下のコードはコンパイルエラーにならない
      const length: number = value.length;
      expect(length).toBe(5);
    });
  });
});
