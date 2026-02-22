/**
 * Agile Quiz Sugoroku - ゲーム結果保存テスト
 */
import { SavedGameResult } from '../types';
import { saveGameResult, loadGameResult, clearGameResult } from '../result-storage';

describe('result-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockResult: SavedGameResult = {
    totalCorrect: 15,
    totalQuestions: 21,
    correctRate: 71,
    averageSpeed: 6.5,
    stability: 75,
    debt: 10,
    maxCombo: 4,
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
        tags: ['scrum'],
        explanation: 'テスト解説',
      },
    ],
    sprintLog: [],
    grade: 'A',
    gradeLabel: 'Excellent',
    engineerTypeId: 'stable',
    engineerTypeName: '安定運用型エンジニア',
    timestamp: Date.now(),
  };

  describe('saveGameResult', () => {
    it('ゲーム結果をlocalStorageに保存する', () => {
      saveGameResult(mockResult);
      const stored = localStorage.getItem('aqs_last_result');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.totalCorrect).toBe(15);
      expect(parsed.grade).toBe('A');
    });
  });

  describe('loadGameResult', () => {
    it('保存されたゲーム結果を読み込む', () => {
      saveGameResult(mockResult);
      const result = loadGameResult();
      expect(result).not.toBeNull();
      expect(result!.totalCorrect).toBe(15);
      expect(result!.correctRate).toBe(71);
      expect(result!.engineerTypeName).toBe('安定運用型エンジニア');
    });

    it('保存データがない場合はnullを返す', () => {
      expect(loadGameResult()).toBeNull();
    });

    it('不正なデータの場合はnullを返す', () => {
      localStorage.setItem('aqs_last_result', 'invalid json');
      expect(loadGameResult()).toBeNull();
    });
  });

  describe('clearGameResult', () => {
    it('ゲーム結果を削除する', () => {
      saveGameResult(mockResult);
      expect(loadGameResult()).not.toBeNull();
      clearGameResult();
      expect(loadGameResult()).toBeNull();
    });
  });
});
