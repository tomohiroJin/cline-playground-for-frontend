/**
 * createSprintSummary - スプリント集計のテスト
 */
import { createSprintSummary } from '../sprint';
import { AnswerResult } from '../../types';

describe('createSprintSummary - スプリント集計', () => {
  it('全問正解時の正答率は100%になる', () => {
    // Arrange
    const answers: AnswerResult[] = [
      { correct: true, speed: 3.0, eventId: 'planning' },
      { correct: true, speed: 4.0, eventId: 'impl1' },
      { correct: true, speed: 5.0, eventId: 'test1' },
    ];

    // Act
    const summary = createSprintSummary(answers, 0, 0);

    // Assert
    expect(summary.correctRate).toBe(100);
    expect(summary.correctCount).toBe(3);
    expect(summary.totalCount).toBe(3);
  });

  it('全問不正解時の正答率は0%になる', () => {
    // Arrange
    const answers: AnswerResult[] = [
      { correct: false, speed: 3.0, eventId: 'planning' },
      { correct: false, speed: 4.0, eventId: 'impl1' },
    ];

    // Act
    const summary = createSprintSummary(answers, 0, 0);

    // Assert
    expect(summary.correctRate).toBe(0);
    expect(summary.correctCount).toBe(0);
  });

  it('カテゴリ別の正答数と出題数が正しく集計される', () => {
    // Arrange
    const answers: AnswerResult[] = [
      { correct: true, speed: 3.0, eventId: 'planning' },
      { correct: false, speed: 4.0, eventId: 'planning' },
      { correct: true, speed: 5.0, eventId: 'impl1' },
    ];

    // Act
    const summary = createSprintSummary(answers, 0, 0);

    // Assert
    expect(summary.categoryStats['planning']).toEqual({ correct: 1, total: 2 });
    expect(summary.categoryStats['impl1']).toEqual({ correct: 1, total: 1 });
  });

  it('平均回答速度が正しく計算される', () => {
    // Arrange
    const answers: AnswerResult[] = [
      { correct: true, speed: 2.0, eventId: 'planning' },
      { correct: true, speed: 4.0, eventId: 'impl1' },
    ];

    // Act
    const summary = createSprintSummary(answers, 0, 0);

    // Assert
    expect(summary.averageSpeed).toBe(3.0);
  });

  it('スプリント番号は1始まりで記録される', () => {
    // Arrange
    const answers: AnswerResult[] = [{ correct: true, speed: 3.0, eventId: 'planning' }];

    // Act
    const summary = createSprintSummary(answers, 0, 0);

    // Assert
    expect(summary.sprintNumber).toBe(1);
  });

  it('緊急対応の有無と成功数が正しく記録される', () => {
    // Arrange
    const answers: AnswerResult[] = [
      { correct: true, speed: 3.0, eventId: 'emergency' },
      { correct: false, speed: 4.0, eventId: 'emergency' },
      { correct: true, speed: 5.0, eventId: 'planning' },
    ];

    // Act
    const summary = createSprintSummary(answers, 0, 10);

    // Assert
    expect(summary.hadEmergency).toBe(true);
    expect(summary.emergencySuccessCount).toBe(1);
    expect(summary.debt).toBe(10);
  });

  it('緊急対応がない場合はhadEmergency=false, emergencySuccessCount=0', () => {
    // Arrange
    const answers: AnswerResult[] = [
      { correct: true, speed: 3.0, eventId: 'planning' },
    ];

    // Act
    const summary = createSprintSummary(answers, 0, 0);

    // Assert
    expect(summary.hadEmergency).toBe(false);
    expect(summary.emergencySuccessCount).toBe(0);
  });
});
