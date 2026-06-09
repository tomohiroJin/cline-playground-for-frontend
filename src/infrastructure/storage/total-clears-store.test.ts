/**
 * 累計クリア数ストアのテスト
 *
 * 空・正常値・破損値（NaN ガード）の取得と、インクリメントの永続化を検証する。
 */
import { LocalTotalClearsStorage } from './total-clears-store';

describe('LocalTotalClearsStorage', () => {
  let store: LocalTotalClearsStorage;

  beforeEach(() => {
    localStorage.clear();
    store = new LocalTotalClearsStorage();
  });

  describe('get', () => {
    it('未保存の場合は 0 を返す', () => {
      expect(store.get()).toBe(0);
    });

    it('保存された数値を返す', () => {
      localStorage.setItem('puzzle_total_clears', '42');
      expect(store.get()).toBe(42);
    });

    it('破損した値（数値化できない）の場合は 0 を返す', () => {
      localStorage.setItem('puzzle_total_clears', 'not-a-number');
      expect(store.get()).toBe(0);
    });
  });

  describe('increment', () => {
    it('値を 1 増やして永続化し、新しい値を返す', () => {
      expect(store.increment()).toBe(1);
      expect(store.increment()).toBe(2);
      expect(localStorage.getItem('puzzle_total_clears')).toBe('2');
      // 新しいインスタンスでも永続化された値を読める
      expect(new LocalTotalClearsStorage().get()).toBe(2);
    });
  });
});
