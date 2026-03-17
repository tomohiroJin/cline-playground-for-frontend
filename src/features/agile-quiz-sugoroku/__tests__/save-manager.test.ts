/**
 * セーブリポジトリのテスト
 */
import { SaveState } from '../domain/types';
import { SaveRepository } from '../infrastructure/storage/save-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';

const SAVE_KEY = 'aqs_save_state';

describe('SaveRepository', () => {
  let repository: SaveRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new SaveRepository(new LocalStorageAdapter());
  });

  const mockSaveState: SaveState = {
    version: 1,
    timestamp: Date.now(),
    sprintCount: 5,
    currentSprint: 2,
    stats: {
      totalCorrect: 10,
      totalQuestions: 14,
      speeds: [3, 4, 5, 6, 3, 4, 5, 6, 3, 4, 5, 6, 3, 4],
      debt: 8,
      emergencyCount: 1,
      emergencySuccess: 1,
      combo: 0,
      maxCombo: 3,
    },
    log: [
      {
        sprintNumber: 0,
        correctRate: 71,
        correctCount: 5,
        totalCount: 7,
        averageSpeed: 4.3,
        debt: 5,
        hadEmergency: false,
        emergencySuccessCount: 0,
        categoryStats: { planning: { correct: 1, total: 1 } },
      },
      {
        sprintNumber: 1,
        correctRate: 71,
        correctCount: 5,
        totalCount: 7,
        averageSpeed: 4.5,
        debt: 8,
        hadEmergency: true,
        emergencySuccessCount: 1,
        categoryStats: { impl1: { correct: 1, total: 1 } },
      },
    ],
    usedQuestions: {
      planning: [0, 2, 5],
      impl1: [1, 3],
    },
    tagStats: {
      scrum: { correct: 5, total: 7 },
      testing: { correct: 3, total: 5 },
    },
    incorrectQuestions: [
      {
        questionText: 'テスト問題',
        options: ['A', 'B', 'C', 'D'],
        selectedAnswer: 1,
        correctAnswer: 0,
        correct: false,
        tags: ['scrum'],
        explanation: 'テスト解説',
        eventId: 'planning',
      },
    ],
  };

  // ── 正常系 ──────────────────────────────

  describe('save', () => {
    it('ゲーム状態をlocalStorageに保存する', () => {
      repository.save(mockSaveState);
      const stored = localStorage.getItem(SAVE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(1);
      expect(parsed.sprintCount).toBe(5);
      expect(parsed.currentSprint).toBe(2);
    });
  });

  describe('load', () => {
    it('保存されたゲーム状態を読み込む', () => {
      repository.save(mockSaveState);
      const state = repository.load();
      expect(state).toBeDefined();
      expect(state!.sprintCount).toBe(5);
      expect(state!.currentSprint).toBe(2);
      expect(state!.stats.totalCorrect).toBe(10);
      expect(state!.log).toHaveLength(2);
      expect(state!.usedQuestions.planning).toEqual([0, 2, 5]);
    });

    it('保存データがない場合はundefinedを返す', () => {
      expect(repository.load()).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('セーブデータを削除する', () => {
      repository.save(mockSaveState);
      expect(repository.exists()).toBe(true);
      repository.delete();
      expect(repository.exists()).toBe(false);
      expect(repository.load()).toBeUndefined();
    });
  });

  describe('exists', () => {
    it('セーブデータが存在する場合はtrueを返す', () => {
      repository.save(mockSaveState);
      expect(repository.exists()).toBe(true);
    });

    it('セーブデータが存在しない場合はfalseを返す', () => {
      expect(repository.exists()).toBe(false);
    });
  });

  // ── 異常系 ──────────────────────────────

  describe('異常系', () => {
    it('不正なJSONデータの場合はundefinedを返す', () => {
      localStorage.setItem(SAVE_KEY, 'invalid json data');
      expect(repository.load()).toBeUndefined();
    });

    it('破損データは自動削除される', () => {
      localStorage.setItem(SAVE_KEY, 'corrupt');
      repository.load();
      expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    });

    it('バージョンが不一致の場合はundefinedを返し、データを削除する', () => {
      const oldVersionData = { ...mockSaveState, version: 999 };
      localStorage.setItem(SAVE_KEY, JSON.stringify(oldVersionData));
      expect(repository.load()).toBeUndefined();
      expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    });

    it('localStorage が使用不可でもエラーにならない（save）', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => { throw new Error('QuotaExceeded'); };
      expect(() => repository.save(mockSaveState)).not.toThrow();
      Storage.prototype.setItem = originalSetItem;
    });

    it('localStorage が使用不可でもエラーにならない（load）', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = () => { throw new Error('SecurityError'); };
      expect(repository.load()).toBeUndefined();
      Storage.prototype.getItem = originalGetItem;
    });

    it('localStorage が使用不可でもエラーにならない（exists）', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = () => { throw new Error('SecurityError'); };
      expect(repository.exists()).toBe(false);
      Storage.prototype.getItem = originalGetItem;
    });
  });

  // ── データ整合性 ──────────────────────────────

  describe('データ整合性', () => {
    it('保存→読み込みでデータが完全に一致する', () => {
      repository.save(mockSaveState);
      const loaded = repository.load()!;
      expect(loaded.version).toBe(mockSaveState.version);
      expect(loaded.timestamp).toBe(mockSaveState.timestamp);
      expect(loaded.sprintCount).toBe(mockSaveState.sprintCount);
      expect(loaded.currentSprint).toBe(mockSaveState.currentSprint);
      expect(loaded.stats).toEqual(mockSaveState.stats);
      expect(loaded.log).toEqual(mockSaveState.log);
      expect(loaded.usedQuestions).toEqual(mockSaveState.usedQuestions);
      expect(loaded.tagStats).toEqual(mockSaveState.tagStats);
      expect(loaded.incorrectQuestions).toEqual(mockSaveState.incorrectQuestions);
    });
  });
});
