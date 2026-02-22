/**
 * useGame フックのテスト
 */

// tone モジュールのモック
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

import { renderHook, act } from '@testing-library/react';
import { useGame } from '../hooks/useGame';
import { INITIAL_GAME_STATS } from '../constants';

describe('useGame', () => {
  // ── init ───────────────────────────────────

  describe('init - ゲーム初期化', () => {
    it('init後にstatsが初期値にリセットされる', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      expect(result.current.stats.totalCorrect).toBe(INITIAL_GAME_STATS.totalCorrect);
      expect(result.current.stats.totalQuestions).toBe(INITIAL_GAME_STATS.totalQuestions);
      expect(result.current.stats.debt).toBe(INITIAL_GAME_STATS.debt);
      expect(result.current.stats.speeds).toEqual(INITIAL_GAME_STATS.speeds);
    });

    it('init後にsprintが0にリセットされる', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      expect(result.current.sprint).toBe(0);
    });

    it('init後にlogが空になる', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      expect(result.current.log).toEqual([]);
    });
  });

  // ── begin ──────────────────────────────────

  describe('begin - スプリント開始', () => {
    it('begin後にquizが設定される', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      expect(result.current.quiz).not.toBeNull();
      expect(result.current.quiz?.question).toBeDefined();
      expect(result.current.quiz?.options).toHaveLength(4);
    });

    it('begin後にeventsが7個生成される', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      expect(result.current.events).toHaveLength(7);
    });

    it('begin後にeventIndexが0になる', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      expect(result.current.eventIndex).toBe(0);
    });

    it('begin後にoptionsがシャッフルされた4要素の配列', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      expect(result.current.options).toHaveLength(4);
      expect(result.current.options.sort()).toEqual([0, 1, 2, 3]);
    });
  });

  // ── answer ─────────────────────────────────

  describe('answer - 回答処理', () => {
    it('正解時にresult.correctがtrueになる', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      const correctAnswer = result.current.quiz!.answer;
      let answerResult: ReturnType<typeof result.current.answer>;

      act(() => {
        answerResult = result.current.answer(correctAnswer);
      });

      expect(answerResult!).not.toBeNull();
      expect(answerResult!.correct).toBe(true);
    });

    it('不正解時にresult.correctがfalseになる', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      const wrongAnswer = (result.current.quiz!.answer + 1) % 4;
      let answerResult: ReturnType<typeof result.current.answer>;

      act(() => {
        answerResult = result.current.answer(wrongAnswer);
      });

      expect(answerResult!).not.toBeNull();
      expect(answerResult!.correct).toBe(false);
    });

    it('回答後にselectedAnswerが設定される', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      act(() => {
        result.current.answer(0);
      });

      expect(result.current.selectedAnswer).toBe(0);
    });

    it('2回連続の回答はnullを返す（回答済みガード）', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      act(() => {
        result.current.answer(0);
      });

      let secondAnswer: ReturnType<typeof result.current.answer>;
      act(() => {
        secondAnswer = result.current.answer(1);
      });

      expect(secondAnswer!).toBeNull();
    });

    it('正解でtotalCorrectが増加する', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      const correctAnswer = result.current.quiz!.answer;

      act(() => {
        result.current.answer(correctAnswer);
      });

      expect(result.current.stats.totalCorrect).toBe(1);
      expect(result.current.stats.totalQuestions).toBe(1);
    });

    it('quizがnullの場合はnullを返す', () => {
      const { result } = renderHook(() => useGame());

      // initしないのでquizはnull
      let answerResult: ReturnType<typeof result.current.answer>;
      act(() => {
        answerResult = result.current.answer(0);
      });

      expect(answerResult!).toBeNull();
    });
  });

  // ── advance ────────────────────────────────

  describe('advance - 次のイベントへ進む', () => {
    it('advance成功でtrueを返す', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      // answer first to allow advance
      act(() => {
        result.current.answer(0);
      });

      let advanced: boolean = false;
      act(() => {
        advanced = result.current.advance();
      });

      expect(advanced).toBe(true);
    });

    it('advance後にquizが新しい問題に更新される', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      act(() => {
        result.current.answer(0);
      });

      act(() => {
        result.current.advance();
      });

      // 新しい問題が設定される
      expect(result.current.quiz).not.toBeNull();
      expect(result.current.selectedAnswer).toBeNull();
    });
  });

  // ── finish ─────────────────────────────────

  describe('finish - スプリント終了', () => {
    it('finishでSprintSummaryが返る', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      // 1問回答
      act(() => {
        result.current.answer(result.current.quiz!.answer);
      });

      let summary: ReturnType<typeof result.current.finish>;
      act(() => {
        summary = result.current.finish();
      });

      expect(summary!).toBeDefined();
      expect(summary!.sprintNumber).toBe(1); // sprint 0 → sprintNumber 1
      expect(summary!.totalCount).toBeGreaterThanOrEqual(1);
    });

    it('finishでlogにsummaryが追加される', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      act(() => {
        result.current.answer(0);
      });

      act(() => {
        result.current.finish();
      });

      expect(result.current.log).toHaveLength(1);
    });
  });

  // ── derived ────────────────────────────────

  describe('derived - 派生統計', () => {
    it('初期状態のderivedはゼロベース', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      expect(result.current.derived.correctRate).toBe(0);
      expect(result.current.derived.averageSpeed).toBe(0);
      expect(result.current.derived.stability).toBe(100); // debt=0 → 100-0*1.5=100
      expect(result.current.derived.sprintCorrectRates).toEqual([]);
    });

    it('回答後にderivedが更新される', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.init();
      });

      act(() => {
        result.current.begin(0, result.current.stats, result.current.usedQuestions);
      });

      const correctAnswer = result.current.quiz!.answer;
      act(() => {
        result.current.answer(correctAnswer);
      });

      expect(result.current.derived.correctRate).toBe(100); // 1/1 = 100%
      expect(result.current.derived.averageSpeed).toBeGreaterThanOrEqual(0);
    });
  });
});
