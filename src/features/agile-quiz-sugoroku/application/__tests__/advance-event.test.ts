/**
 * advance-event ユースケースのテスト
 */
import { executeAdvanceEvent } from '../advance-event';
import { SeededRandomAdapter } from '../../infrastructure/random/seeded-random-adapter';
import { Question } from '../../domain/types';
import { EVENTS } from '../../constants';

// テスト用の問題データ
const TEST_QUESTIONS: Record<string, Question[]> = {
  planning: [
    { question: 'Q1', options: ['A', 'B', 'C', 'D'], answer: 0 },
  ],
  impl1: [
    { question: 'Q2', options: ['A', 'B', 'C', 'D'], answer: 1 },
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

describe('executeAdvanceEvent', () => {
  describe('正常系', () => {
    it('次のイベントに進めた場合に問題が返る', () => {
      // Arrange
      const randomPort = new SeededRandomAdapter(42);

      // Act
      const result = executeAdvanceEvent({
        events: [...EVENTS],
        eventIndex: 0,
        usedQuestions: {},
        questions: TEST_QUESTIONS,
      }, { randomPort });

      // Assert
      expect(result.hasNext).toBe(true);
      expect(result.nextEventIndex).toBe(1);
      expect(result.question).toBeDefined();
      expect(result.options).toHaveLength(4);
    });

    it('最後のイベントの場合は hasNext が false になる', () => {
      // Arrange
      const randomPort = new SeededRandomAdapter(42);
      const events = [...EVENTS];

      // Act
      const result = executeAdvanceEvent({
        events,
        eventIndex: events.length - 1,
        usedQuestions: {},
        questions: TEST_QUESTIONS,
      }, { randomPort });

      // Assert
      expect(result.hasNext).toBe(false);
      expect(result.nextEventIndex).toBe(events.length);
      expect(result.question).toBeUndefined();
      expect(result.options).toBeUndefined();
    });

    it('使用済み問題が正しく更新される', () => {
      // Arrange
      const randomPort = new SeededRandomAdapter(42);

      // Act
      const result = executeAdvanceEvent({
        events: [...EVENTS],
        eventIndex: 0,
        usedQuestions: {},
        questions: TEST_QUESTIONS,
      }, { randomPort });

      // Assert: impl1（2番目のイベント）に使用済みが記録される
      expect(result.usedQuestions.impl1).toBeDefined();
      expect(result.usedQuestions.impl1.size).toBe(1);
    });

    it('既存の使用済み問題を保持する', () => {
      // Arrange
      const randomPort = new SeededRandomAdapter(42);
      const existing: Record<string, Set<number>> = {
        planning: new Set([0]),
      };

      // Act
      const result = executeAdvanceEvent({
        events: [...EVENTS],
        eventIndex: 0,
        usedQuestions: existing,
        questions: TEST_QUESTIONS,
      }, { randomPort });

      // Assert
      expect(result.usedQuestions.planning).toBeDefined();
      expect(result.usedQuestions.planning.has(0)).toBe(true);
    });
  });
});
