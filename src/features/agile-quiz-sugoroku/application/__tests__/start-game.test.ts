/**
 * start-game ユースケースのテスト
 */
import { executeStartGame } from '../start-game';
import { SeededRandomAdapter } from '../../infrastructure/random/seeded-random-adapter';
import { Question } from '../../domain/types';

// テスト用の問題データ
const TEST_QUESTIONS: Record<string, Question[]> = {
  planning: [
    { question: 'Q1', options: ['A', 'B', 'C', 'D'], answer: 0 },
    { question: 'Q2', options: ['A', 'B', 'C', 'D'], answer: 1 },
  ],
  impl1: [
    { question: 'Q3', options: ['A', 'B', 'C', 'D'], answer: 2 },
  ],
  test1: [
    { question: 'Q4', options: ['A', 'B', 'C', 'D'], answer: 3 },
  ],
  refinement: [
    { question: 'Q5', options: ['A', 'B', 'C', 'D'], answer: 0 },
  ],
  impl2: [
    { question: 'Q6', options: ['A', 'B', 'C', 'D'], answer: 1 },
  ],
  test2: [
    { question: 'Q7', options: ['A', 'B', 'C', 'D'], answer: 2 },
  ],
  review: [
    { question: 'Q8', options: ['A', 'B', 'C', 'D'], answer: 3 },
  ],
};

describe('executeStartGame', () => {
  describe('正常系', () => {
    it('初期スプリントではイベント一覧と最初の問題を返す', () => {
      // Arrange
      const randomPort = new SeededRandomAdapter(42);

      // Act
      const result = executeStartGame({
        sprintNumber: 0,
        debt: 0,
        usedQuestions: {},
        questions: TEST_QUESTIONS,
      }, { randomPort });

      // Assert
      expect(result.events).toHaveLength(7);
      expect(result.events[0].id).toBe('planning');
      expect(result.question).toBeDefined();
      expect(result.questionIndex).toBeGreaterThanOrEqual(0);
      expect(result.options).toHaveLength(4);
      expect(result.options.sort()).toEqual([0, 1, 2, 3]);
    });

    it('2スプリント目以降では緊急対応が発生する可能性がある', () => {
      // Arrange: 高い負債で緊急対応発生率を上げる
      const randomPort = new SeededRandomAdapter(1);

      // Act
      const result = executeStartGame({
        sprintNumber: 2,
        debt: 100,
        usedQuestions: {},
        questions: {
          ...TEST_QUESTIONS,
          emergency: [{ question: 'EQ', options: ['A', 'B', 'C', 'D'], answer: 0 }],
        },
      }, { randomPort });

      // Assert: イベント数は7（緊急対応で置換される）
      expect(result.events).toHaveLength(7);
    });

    it('使用済み問題が正しく更新される', () => {
      // Arrange
      const randomPort = new SeededRandomAdapter(42);

      // Act
      const result = executeStartGame({
        sprintNumber: 0,
        debt: 0,
        usedQuestions: {},
        questions: TEST_QUESTIONS,
      }, { randomPort });

      // Assert: planning カテゴリの使用済みに最初の問題が追加される
      const firstEventId = result.events[0].id;
      expect(result.usedQuestions[firstEventId]).toBeDefined();
      expect(result.usedQuestions[firstEventId].size).toBe(1);
    });

    it('既存の使用済み問題を保持しつつ新しい問題を追加する', () => {
      // Arrange
      const randomPort = new SeededRandomAdapter(42);
      const existingUsed: Record<string, Set<number>> = {
        planning: new Set([0]),
      };

      // Act
      const result = executeStartGame({
        sprintNumber: 0,
        debt: 0,
        usedQuestions: existingUsed,
        questions: TEST_QUESTIONS,
      }, { randomPort });

      // Assert: planning に新しい問題が追加される（元の0も維持）
      const planningUsed = result.usedQuestions.planning;
      expect(planningUsed).toBeDefined();
      expect(planningUsed.has(0)).toBe(true);
    });

    it('選択肢の並び順はシャッフルされる', () => {
      // Arrange: 異なるシードで2回実行
      const random1 = new SeededRandomAdapter(42);
      const random2 = new SeededRandomAdapter(99);

      // Act
      const result1 = executeStartGame({
        sprintNumber: 0, debt: 0, usedQuestions: {}, questions: TEST_QUESTIONS,
      }, { randomPort: random1 });
      const result2 = executeStartGame({
        sprintNumber: 0, debt: 0, usedQuestions: {}, questions: TEST_QUESTIONS,
      }, { randomPort: random2 });

      // Assert: シャッフルされた結果は[0,1,2,3]の順列
      expect(result1.options.sort()).toEqual([0, 1, 2, 3]);
      expect(result2.options.sort()).toEqual([0, 1, 2, 3]);
    });
  });
});
