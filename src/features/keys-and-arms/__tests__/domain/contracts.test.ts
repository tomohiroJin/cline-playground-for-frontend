/**
 * DbC アサーション関数のテスト
 */
import { assert, assertRange, assertInteger, assertDefined } from '../../domain/contracts/assertions';

describe('contracts/assertions', () => {
  // ── assert ──────────────────────────────────────────

  describe('assert', () => {
    it('条件が true の場合はエラーを投げない', () => {
      expect(() => assert(true, 'テスト')).not.toThrow();
    });

    it('条件が false の場合は Contract エラーを投げる', () => {
      expect(() => assert(false, 'テスト')).toThrow('[Contract] テスト');
    });

    it('エラーメッセージに [Contract] プレフィックスが付く', () => {
      expect(() => assert(false, '値が不正')).toThrow('[Contract] 値が不正');
    });
  });

  // ── assertRange ─────────────────────────────────────

  describe('assertRange', () => {
    it('値が範囲内の場合はエラーを投げない', () => {
      expect(() => assertRange(5, 0, 10, 'テスト値')).not.toThrow();
    });

    it('最小値と一致する場合はエラーを投げない', () => {
      expect(() => assertRange(0, 0, 10, 'テスト値')).not.toThrow();
    });

    it('最大値と一致する場合はエラーを投げない', () => {
      expect(() => assertRange(10, 0, 10, 'テスト値')).not.toThrow();
    });

    it('値が範囲未満の場合はエラーを投げる', () => {
      expect(() => assertRange(-1, 0, 10, 'HP')).toThrow('[Contract]');
    });

    it('値が範囲超過の場合はエラーを投げる', () => {
      expect(() => assertRange(11, 0, 10, 'HP')).toThrow('[Contract]');
    });

    it('エラーメッセージに変数名と範囲が含まれる', () => {
      expect(() => assertRange(-1, 0, 99, 'HP')).toThrow('HP');
    });
  });

  // ── assertInteger ───────────────────────────────────

  describe('assertInteger', () => {
    it('整数の場合はエラーを投げない', () => {
      expect(() => assertInteger(5, 'カウント')).not.toThrow();
    });

    it('0 は整数として受け入れる', () => {
      expect(() => assertInteger(0, 'カウント')).not.toThrow();
    });

    it('負の整数も受け入れる', () => {
      expect(() => assertInteger(-3, 'カウント')).not.toThrow();
    });

    it('小数の場合はエラーを投げる', () => {
      expect(() => assertInteger(1.5, 'カウント')).toThrow('[Contract]');
    });
  });

  // ── assertDefined ───────────────────────────────────

  describe('assertDefined', () => {
    it('値が定義されている場合はエラーを投げない', () => {
      expect(() => assertDefined(42, 'テスト')).not.toThrow();
    });

    it('空文字列は定義済みとして受け入れる', () => {
      expect(() => assertDefined('', 'テスト')).not.toThrow();
    });

    it('0 は定義済みとして受け入れる', () => {
      expect(() => assertDefined(0, 'テスト')).not.toThrow();
    });

    it('undefined の場合はエラーを投げる', () => {
      expect(() => assertDefined(undefined, 'コンテキスト')).toThrow('[Contract]');
    });

    it('null の場合はエラーを投げる', () => {
      expect(() => assertDefined(null, 'コンテキスト')).toThrow('[Contract]');
    });
  });
});
