/**
 * ゲーム状態管理フック（Reducer ベース）
 */
import { useCallback, useRef, useMemo, useEffect, useReducer } from 'react';
import type {
  GamePhase,
  GameEvent,
  Question,
  AnswerResult,
  SprintSummary,
  GameStats,
  DerivedStats,
  TagStats,
  AnswerResultWithDetail,
  SaveState,
} from '../types';
import { AudioActions, createDefaultAudioActions } from '../audio/audio-actions';
import {
  shuffle,
  average,
  percentage,
  clamp,
  pickQuestion,
  makeEvents,
  createSprintSummary,
} from '../game-logic';
import { QUESTIONS } from '../quiz-data';
import { gameReducer, createInitialGameState } from './useGameReducer';

export interface UseGameReturn {
  /** 現在のフェーズ */
  phase: GamePhase;
  /** フェーズを設定 */
  setPhase: (phase: GamePhase) => void;
  /** 現在のスプリント番号（0始まり） */
  sprint: number;
  /** スプリント番号を設定 */
  setSprint: (sprint: number) => void;
  /** 現在のイベントインデックス */
  eventIndex: number;
  /** イベント一覧 */
  events: GameEvent[];
  /** 現在のクイズ */
  quiz: Question | null;
  /** 現在の問題インデックス */
  quizIndex: number;
  /** 選択肢の並び順 */
  options: number[];
  /** 選択された回答 */
  selectedAnswer: number | null;
  /** ゲーム統計 */
  stats: GameStats;
  /** スプリントログ */
  log: SprintSummary[];
  /** 使用済み問題インデックス */
  usedQuestions: { [key: string]: Set<number> };
  /** 回答済みフラグ */
  answered: React.MutableRefObject<boolean>;
  /** ゲームを初期化 */
  init: () => void;
  /** スプリントを開始 */
  begin: (
    sprintNumber: number,
    currentStats: GameStats,
    currentUsed: { [key: string]: Set<number> }
  ) => void;
  /** 回答を処理 */
  answer: (optionIndex: number) => AnswerResult | null;
  /** 次のイベントへ進む */
  advance: () => boolean;
  /** スプリントを終了 */
  finish: () => SprintSummary;
  /** 派生統計 */
  derived: DerivedStats;
  /** ジャンル別統計 */
  tagStats: TagStats;
  /** 不正解問題リスト */
  incorrectQuestions: AnswerResultWithDetail[];
  /** セーブデータから復元 */
  restoreFromSave: (saveState: SaveState) => void;
  /** 現在の状態からセーブデータを構築 */
  buildSaveState: (sprintCount: number) => SaveState;
}

/** 問題を読み込み、dispatch 用のペイロードを生成 */
function prepareQuestion(
  eventList: GameEvent[],
  index: number,
  used: { [key: string]: Set<number> },
): {
  quiz: Question;
  quizIndex: number;
  options: number[];
  usedQuestions: { [key: string]: Set<number> };
} {
  const eventId = eventList[index].id;
  const questions = QUESTIONS[eventId] ?? QUESTIONS.planning;
  const { question, index: qIdx } = pickQuestion(questions, used[eventId]);

  const newUsed = { ...used };
  newUsed[eventId] = new Set([...(used[eventId] ?? []), qIdx]);

  return {
    quiz: question,
    quizIndex: qIdx,
    options: shuffle([0, 1, 2, 3]),
    usedQuestions: newUsed,
  };
}

/**
 * ゲーム状態管理
 * @param audio 音声アクション（省略時はデフォルト音声）
 */
export function useGame(audio?: AudioActions): UseGameReturn {
  const sfxRef = useRef<AudioActions>(audio ?? createDefaultAudioActions());
  useEffect(() => {
    if (audio) sfxRef.current = audio;
  }, [audio]);

  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);

  const answered = useRef(false);
  const startTime = useRef(0);

  /** ゲームを初期化 */
  const init = useCallback(() => {
    dispatch({ type: 'INIT' });
  }, []);

  /** フェーズを設定 */
  const setPhase = useCallback((phase: GamePhase) => {
    dispatch({ type: 'SET_PHASE', phase });
  }, []);

  /** スプリント番号を設定 */
  const setSprint = useCallback((sprint: number) => {
    dispatch({ type: 'SET_SPRINT', sprint });
  }, []);

  /** スプリントを開始 */
  const begin = useCallback(
    (
      sprintNumber: number,
      currentStats: GameStats,
      currentUsed: { [key: string]: Set<number> },
    ) => {
      const newEvents = makeEvents(sprintNumber, currentStats.debt);
      const questionPayload = prepareQuestion(newEvents, 0, currentUsed);

      dispatch({
        type: 'BEGIN_SPRINT',
        events: newEvents,
        ...questionPayload,
      });

      answered.current = false;
      startTime.current = Date.now();
    },
    [],
  );

  /** 回答を処理 */
  const answer = useCallback(
    (optionIndex: number): AnswerResult | null => {
      if (answered.current || !state.quiz) return null;
      answered.current = true;

      const speed = Math.round((Date.now() - startTime.current) / 100) / 10;

      dispatch({
        type: 'ANSWER',
        optionIndex,
        speed,
      });

      // 回答結果を算出して返却（副作用用）
      const isCorrect = optionIndex === state.quiz.answer;
      const result: AnswerResult = {
        correct: isCorrect,
        speed,
        eventId: state.events[state.eventIndex].id,
      };

      // 音声副作用
      if (isCorrect) {
        sfxRef.current.onCorrectAnswer();
      } else {
        sfxRef.current.onIncorrectAnswer();
      }

      return result;
    },
    [state.quiz, state.events, state.eventIndex],
  );

  /** 次のイベントへ進む */
  const advance = useCallback((): boolean => {
    const nextIndex = state.eventIndex + 1;
    if (nextIndex >= state.events.length) {
      return false;
    }

    const questionPayload = prepareQuestion(state.events, nextIndex, state.usedQuestions);
    dispatch({
      type: 'ADVANCE_EVENT',
      ...questionPayload,
    });

    answered.current = false;
    startTime.current = Date.now();
    return true;
  }, [state.eventIndex, state.events, state.usedQuestions]);

  /** スプリントを終了 */
  const finish = useCallback((): SprintSummary => {
    const summary = createSprintSummary(state.sprintAnswers, state.sprint, state.stats.debt);
    dispatch({ type: 'FINISH_SPRINT', summary });
    return summary;
  }, [state.sprintAnswers, state.sprint, state.stats.debt]);

  /** セーブデータから復元 */
  const restoreFromSave = useCallback((saveState: SaveState) => {
    const restoredUsed: { [key: string]: Set<number> } = {};
    for (const [key, indices] of Object.entries(saveState.usedQuestions)) {
      restoredUsed[key] = new Set(indices);
    }

    dispatch({
      type: 'RESTORE_SAVE',
      sprint: saveState.currentSprint,
      stats: saveState.stats,
      log: saveState.log,
      usedQuestions: restoredUsed,
      tagStats: saveState.tagStats,
      incorrectQuestions: saveState.incorrectQuestions,
    });
  }, []);

  /** 現在の状態からセーブデータを構築 */
  const buildSaveState = useCallback(
    (sprintCount: number): SaveState => {
      const serializedUsed: Record<string, number[]> = {};
      for (const [key, indices] of Object.entries(state.usedQuestions)) {
        serializedUsed[key] = [...indices];
      }

      return {
        version: 1,
        timestamp: Date.now(),
        sprintCount,
        currentSprint: state.sprint + 1,
        stats: state.stats,
        log: state.log,
        usedQuestions: serializedUsed,
        tagStats: state.tagStats,
        incorrectQuestions: state.incorrectQuestions,
      };
    },
    [state.sprint, state.stats, state.log, state.usedQuestions, state.tagStats, state.incorrectQuestions],
  );

  /** 派生統計 */
  const derived = useMemo((): DerivedStats => {
    return {
      correctRate: percentage(state.stats.totalCorrect, state.stats.totalQuestions),
      averageSpeed: average(state.stats.speeds),
      stability: clamp(100 - state.stats.debt * 1.5, 0, 100),
      sprintCorrectRates: state.log.map((x) => x.correctRate),
    };
  }, [state.stats, state.log]);

  return {
    phase: state.phase,
    setPhase,
    sprint: state.sprint,
    setSprint,
    eventIndex: state.eventIndex,
    events: state.events,
    quiz: state.quiz,
    quizIndex: state.quizIndex,
    options: state.options,
    selectedAnswer: state.selectedAnswer,
    stats: state.stats,
    log: state.log,
    usedQuestions: state.usedQuestions,
    answered,
    init,
    begin,
    answer,
    advance,
    finish,
    derived,
    tagStats: state.tagStats,
    incorrectQuestions: state.incorrectQuestions,
    restoreFromSave,
    buildSaveState,
  };
}
