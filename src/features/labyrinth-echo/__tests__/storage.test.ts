/**
 * 迷宮の残響 - ストレージのテスト
 */
import { Storage, SAVE_KEY } from '../storage';

describe('迷宮の残響 - ストレージ', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Storage.save - データの保存', () => {
    it('データを渡すとlocalStorageに正しく保存される', async () => {
      // Arrange
      const data = { runs: 5, kp: 10 };

      // Act
      await Storage.save(data);

      // Assert
      const stored = localStorage.getItem(SAVE_KEY);
      expect(JSON.parse(stored!)).toEqual(data);
    });
  });

  describe('Storage.load - データの読み込み', () => {
    it('保存済みデータがある場合に正しく読み込める', async () => {
      // Arrange
      const data = { runs: 3, escapes: 1 };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));

      // Act
      const loaded = await Storage.load();

      // Assert
      expect(loaded).toEqual(data);
    });

    it('データが存在しない場合にnullを返す', async () => {
      // Act
      const loaded = await Storage.load();

      // Assert
      expect(loaded).toBeNull();
    });

    it('不正なJSONが保存されている場合にnullを返す', async () => {
      // Arrange
      localStorage.setItem(SAVE_KEY, '{invalid json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const loaded = await Storage.load();

      // Assert
      expect(loaded).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('SAVE_KEY - セーブキー', () => {
    it('正しいキー名が定義されている', () => {
      // Assert
      expect(SAVE_KEY).toBe('labyrinth-echo-save');
    });
  });

  describe('保存と読み込みの往復', () => {
    it('複雑なデータを保存して正しく復元できる', async () => {
      // Arrange
      const data = {
        runs: 10,
        escapes: 5,
        kp: 25,
        unlocked: ['u1', 'u2'],
        bestFl: 4,
      };

      // Act
      await Storage.save(data);
      const loaded = await Storage.load();

      // Assert
      expect(loaded).toEqual(data);
    });
  });
});
