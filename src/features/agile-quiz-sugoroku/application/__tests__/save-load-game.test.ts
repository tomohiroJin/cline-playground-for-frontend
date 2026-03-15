/**
 * save-load-game ユースケースのテスト
 */
import { executeSaveGame, executeLoadGame, executeBuildSaveState } from '../save-load-game';
import { InMemoryStorageAdapter } from '../../infrastructure/storage/in-memory-storage-adapter';
import { SaveRepository } from '../../infrastructure/storage/save-repository';
import { INITIAL_GAME_STATS } from '../../constants';
import { SaveState } from '../../domain/types';

/** テスト用のセーブデータを生成する */
function createTestSaveState(overrides?: Partial<SaveState>): SaveState {
  return {
    version: 1,
    timestamp: Date.now(),
    sprintCount: 3,
    currentSprint: 2,
    stats: { ...INITIAL_GAME_STATS, totalCorrect: 5, totalQuestions: 7 },
    log: [],
    usedQuestions: { planning: [0, 1] },
    tagStats: { scrum: { correct: 3, total: 5 } },
    incorrectQuestions: [],
    ...overrides,
  };
}

describe('save-load-game ユースケース', () => {
  let storage: InMemoryStorageAdapter;
  let saveRepository: SaveRepository;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    saveRepository = new SaveRepository(storage);
  });

  describe('executeSaveGame', () => {
    it('セーブデータが保存される', () => {
      // Arrange
      const saveState = createTestSaveState();

      // Act
      executeSaveGame(saveState, { saveRepository });

      // Assert
      const loaded = saveRepository.load();
      expect(loaded).toBeDefined();
      expect(loaded!.stats.totalCorrect).toBe(5);
    });
  });

  describe('executeLoadGame', () => {
    it('セーブデータが正しく読み込まれる（Set 変換含む）', () => {
      // Arrange
      const saveState = createTestSaveState({
        usedQuestions: { planning: [0, 1], impl1: [2] },
      });
      saveRepository.save(saveState);

      // Act
      const result = executeLoadGame({ saveRepository });

      // Assert
      expect(result).toBeDefined();
      expect(result!.saveState.stats.totalCorrect).toBe(5);
      expect(result!.usedQuestionsAsSet.planning).toBeInstanceOf(Set);
      expect(result!.usedQuestionsAsSet.planning.has(0)).toBe(true);
      expect(result!.usedQuestionsAsSet.planning.has(1)).toBe(true);
      expect(result!.usedQuestionsAsSet.impl1.has(2)).toBe(true);
    });

    it('セーブデータがない場合は undefined を返す', () => {
      // Act
      const result = executeLoadGame({ saveRepository });

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('executeBuildSaveState', () => {
    it('現在の状態からセーブデータを構築する（Set → 配列変換含む）', () => {
      // Arrange
      const usedQuestions: Record<string, Set<number>> = {
        planning: new Set([0, 1]),
        impl1: new Set([2]),
      };

      // Act
      const result = executeBuildSaveState({
        sprintCount: 3,
        currentSprint: 2,
        stats: { ...INITIAL_GAME_STATS, totalCorrect: 5 },
        log: [],
        usedQuestions,
        tagStats: { scrum: { correct: 3, total: 5 } },
        incorrectQuestions: [],
      });

      // Assert
      expect(result.version).toBe(1);
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.sprintCount).toBe(3);
      expect(result.currentSprint).toBe(2);
      expect(result.usedQuestions.planning).toEqual([0, 1]);
      expect(result.usedQuestions.impl1).toEqual([2]);
    });
  });

  describe('セーブ → ロードの往復', () => {
    it('保存したデータが正しく復元される', () => {
      // Arrange
      const usedQuestions: Record<string, Set<number>> = {
        planning: new Set([0, 1, 2]),
      };
      const originalState = executeBuildSaveState({
        sprintCount: 5,
        currentSprint: 3,
        stats: { ...INITIAL_GAME_STATS, totalCorrect: 10, totalQuestions: 15 },
        log: [{
          sprintNumber: 1, correctRate: 80, correctCount: 4, totalCount: 5,
          averageSpeed: 4.0, debt: 5, hadEmergency: false,
          emergencySuccessCount: 0, categoryStats: {},
        }],
        usedQuestions,
        tagStats: { scrum: { correct: 5, total: 8 } },
        incorrectQuestions: [],
      });

      // Act
      executeSaveGame(originalState, { saveRepository });
      const loaded = executeLoadGame({ saveRepository });

      // Assert
      expect(loaded).toBeDefined();
      expect(loaded!.saveState.sprintCount).toBe(5);
      expect(loaded!.saveState.stats.totalCorrect).toBe(10);
      expect(loaded!.usedQuestionsAsSet.planning).toBeInstanceOf(Set);
      expect(loaded!.usedQuestionsAsSet.planning.size).toBe(3);
    });
  });
});
