/**
 * DailyQuizRepository テスト
 */
import { InMemoryStorageAdapter } from '../storage/in-memory-storage-adapter';
import { DailyQuizRepository, DailyResult } from '../storage/daily-quiz-repository';

describe('DailyQuizRepository', () => {
  let storage: InMemoryStorageAdapter;
  let repository: DailyQuizRepository;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    repository = new DailyQuizRepository(storage);
  });

  describe('saveResult / getResult', () => {
    it('結果を保存して取得できる', () => {
      // Arrange
      const result: DailyResult = {
        dateKey: '2026-03-07',
        correctCount: 4,
        totalCount: 5,
        timestamp: Date.now(),
      };

      // Act
      repository.saveResult(result);
      const loaded = repository.getResult('2026-03-07');

      // Assert
      expect(loaded).toEqual(result);
    });

    it('存在しない日付は undefined を返す', () => {
      // Act & Assert
      expect(repository.getResult('2026-01-01')).toBeUndefined();
    });

    it('複数日付のデータを独立して保存できる', () => {
      // Arrange
      const r1: DailyResult = { dateKey: '2026-03-07', correctCount: 3, totalCount: 5, timestamp: 1 };
      const r2: DailyResult = { dateKey: '2026-03-08', correctCount: 5, totalCount: 5, timestamp: 2 };

      // Act
      repository.saveResult(r1);
      repository.saveResult(r2);

      // Assert
      expect(repository.getResult('2026-03-07')!.correctCount).toBe(3);
      expect(repository.getResult('2026-03-08')!.correctCount).toBe(5);
    });
  });

  describe('getStreak', () => {
    it('連続参加日数を正しく計算する', () => {
      // Arrange
      const base: Omit<DailyResult, 'dateKey'> = { correctCount: 3, totalCount: 5, timestamp: 0 };
      repository.saveResult({ ...base, dateKey: '2026-03-05' });
      repository.saveResult({ ...base, dateKey: '2026-03-06' });
      repository.saveResult({ ...base, dateKey: '2026-03-07' });

      // Act
      const streak = repository.getStreak(new Date('2026-03-07'));

      // Assert
      expect(streak).toBe(3);
    });

    it('途切れた場合は途切れた以降の日数を返す', () => {
      // Arrange
      const base: Omit<DailyResult, 'dateKey'> = { correctCount: 3, totalCount: 5, timestamp: 0 };
      repository.saveResult({ ...base, dateKey: '2026-03-04' });
      // 03-05 は欠落
      repository.saveResult({ ...base, dateKey: '2026-03-06' });
      repository.saveResult({ ...base, dateKey: '2026-03-07' });

      // Act & Assert
      expect(repository.getStreak(new Date('2026-03-07'))).toBe(2);
    });

    it('当日の結果がない場合は 0 を返す', () => {
      // Act & Assert
      expect(repository.getStreak(new Date('2026-03-07'))).toBe(0);
    });
  });
});
