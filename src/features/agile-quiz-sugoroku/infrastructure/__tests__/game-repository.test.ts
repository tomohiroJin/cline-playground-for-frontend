/**
 * GameResultRepository テスト
 *
 * InMemoryStorageAdapter を使用して、ゲーム結果の保存・読込・マイグレーションを検証する。
 */
import { SavedGameResult } from '../../domain/types';
import { InMemoryStorageAdapter } from '../storage/in-memory-storage-adapter';
import { GameResultRepository } from '../storage/game-repository';

describe('GameResultRepository', () => {
  let storage: InMemoryStorageAdapter;
  let repository: GameResultRepository;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    repository = new GameResultRepository(storage);
  });

  const mockResult: SavedGameResult = {
    totalCorrect: 15,
    totalQuestions: 21,
    correctRate: 71,
    averageSpeed: 6.5,
    stability: 75,
    debt: 10,
    maxCombo: 4,
    tagStats: { scrum: { correct: 5, total: 7 } },
    incorrectQuestions: [],
    sprintLog: [],
    grade: 'A',
    gradeLabel: 'High-Performing',
    teamTypeId: 'synergy',
    teamTypeName: 'シナジーチーム',
    timestamp: Date.now(),
  };

  describe('save / load', () => {
    it('結果を保存して読み込める', () => {
      // Act
      repository.save(mockResult);
      const loaded = repository.load();

      // Assert
      expect(loaded).toBeDefined();
      expect(loaded!.totalCorrect).toBe(15);
      expect(loaded!.grade).toBe('A');
      expect(loaded!.teamTypeId).toBe('synergy');
    });

    it('データが存在しない場合は undefined を返す', () => {
      // Act & Assert
      expect(repository.load()).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('保存した結果を削除できる', () => {
      // Arrange
      repository.save(mockResult);

      // Act
      repository.clear();

      // Assert
      expect(repository.load()).toBeUndefined();
    });
  });

  describe('後方互換性: 旧エンジニアタイプデータのマイグレーション', () => {
    it('engineerTypeId を teamTypeId に変換する', () => {
      // Arrange: 旧フォーマットを直接ストレージに書き込む
      const oldData = {
        totalCorrect: 10, totalQuestions: 20, correctRate: 50,
        averageSpeed: 7, stability: 50, debt: 20, maxCombo: 3,
        tagStats: {}, incorrectQuestions: [], sprintLog: [],
        grade: 'C', gradeLabel: 'Developing',
        engineerTypeId: 'stable', engineerTypeName: '安定運用型エンジニア',
        timestamp: Date.now(),
      };
      storage.set('aqs_last_result', oldData);

      // Act
      const result = repository.load();

      // Assert
      expect(result!.teamTypeId).toBe('synergy');
      expect(result!.teamTypeName).toBe('シナジーチーム');
    });

    it('不明な旧タイプ ID は forming にフォールバック', () => {
      // Arrange
      const oldData = {
        totalCorrect: 10, totalQuestions: 20, correctRate: 50,
        averageSpeed: 7, stability: 50, debt: 20, maxCombo: 3,
        tagStats: {}, incorrectQuestions: [], sprintLog: [],
        grade: 'C', gradeLabel: 'Average',
        engineerTypeId: 'unknown', engineerTypeName: '不明',
        timestamp: Date.now(),
      };
      storage.set('aqs_last_result', oldData);

      // Act
      const result = repository.load();

      // Assert
      expect(result!.teamTypeId).toBe('forming');
      expect(result!.teamTypeName).toBe('結成したてのチーム');
    });

    it('新フォーマットのデータはそのまま読み込む', () => {
      // Arrange
      repository.save(mockResult);

      // Act
      const result = repository.load();

      // Assert
      expect(result!.teamTypeId).toBe('synergy');
    });
  });
});
