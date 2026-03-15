/**
 * finish-sprint ユースケースのテスト
 */
import { executeFinishSprint } from '../finish-sprint';
import { AnswerResult } from '../../domain/types';

describe('executeFinishSprint', () => {
  describe('正常系', () => {
    it('スプリント集計が正しく生成される', () => {
      // Arrange
      const answers: AnswerResult[] = [
        { correct: true, speed: 3.0, eventId: 'planning' },
        { correct: true, speed: 5.0, eventId: 'impl1' },
        { correct: false, speed: 8.0, eventId: 'test1' },
        { correct: true, speed: 4.0, eventId: 'refinement' },
      ];

      // Act
      const result = executeFinishSprint({
        sprintAnswers: answers,
        sprintNumber: 0,
        debt: 10,
      });

      // Assert
      expect(result.summary.sprintNumber).toBe(1);
      expect(result.summary.correctCount).toBe(3);
      expect(result.summary.totalCount).toBe(4);
      expect(result.summary.correctRate).toBe(75);
      expect(result.summary.debt).toBe(10);
    });

    it('空の回答リストでも集計が作成される', () => {
      // Arrange & Act
      const result = executeFinishSprint({
        sprintAnswers: [],
        sprintNumber: 2,
        debt: 5,
      });

      // Assert
      expect(result.summary.sprintNumber).toBe(3);
      expect(result.summary.correctCount).toBe(0);
      expect(result.summary.totalCount).toBe(0);
      expect(result.summary.debt).toBe(5);
    });

    it('緊急対応を含むスプリントが正しく集計される', () => {
      // Arrange
      const answers: AnswerResult[] = [
        { correct: true, speed: 3.0, eventId: 'planning' },
        { correct: true, speed: 5.0, eventId: 'emergency' },
        { correct: false, speed: 8.0, eventId: 'emergency' },
      ];

      // Act
      const result = executeFinishSprint({
        sprintAnswers: answers,
        sprintNumber: 1,
        debt: 15,
      });

      // Assert
      expect(result.summary.hadEmergency).toBe(true);
      expect(result.summary.emergencySuccessCount).toBe(1);
    });

    it('カテゴリ別統計が正しく生成される', () => {
      // Arrange
      const answers: AnswerResult[] = [
        { correct: true, speed: 3.0, eventId: 'planning' },
        { correct: false, speed: 5.0, eventId: 'planning' },
        { correct: true, speed: 4.0, eventId: 'impl1' },
      ];

      // Act
      const result = executeFinishSprint({
        sprintAnswers: answers,
        sprintNumber: 0,
        debt: 0,
      });

      // Assert
      expect(result.summary.categoryStats.planning).toEqual({ correct: 1, total: 2 });
      expect(result.summary.categoryStats.impl1).toEqual({ correct: 1, total: 1 });
    });
  });
});
