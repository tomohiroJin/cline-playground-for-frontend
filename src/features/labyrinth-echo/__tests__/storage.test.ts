/**
 * 迷宮の残響 - ストレージのテスト
 */
import { Storage, SAVE_KEY } from '../storage';

describe('迷宮の残響 - ストレージ', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Storage.save - データの保存', () => {
    it('データを正しくlocalStorageに保存する', async () => {
      const data = { runs: 5, kp: 10 };
      await Storage.save(data);
      const stored = localStorage.getItem(SAVE_KEY);
      expect(JSON.parse(stored!)).toEqual(data);
    });
  });

  describe('Storage.load - データの読み込み', () => {
    it('保存済みデータを正しく読み込む', async () => {
      const data = { runs: 3, escapes: 1 };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      const loaded = await Storage.load();
      expect(loaded).toEqual(data);
    });

    it('データがない場合はnullを返す', async () => {
      const loaded = await Storage.load();
      expect(loaded).toBeNull();
    });

    it('不正なJSONの場合はnullを返す', async () => {
      localStorage.setItem(SAVE_KEY, '{invalid json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const loaded = await Storage.load();
      expect(loaded).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('SAVE_KEY - セーブキー', () => {
    it('正しいキー名が定義されている', () => {
      expect(SAVE_KEY).toBe('labyrinth-echo-save');
    });
  });

  describe('保存と読み込みの往復', () => {
    it('保存したデータを正しく復元できる', async () => {
      const data = {
        runs: 10,
        escapes: 5,
        kp: 25,
        unlocked: ['u1', 'u2'],
        bestFl: 4,
      };
      await Storage.save(data);
      const loaded = await Storage.load();
      expect(loaded).toEqual(data);
    });
  });
});
