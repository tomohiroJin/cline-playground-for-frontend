/**
 * answer-question ユースケースのテスト
 */
import { executeAnswerQuestion } from '../answer-question';
import { SilentAudioAdapter } from '../../infrastructure/audio/silent-audio-adapter';
import { INITIAL_GAME_STATS } from '../../constants';
import { Question, GameStats, TagStats } from '../../domain/types';

// テスト用の問題
const TEST_QUESTION: Question = {
  question: 'テスト問題',
  options: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
  answer: 0,
  tags: ['scrum', 'agile'],
  explanation: '解説テキスト',
};

describe('executeAnswerQuestion', () => {
  const audioPort = new SilentAudioAdapter();

  describe('正解の場合', () => {
    it('正解フラグが true になる', () => {
      // Arrange
      const stats = { ...INITIAL_GAME_STATS };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 0,
        elapsed: 5.0,
        eventId: 'planning',
        currentStats: stats,
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(result.answerResult.correct).toBe(true);
    });

    it('統計が正しく更新される（正解数 +1、コンボ +1）', () => {
      // Arrange
      const stats = { ...INITIAL_GAME_STATS };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 0,
        elapsed: 5.0,
        eventId: 'planning',
        currentStats: stats,
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(result.nextStats.totalCorrect).toBe(1);
      expect(result.nextStats.totalQuestions).toBe(1);
      expect(result.nextStats.combo).toBe(1);
    });

    it('planning イベントでは負債が増えない', () => {
      // Arrange
      const stats = { ...INITIAL_GAME_STATS };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 0,
        elapsed: 5.0,
        eventId: 'planning',
        currentStats: stats,
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(result.debtDelta).toBe(0);
      expect(result.nextStats.debt).toBe(0);
    });

    it('タグ別統計が正しく更新される', () => {
      // Arrange
      const stats = { ...INITIAL_GAME_STATS };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 0,
        elapsed: 5.0,
        eventId: 'planning',
        currentStats: stats,
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(result.tagStats.scrum).toEqual({ correct: 1, total: 1 });
      expect(result.tagStats.agile).toEqual({ correct: 1, total: 1 });
    });

    it('正解時に不正解問題リストに追加されない', () => {
      // Arrange
      const stats = { ...INITIAL_GAME_STATS };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 0,
        elapsed: 5.0,
        eventId: 'planning',
        currentStats: stats,
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(result.incorrectQuestion).toBeUndefined();
    });
  });

  describe('不正解の場合', () => {
    it('不正解フラグが false になる', () => {
      // Arrange
      const stats = { ...INITIAL_GAME_STATS };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 1,
        elapsed: 5.0,
        eventId: 'impl1',
        currentStats: stats,
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(result.answerResult.correct).toBe(false);
    });

    it('impl1 不正解時に負債が発生する', () => {
      // Arrange
      const stats = { ...INITIAL_GAME_STATS };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 1,
        elapsed: 5.0,
        eventId: 'impl1',
        currentStats: stats,
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(result.debtDelta).toBeGreaterThan(0);
      expect(result.nextStats.debt).toBe(result.debtDelta);
    });

    it('コンボがリセットされる', () => {
      // Arrange
      const stats: GameStats = {
        ...INITIAL_GAME_STATS,
        combo: 3,
        maxCombo: 3,
      };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 1,
        elapsed: 5.0,
        eventId: 'planning',
        currentStats: stats,
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(result.nextStats.combo).toBe(0);
      expect(result.nextStats.maxCombo).toBe(3);
    });

    it('不正解問題が記録される', () => {
      // Arrange
      const stats = { ...INITIAL_GAME_STATS };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 2,
        elapsed: 5.0,
        eventId: 'planning',
        currentStats: stats,
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(result.incorrectQuestion).toBeDefined();
      expect(result.incorrectQuestion!.questionText).toBe('テスト問題');
      expect(result.incorrectQuestion!.selectedAnswer).toBe(2);
      expect(result.incorrectQuestion!.correctAnswer).toBe(0);
      expect(result.incorrectQuestion!.tags).toEqual(['scrum', 'agile']);
    });

    it('タグ別統計で不正解がカウントされる', () => {
      // Arrange
      const stats = { ...INITIAL_GAME_STATS };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 1,
        elapsed: 5.0,
        eventId: 'planning',
        currentStats: stats,
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(result.tagStats.scrum).toEqual({ correct: 0, total: 1 });
      expect(result.tagStats.agile).toEqual({ correct: 0, total: 1 });
    });
  });

  describe('タグ統計の累積', () => {
    it('既存のタグ統計に正しく累積される', () => {
      // Arrange
      const stats = { ...INITIAL_GAME_STATS };
      const existingTagStats: TagStats = {
        scrum: { correct: 2, total: 3 },
      };

      // Act
      const result = executeAnswerQuestion({
        question: TEST_QUESTION,
        selectedOption: 0,
        elapsed: 5.0,
        eventId: 'planning',
        currentStats: stats,
        currentTagStats: existingTagStats,
      }, { audioPort });

      // Assert
      expect(result.tagStats.scrum).toEqual({ correct: 3, total: 4 });
      expect(result.tagStats.agile).toEqual({ correct: 1, total: 1 });
    });
  });

  describe('タグなし問題', () => {
    it('タグがない問題ではタグ統計が変わらない', () => {
      // Arrange
      const questionNoTags: Question = {
        question: 'タグなし', options: ['A', 'B', 'C', 'D'], answer: 0,
      };

      // Act
      const result = executeAnswerQuestion({
        question: questionNoTags,
        selectedOption: 0,
        elapsed: 5.0,
        eventId: 'planning',
        currentStats: { ...INITIAL_GAME_STATS },
        currentTagStats: {},
      }, { audioPort });

      // Assert
      expect(Object.keys(result.tagStats)).toHaveLength(0);
    });
  });
});
