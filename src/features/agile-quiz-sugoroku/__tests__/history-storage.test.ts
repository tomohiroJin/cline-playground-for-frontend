/**
 * 履歴ストレージ - 単体テスト
 */
import {
  saveHistory,
  loadHistory,
  clearHistory,
  MAX_HISTORY_COUNT,
  migrateLastResultToHistory,
} from '../history-storage';
import { GameHistoryEntry, SavedGameResult } from '../types';

/** テスト用の履歴エントリ生成 */
const makeEntry = (overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry => ({
  totalCorrect: 15,
  totalQuestions: 21,
  correctRate: 71,
  averageSpeed: 6.5,
  stability: 75,
  debt: 10,
  maxCombo: 4,
  grade: 'A',
  gradeLabel: 'High-Performing',
  teamTypeId: 'synergy',
  teamTypeName: 'シナジーチーム',
  timestamp: Date.now(),
  ...overrides,
});

describe('history-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadHistory', () => {
    it('初期状態では空配列を返す', () => {
      expect(loadHistory()).toEqual([]);
    });

    it('不正なデータの場合は空配列を返す', () => {
      localStorage.setItem('aqs_history', 'invalid');
      expect(loadHistory()).toEqual([]);
    });
  });

  describe('saveHistory', () => {
    it('履歴エントリを追加できる', () => {
      const entry = makeEntry();
      saveHistory(entry);
      const history = loadHistory();
      expect(history).toHaveLength(1);
      expect(history[0].correctRate).toBe(71);
    });

    it('複数エントリを蓄積できる', () => {
      saveHistory(makeEntry({ timestamp: 1000 }));
      saveHistory(makeEntry({ timestamp: 2000 }));
      saveHistory(makeEntry({ timestamp: 3000 }));
      expect(loadHistory()).toHaveLength(3);
    });

    it('最大件数を超えると古いものから削除される', () => {
      for (let i = 0; i < MAX_HISTORY_COUNT + 3; i++) {
        saveHistory(makeEntry({ timestamp: i * 1000, correctRate: i }));
      }
      const history = loadHistory();
      expect(history).toHaveLength(MAX_HISTORY_COUNT);
      // 最も古い3件が削除されている
      expect(history[0].correctRate).toBe(3);
    });

    it('新しいエントリが末尾に追加される', () => {
      saveHistory(makeEntry({ timestamp: 1000 }));
      saveHistory(makeEntry({ timestamp: 2000 }));
      const history = loadHistory();
      expect(history[0].timestamp).toBe(1000);
      expect(history[1].timestamp).toBe(2000);
    });
  });

  describe('clearHistory', () => {
    it('履歴を削除する', () => {
      saveHistory(makeEntry());
      clearHistory();
      expect(loadHistory()).toEqual([]);
    });
  });

  describe('migrateLastResultToHistory', () => {
    it('aqs_last_resultが存在する場合、履歴に移行する', () => {
      const lastResult: SavedGameResult = {
        totalCorrect: 15,
        totalQuestions: 21,
        correctRate: 71,
        averageSpeed: 6.5,
        stability: 75,
        debt: 10,
        maxCombo: 4,
        tagStats: {},
        incorrectQuestions: [],
        sprintLog: [],
        grade: 'A',
        gradeLabel: 'High-Performing',
        teamTypeId: 'synergy',
        teamTypeName: 'シナジーチーム',
        timestamp: 1000,
      };
      localStorage.setItem('aqs_last_result', JSON.stringify(lastResult));

      migrateLastResultToHistory();
      const history = loadHistory();
      expect(history).toHaveLength(1);
      expect(history[0].correctRate).toBe(71);
      expect(history[0].teamTypeId).toBe('synergy');
    });

    it('aqs_last_resultが存在しない場合は何もしない', () => {
      migrateLastResultToHistory();
      expect(loadHistory()).toEqual([]);
    });

    it('すでに履歴がある場合は移行しない', () => {
      saveHistory(makeEntry());
      localStorage.setItem('aqs_last_result', JSON.stringify({
        totalCorrect: 10, totalQuestions: 20, correctRate: 50,
        averageSpeed: 7, stability: 50, debt: 20, maxCombo: 3,
        tagStats: {}, incorrectQuestions: [], sprintLog: [],
        grade: 'C', gradeLabel: 'Developing',
        teamTypeId: 'forming', teamTypeName: '結成したてのチーム',
        timestamp: 2000,
      }));
      migrateLastResultToHistory();
      // 既存の1件のみ
      expect(loadHistory()).toHaveLength(1);
    });
  });
});
