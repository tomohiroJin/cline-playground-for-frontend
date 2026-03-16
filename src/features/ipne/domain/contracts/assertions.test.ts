/**
 * DbC アサーション関数のテスト
 */
import { require as requireContract, ensure, invariant } from './index';

describe('DbC アサーション関数', () => {
  describe('require（事前条件）', () => {
    it('条件が真の場合はエラーを投げない', () => {
      expect(() => requireContract(true, 'テスト')).not.toThrow();
    });

    it('条件が偽の場合は PreconditionError を投げる', () => {
      expect(() => requireContract(false, 'HPは0より大きい必要があります'))
        .toThrow('事前条件違反: HPは0より大きい必要があります');
    });
  });

  describe('ensure（事後条件）', () => {
    it('条件が真の場合はエラーを投げない', () => {
      expect(() => ensure(true, 'テスト')).not.toThrow();
    });

    it('条件が偽の場合は PostconditionError を投げる', () => {
      expect(() => ensure(false, 'HPが0未満になりました'))
        .toThrow('事後条件違反: HPが0未満になりました');
    });
  });

  describe('invariant（不変条件）', () => {
    it('条件が真の場合はエラーを投げない', () => {
      expect(() => invariant(true, 'テスト')).not.toThrow();
    });

    it('条件が偽の場合は InvariantError を投げる', () => {
      expect(() => invariant(false, '敵HPは0未満にはならない'))
        .toThrow('不変条件違反: 敵HPは0未満にはならない');
    });
  });
});
