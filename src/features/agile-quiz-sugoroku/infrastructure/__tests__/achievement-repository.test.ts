/**
 * AchievementRepository テスト
 */
import { InMemoryStorageAdapter } from '../storage/in-memory-storage-adapter';
import { AchievementRepository } from '../storage/achievement-repository';

describe('AchievementRepository', () => {
  let storage: InMemoryStorageAdapter;
  let repository: AchievementRepository;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    repository = new AchievementRepository(storage);
  });

  describe('loadProgress', () => {
    it('データがない場合はデフォルト値を返す', () => {
      // Act
      const progress = repository.loadProgress();

      // Assert
      expect(progress).toEqual({ unlocked: {} });
    });
  });

  describe('saveUnlock', () => {
    it('実績をアンロックして保存する', () => {
      // Act
      repository.saveUnlock('first_win', 1000);

      // Assert
      const progress = repository.loadProgress();
      expect(progress.unlocked['first_win']).toBe(1000);
    });

    it('既にアンロック済みの実績は上書きしない', () => {
      // Arrange
      repository.saveUnlock('first_win', 1000);

      // Act
      repository.saveUnlock('first_win', 2000);

      // Assert
      const progress = repository.loadProgress();
      expect(progress.unlocked['first_win']).toBe(1000);
    });

    it('複数の実績をアンロックできる', () => {
      // Act
      repository.saveUnlock('first_win', 1000);
      repository.saveUnlock('combo_master', 2000);

      // Assert
      const ids = repository.getUnlockedIds();
      expect(ids).toContain('first_win');
      expect(ids).toContain('combo_master');
    });
  });

  describe('getUnlockedIds', () => {
    it('アンロック済みの実績IDリストを返す', () => {
      // Arrange
      repository.saveUnlock('a', 1);
      repository.saveUnlock('b', 2);

      // Act
      const ids = repository.getUnlockedIds();

      // Assert
      expect(ids).toHaveLength(2);
      expect(ids).toContain('a');
      expect(ids).toContain('b');
    });

    it('データがない場合は空配列を返す', () => {
      // Act & Assert
      expect(repository.getUnlockedIds()).toEqual([]);
    });
  });

  describe('clear', () => {
    it('実績進捗を全て削除する', () => {
      // Arrange
      repository.saveUnlock('first_win', 1000);

      // Act
      repository.clear();

      // Assert
      expect(repository.loadProgress()).toEqual({ unlocked: {} });
    });
  });
});
