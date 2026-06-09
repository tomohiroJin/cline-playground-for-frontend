/**
 * localStorage アダプタのテスト
 *
 * フォールバック分岐（null / パースエラー / 型不一致 / バリデータ）と
 * 書き込み失敗時の例外処理を検証する。
 */
import { readLocalStorage, writeLocalStorage } from './local-storage-adapter';

describe('local-storage-adapter', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('readLocalStorage', () => {
    it('キーが存在しない場合はフォールバックを返す', () => {
      expect(readLocalStorage('missing', [])).toEqual([]);
      expect(readLocalStorage('missing', 0)).toBe(0);
    });

    it('保存された値をパースして返す', () => {
      localStorage.setItem('k', JSON.stringify([1, 2, 3]));
      expect(readLocalStorage<number[]>('k', [])).toEqual([1, 2, 3]);
    });

    it('JSON パースに失敗した場合はフォールバックを返しエラーを記録する', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorage.setItem('k', 'invalid-json');

      expect(readLocalStorage('k', [])).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('配列フォールバックに対して非配列が保存されている場合はフォールバックを返す', () => {
      localStorage.setItem('k', JSON.stringify({ not: 'array' }));
      expect(readLocalStorage<number[]>('k', [])).toEqual([]);
    });

    it('バリデータが false を返す場合はフォールバックを返す', () => {
      localStorage.setItem('k', JSON.stringify({ a: 1 }));
      const validator = (v: unknown): v is { ok: boolean } =>
        typeof v === 'object' && v !== null && 'ok' in v;
      expect(readLocalStorage('k', { ok: false }, validator)).toEqual({ ok: false });
    });
  });

  describe('writeLocalStorage', () => {
    it('値を JSON 化して保存する', () => {
      writeLocalStorage('k', { a: 1 });
      expect(localStorage.getItem('k')).toBe(JSON.stringify({ a: 1 }));
    });

    it('書き込みに失敗してもエラーを投げずに記録する', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('quota exceeded');
      });

      expect(() => writeLocalStorage('k', { a: 1 })).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
