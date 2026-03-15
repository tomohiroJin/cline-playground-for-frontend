/**
 * HistoryRepository テスト
 */
import { GameHistoryEntry, SavedGameResult } from '../../domain/types';
import { InMemoryStorageAdapter } from '../storage/in-memory-storage-adapter';
import { HistoryRepository, MAX_HISTORY_COUNT } from '../storage/history-repository';

describe('HistoryRepository', () => {
  let storage: InMemoryStorageAdapter;
  let repository: HistoryRepository;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    repository = new HistoryRepository(storage);
  });

  const createEntry = (timestamp: number): GameHistoryEntry => ({
    totalCorrect: 10,
    totalQuestions: 20,
    correctRate: 50,
    averageSpeed: 7,
    stability: 50,
    debt: 20,
    maxCombo: 3,
    grade: 'C',
    gradeLabel: 'Developing',
    teamTypeId: 'forming',
    teamTypeName: '結成したてのチーム',
    timestamp,
  });

  describe('loadAll / save', () => {
    it('履歴を保存して読み込める', () => {
      // Arrange
      const entry = createEntry(1000);

      // Act
      repository.save(entry);
      const history = repository.loadAll();

      // Assert
      expect(history).toHaveLength(1);
      expect(history[0].timestamp).toBe(1000);
    });

    it('履歴が空の場合は空配列を返す', () => {
      // Act & Assert
      expect(repository.loadAll()).toEqual([]);
    });

    it('最大件数を超えたら古いものを削除する', () => {
      // Arrange: MAX_HISTORY_COUNT + 1 件保存
      for (let i = 0; i <= MAX_HISTORY_COUNT; i++) {
        repository.save(createEntry(i));
      }

      // Act
      const history = repository.loadAll();

      // Assert
      expect(history).toHaveLength(MAX_HISTORY_COUNT);
      // 最初のエントリ（timestamp: 0）は削除されている
      expect(history[0].timestamp).toBe(1);
    });
  });

  describe('toHistoryEntry', () => {
    it('SavedGameResult から GameHistoryEntry に変換する', () => {
      // Arrange
      const result: SavedGameResult = {
        totalCorrect: 15, totalQuestions: 21, correctRate: 71,
        averageSpeed: 6.5, stability: 75, debt: 10, maxCombo: 4,
        tagStats: {}, incorrectQuestions: [], sprintLog: [],
        grade: 'A', gradeLabel: 'High-Performing',
        teamTypeId: 'synergy', teamTypeName: 'シナジーチーム',
        timestamp: 12345,
      };

      // Act
      const entry = HistoryRepository.toHistoryEntry(result);

      // Assert
      expect(entry.totalCorrect).toBe(15);
      expect(entry.grade).toBe('A');
      expect(entry.teamTypeId).toBe('synergy');
      expect(entry).not.toHaveProperty('tagStats');
      expect(entry).not.toHaveProperty('incorrectQuestions');
    });
  });

  describe('clear', () => {
    it('履歴を全て削除する', () => {
      // Arrange
      repository.save(createEntry(1000));

      // Act
      repository.clear();

      // Assert
      expect(repository.loadAll()).toEqual([]);
    });
  });

  describe('migrateLastResultToHistory', () => {
    it('履歴が空で aqs_last_result が存在する場合に移行する', () => {
      // Arrange
      const lastResult: SavedGameResult = {
        totalCorrect: 10, totalQuestions: 20, correctRate: 50,
        averageSpeed: 7, stability: 50, debt: 20, maxCombo: 3,
        tagStats: {}, incorrectQuestions: [], sprintLog: [],
        grade: 'C', gradeLabel: 'Developing',
        teamTypeId: 'forming', teamTypeName: '結成したてのチーム',
        timestamp: 5000,
      };
      storage.set('aqs_last_result', lastResult);

      // Act
      repository.migrateLastResultToHistory();

      // Assert
      const history = repository.loadAll();
      expect(history).toHaveLength(1);
      expect(history[0].timestamp).toBe(5000);
    });

    it('履歴が既にある場合はマイグレーションしない', () => {
      // Arrange
      repository.save(createEntry(1000));
      storage.set('aqs_last_result', { timestamp: 2000 });

      // Act
      repository.migrateLastResultToHistory();

      // Assert
      expect(repository.loadAll()).toHaveLength(1);
      expect(repository.loadAll()[0].timestamp).toBe(1000);
    });
  });
});
