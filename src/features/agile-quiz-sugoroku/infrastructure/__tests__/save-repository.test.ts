/**
 * SaveRepository テスト
 */
import { SaveState } from '../../domain/types';
import { InMemoryStorageAdapter } from '../storage/in-memory-storage-adapter';
import { SaveRepository, SAVE_VERSION } from '../storage/save-repository';

describe('SaveRepository', () => {
  let storage: InMemoryStorageAdapter;
  let repository: SaveRepository;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    repository = new SaveRepository(storage);
  });

  const mockSaveState: SaveState = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    sprintCount: 5,
    currentSprint: 2,
    stats: {
      totalCorrect: 10,
      totalQuestions: 14,
      speeds: [3, 4, 5],
      debt: 8,
      emergencyCount: 1,
      emergencySuccess: 1,
      combo: 0,
      maxCombo: 3,
    },
    log: [],
    usedQuestions: {},
    tagStats: {},
    incorrectQuestions: [],
  };

  describe('save / load', () => {
    it('ゲーム状態を保存して読み込める', () => {
      // Act
      repository.save(mockSaveState);
      const loaded = repository.load();

      // Assert
      expect(loaded).toBeDefined();
      expect(loaded!.sprintCount).toBe(5);
      expect(loaded!.currentSprint).toBe(2);
    });

    it('データが存在しない場合は undefined を返す', () => {
      // Act & Assert
      expect(repository.load()).toBeUndefined();
    });

    it('バージョンが不一致の場合は undefined を返しデータを削除する', () => {
      // Arrange
      const oldVersion = { ...mockSaveState, version: 999 };
      storage.set('aqs_save_state', oldVersion);

      // Act
      const loaded = repository.load();

      // Assert
      expect(loaded).toBeUndefined();
      expect(storage.get('aqs_save_state')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('セーブデータを削除する', () => {
      // Arrange
      repository.save(mockSaveState);

      // Act
      repository.delete();

      // Assert
      expect(repository.load()).toBeUndefined();
    });
  });

  describe('exists', () => {
    it('セーブデータが存在する場合は true を返す', () => {
      // Arrange
      repository.save(mockSaveState);

      // Act & Assert
      expect(repository.exists()).toBe(true);
    });

    it('セーブデータが存在しない場合は false を返す', () => {
      // Act & Assert
      expect(repository.exists()).toBe(false);
    });
  });

  describe('破損データの処理', () => {
    it('get が undefined を返すが has が true のとき、データを削除する', () => {
      // Arrange: get では取得できないが has では存在するデータを模擬
      const corruptStorage = new InMemoryStorageAdapter();
      // 直接内部ストアに不正値を仕込む代わりに、get をオーバーライド
      const originalGet = corruptStorage.get.bind(corruptStorage);
      corruptStorage.set('aqs_save_state', 'corrupt' as unknown);
      corruptStorage.get = <T>(key: string): T | undefined => {
        if (key === 'aqs_save_state') return undefined; // パース失敗を模擬
        return originalGet(key);
      };
      const repo = new SaveRepository(corruptStorage);

      // Act
      const loaded = repo.load();

      // Assert
      expect(loaded).toBeUndefined();
      expect(corruptStorage.has('aqs_save_state')).toBe(false);
    });
  });

  describe('データ整合性', () => {
    it('保存→読み込みでデータが完全に一致する', () => {
      // Act
      repository.save(mockSaveState);
      const loaded = repository.load()!;

      // Assert
      expect(loaded.version).toBe(mockSaveState.version);
      expect(loaded.timestamp).toBe(mockSaveState.timestamp);
      expect(loaded.stats).toEqual(mockSaveState.stats);
    });
  });
});
