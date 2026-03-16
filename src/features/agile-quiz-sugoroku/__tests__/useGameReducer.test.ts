/**
 * gameReducer のテスト（TDD: テストファースト）
 */

jest.mock('tone', () => ({
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  start: jest.fn(),
  now: jest.fn().mockReturnValue(0),
  Transport: { bpm: { value: 120 }, start: jest.fn(), stop: jest.fn(), cancel: jest.fn() },
  Loop: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
}));

import { gameReducer, createInitialGameState } from '../hooks/useGameReducer';
import type { GameState } from '../hooks/useGameReducer';
import { INITIAL_GAME_STATS } from '../constants';

describe('gameReducer', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = createInitialGameState();
  });

  // ── createInitialGameState ──────────────────

  describe('createInitialGameState - 初期状態生成', () => {
    it('初期状態が正しいデフォルト値を持つ', () => {
      const state = createInitialGameState();

      expect(state.phase).toBe('title');
      expect(state.sprint).toBe(0);
      expect(state.eventIndex).toBe(0);
      expect(state.events).toHaveLength(7);
      expect(state.quiz).toBeNull();
      expect(state.quizIndex).toBe(-1);
      expect(state.options).toEqual([]);
      expect(state.selectedAnswer).toBeNull();
      expect(state.usedQuestions).toEqual({});
      expect(state.sprintAnswers).toEqual([]);
      expect(state.log).toEqual([]);
      expect(state.stats).toEqual(INITIAL_GAME_STATS);
      expect(state.tagStats).toEqual({});
      expect(state.incorrectQuestions).toEqual([]);
    });
  });

  // ── INIT ────────────────────────────────────

  describe('INIT - ゲーム初期化', () => {
    it('statsが初期値にリセットされる', () => {
      // Arrange: 変更された状態を作る
      const modified: GameState = {
        ...initialState,
        sprint: 2,
        stats: { ...INITIAL_GAME_STATS, totalCorrect: 5, debt: 10 },
        log: [{ sprintNumber: 1, correctRate: 80, correctCount: 4, totalCount: 5, averageSpeed: 3, debt: 5, hadEmergency: false, emergencySuccessCount: 0, categoryStats: {} }],
      };

      // Act
      const next = gameReducer(modified, { type: 'INIT' });

      // Assert
      expect(next.stats).toEqual(INITIAL_GAME_STATS);
      expect(next.sprint).toBe(0);
      expect(next.log).toEqual([]);
      expect(next.tagStats).toEqual({});
      expect(next.incorrectQuestions).toEqual([]);
    });
  });

  // ── SET_PHASE ───────────────────────────────

  describe('SET_PHASE - フェーズ遷移', () => {
    it('フェーズを変更できる', () => {
      const next = gameReducer(initialState, { type: 'SET_PHASE', phase: 'game' });

      expect(next.phase).toBe('game');
    });

    it('他のステートは変更されない', () => {
      const next = gameReducer(initialState, { type: 'SET_PHASE', phase: 'story' });

      expect(next.sprint).toBe(initialState.sprint);
      expect(next.stats).toBe(initialState.stats);
    });
  });

  // ── SET_SPRINT ──────────────────────────────

  describe('SET_SPRINT - スプリント設定', () => {
    it('スプリント番号を変更できる', () => {
      const next = gameReducer(initialState, { type: 'SET_SPRINT', sprint: 2 });

      expect(next.sprint).toBe(2);
    });
  });

  // ── BEGIN_SPRINT ────────────────────────────

  describe('BEGIN_SPRINT - スプリント開始', () => {
    it('新しいイベント一覧が設定される', () => {
      const next = gameReducer(initialState, {
        type: 'BEGIN_SPRINT',
        events: [
          { id: 'planning', name: 'プランニング', icon: '📋', description: '', color: '#fff' },
        ],
        quiz: { question: 'test', options: ['a', 'b', 'c', 'd'], answer: 0 },
        quizIndex: 5,
        options: [2, 0, 3, 1],
        usedQuestions: { planning: new Set([5]) },
      });

      expect(next.events).toHaveLength(1);
      expect(next.eventIndex).toBe(0);
      expect(next.quiz?.question).toBe('test');
      expect(next.quizIndex).toBe(5);
      expect(next.options).toEqual([2, 0, 3, 1]);
      expect(next.sprintAnswers).toEqual([]);
      expect(next.selectedAnswer).toBeNull();
    });
  });

  // ── ANSWER ──────────────────────────────────

  describe('ANSWER - 回答処理', () => {
    let stateWithQuiz: GameState;

    beforeEach(() => {
      stateWithQuiz = {
        ...initialState,
        phase: 'game',
        quiz: { question: 'テスト問題', options: ['A', 'B', 'C', 'D'], answer: 1 },
        quizIndex: 0,
        options: [0, 1, 2, 3],
        events: [{ id: 'planning', name: 'プランニング', icon: '📋', description: '', color: '#fff' }],
      };
    });

    it('正解時にtotalCorrectが増加する', () => {
      const next = gameReducer(stateWithQuiz, {
        type: 'ANSWER',
        optionIndex: 1,
        speed: 3.5,
      });

      expect(next.stats.totalCorrect).toBe(1);
      expect(next.stats.totalQuestions).toBe(1);
      expect(next.selectedAnswer).toBe(1);
    });

    it('不正解時にtotalCorrectが増加しない', () => {
      const next = gameReducer(stateWithQuiz, {
        type: 'ANSWER',
        optionIndex: 0,
        speed: 5.0,
      });

      expect(next.stats.totalCorrect).toBe(0);
      expect(next.stats.totalQuestions).toBe(1);
      expect(next.selectedAnswer).toBe(0);
    });

    it('正解時にコンボが増加する', () => {
      const next = gameReducer(stateWithQuiz, {
        type: 'ANSWER',
        optionIndex: 1,
        speed: 3.5,
      });

      expect(next.stats.combo).toBe(1);
    });

    it('不正解時にコンボがリセットされる', () => {
      const withCombo = {
        ...stateWithQuiz,
        stats: { ...INITIAL_GAME_STATS, combo: 3, maxCombo: 3 },
      };
      const next = gameReducer(withCombo, {
        type: 'ANSWER',
        optionIndex: 0,
        speed: 5.0,
      });

      expect(next.stats.combo).toBe(0);
      expect(next.stats.maxCombo).toBe(3);
    });

    it('タグ統計が更新される', () => {
      const stateWithTags = {
        ...stateWithQuiz,
        quiz: { ...stateWithQuiz.quiz!, tags: ['scrum', 'testing'] },
      };

      const next = gameReducer(stateWithTags, {
        type: 'ANSWER',
        optionIndex: 1,
        speed: 3.5,
      });

      expect(next.tagStats.scrum).toEqual({ correct: 1, total: 1 });
      expect(next.tagStats.testing).toEqual({ correct: 1, total: 1 });
    });

    it('不正解時にincorrectQuestionsに追加される', () => {
      const next = gameReducer(stateWithQuiz, {
        type: 'ANSWER',
        optionIndex: 0,
        speed: 5.0,
      });

      expect(next.incorrectQuestions).toHaveLength(1);
      expect(next.incorrectQuestions[0].questionText).toBe('テスト問題');
      expect(next.incorrectQuestions[0].selectedAnswer).toBe(0);
      expect(next.incorrectQuestions[0].correctAnswer).toBe(1);
    });

    it('sprintAnswersに回答が追加される', () => {
      const next = gameReducer(stateWithQuiz, {
        type: 'ANSWER',
        optionIndex: 1,
        speed: 3.5,
      });

      expect(next.sprintAnswers).toHaveLength(1);
      expect(next.sprintAnswers[0].correct).toBe(true);
    });
  });

  // ── ADVANCE_EVENT ───────────────────────────

  describe('ADVANCE_EVENT - 次のイベントへ進む', () => {
    it('次のイベントへ進む', () => {
      const stateWithEvents: GameState = {
        ...initialState,
        events: [
          { id: 'planning', name: 'P', icon: '', description: '', color: '' },
          { id: 'impl1', name: 'I', icon: '', description: '', color: '' },
        ],
        eventIndex: 0,
        quiz: { question: 'Q1', options: ['a', 'b', 'c', 'd'], answer: 0 },
      };

      const next = gameReducer(stateWithEvents, {
        type: 'ADVANCE_EVENT',
        quiz: { question: 'Q2', options: ['a', 'b', 'c', 'd'], answer: 1 },
        quizIndex: 3,
        options: [1, 0, 3, 2],
        usedQuestions: { impl1: new Set([3]) },
      });

      expect(next.eventIndex).toBe(1);
      expect(next.quiz?.question).toBe('Q2');
      expect(next.selectedAnswer).toBeNull();
    });
  });

  // ── FINISH_SPRINT ───────────────────────────

  describe('FINISH_SPRINT - スプリント終了', () => {
    it('logにサマリーが追加される', () => {
      const summary = {
        sprintNumber: 1,
        correctRate: 80,
        correctCount: 4,
        totalCount: 5,
        averageSpeed: 3.5,
        debt: 5,
        hadEmergency: false,
        emergencySuccessCount: 0,
        categoryStats: {},
      };

      const next = gameReducer(initialState, {
        type: 'FINISH_SPRINT',
        summary,
      });

      expect(next.log).toHaveLength(1);
      expect(next.log[0]).toBe(summary);
    });
  });

  // ── RESTORE_SAVE ────────────────────────────

  describe('RESTORE_SAVE - セーブデータから復元', () => {
    it('セーブデータの各フィールドが復元される', () => {
      const savedStats = { ...INITIAL_GAME_STATS, totalCorrect: 3, totalQuestions: 5 };
      const savedLog = [{ sprintNumber: 1, correctRate: 60, correctCount: 3, totalCount: 5, averageSpeed: 4, debt: 5, hadEmergency: false, emergencySuccessCount: 0, categoryStats: {} }];

      const next = gameReducer(initialState, {
        type: 'RESTORE_SAVE',
        sprint: 1,
        stats: savedStats,
        log: savedLog,
        usedQuestions: { planning: new Set([1, 2]) },
        tagStats: { scrum: { correct: 2, total: 3 } },
        incorrectQuestions: [],
      });

      expect(next.sprint).toBe(1);
      expect(next.stats).toBe(savedStats);
      expect(next.log).toBe(savedLog);
      expect(next.usedQuestions.planning).toEqual(new Set([1, 2]));
      expect(next.tagStats.scrum).toEqual({ correct: 2, total: 3 });
      expect(next.sprintAnswers).toEqual([]);
      expect(next.eventIndex).toBe(0);
    });
  });
});
