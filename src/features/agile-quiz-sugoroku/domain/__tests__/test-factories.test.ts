/**
 * テストファクトリの動作確認テスト
 */
import {
  createQuestion,
  createAnswerResult,
  createGameStats,
  createSprintSummaryData,
  createGameEvent,
  createSavedGameResult,
  createHistoryEntry,
  createAchievementContext,
  createClassifyStats,
  createTagStats,
} from '../testing/test-factories';

describe('テストファクトリ', () => {
  it('createQuestion: デフォルト値で Question を生成する', () => {
    // Arrange & Act
    const q = createQuestion();

    // Assert
    expect(q.question).toBe('テスト問題');
    expect(q.options).toHaveLength(4);
    expect(q.answer).toBe(0);
    expect(q.tags).toEqual(['scrum']);
  });

  it('createQuestion: overrides で値を上書きできる', () => {
    // Arrange & Act
    const q = createQuestion({ answer: 2, tags: ['testing', 'agile'] });

    // Assert
    expect(q.answer).toBe(2);
    expect(q.tags).toEqual(['testing', 'agile']);
  });

  it('createAnswerResult: デフォルト値で AnswerResult を生成する', () => {
    const result = createAnswerResult();
    expect(result.correct).toBe(true);
    expect(result.speed).toBe(5.0);
    expect(result.eventId).toBe('planning');
  });

  it('createGameStats: 初期状態の GameStats を生成する', () => {
    const stats = createGameStats();
    expect(stats.totalCorrect).toBe(0);
    expect(stats.combo).toBe(0);
    expect(stats.debt).toBe(0);
  });

  it('createGameStats: overrides で部分的に上書きできる', () => {
    const stats = createGameStats({ debt: 30, combo: 5 });
    expect(stats.debt).toBe(30);
    expect(stats.combo).toBe(5);
    expect(stats.totalCorrect).toBe(0);
  });

  it('createSprintSummaryData: デフォルト値で SprintSummary を生成する', () => {
    const summary = createSprintSummaryData();
    expect(summary.sprintNumber).toBe(1);
    expect(summary.correctRate).toBe(70);
  });

  it('createGameEvent: デフォルト値で GameEvent を生成する', () => {
    const event = createGameEvent();
    expect(event.id).toBe('planning');
    expect(event.name).toBe('計画');
  });

  it('createSavedGameResult: デフォルト値で SavedGameResult を生成する', () => {
    const result = createSavedGameResult();
    expect(result.grade).toBe('A');
    expect(result.sprintLog).toHaveLength(3);
  });

  it('createHistoryEntry: デフォルト値で GameHistoryEntry を生成する', () => {
    const entry = createHistoryEntry();
    expect(entry.totalCorrect).toBe(15);
    expect(entry.teamTypeId).toBe('synergy');
  });

  it('createAchievementContext: デフォルト値で AchievementContext を生成する', () => {
    const ctx = createAchievementContext();
    expect(ctx.result).toBeDefined();
    expect(ctx.sprintCorrectRates).toEqual([70, 75, 70]);
    expect(ctx.unlockedIds).toEqual([]);
  });

  it('createClassifyStats: デフォルト値で ClassifyStats を生成する', () => {
    const stats = createClassifyStats();
    expect(stats.stab).toBe(50);
    expect(stats.spd).toBe(7);
  });

  it('createTagStats: エントリを指定して TagStats を生成する', () => {
    const tags = createTagStats({
      scrum: { correct: 8, total: 10 },
    });
    expect(tags['scrum'].correct).toBe(8);
  });
});
