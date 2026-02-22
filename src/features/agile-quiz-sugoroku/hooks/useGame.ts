/**
 * ゲーム状態管理フック
 */
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  GamePhase,
  GameEvent,
  Question,
  AnswerResult,
  SprintSummary,
  GameStats,
  DerivedStats,
} from '../types';
import {
  EVENTS,
  INITIAL_GAME_STATS,
} from '../constants';
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
import { computeAnswerResult, computeDebtDelta, nextGameStats } from '../answer-processor';

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
  const [phase, setPhase] = useState<GamePhase>('title');
  const [sprint, setSprint] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);
  const [events, setEvents] = useState<GameEvent[]>([...EVENTS]);
  const [quiz, setQuiz] = useState<Question | null>(null);
  const [quizIndex, setQuizIndex] = useState(-1);
  const [options, setOptions] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [usedQuestions, setUsedQuestions] = useState<{
    [key: string]: Set<number>;
  }>({});
  const [sprintAnswers, setSprintAnswers] = useState<AnswerResult[]>([]);
  const [log, setLog] = useState<SprintSummary[]>([]);
  const [stats, setStats] = useState<GameStats>({ ...INITIAL_GAME_STATS });

  const answered = useRef(false);
  const startTime = useRef(0);

  /** 問題を読み込む */
  const loadQuestion = useCallback(
    (
      eventList: GameEvent[],
      index: number,
      used: { [key: string]: Set<number> }
    ): { [key: string]: Set<number> } => {
      const eventId = eventList[index].id;
      const questions = QUESTIONS[eventId] ?? QUESTIONS.planning;
      const { question, index: qIdx } = pickQuestion(questions, used[eventId]);

      // 使用済みに追加
      const newUsed = { ...used };
      newUsed[eventId] = new Set([...(used[eventId] ?? []), qIdx]);

      setUsedQuestions(newUsed);
      setQuiz(question);
      setQuizIndex(qIdx);
      setOptions(shuffle([0, 1, 2, 3]));
      setSelectedAnswer(null);
      answered.current = false;
      startTime.current = Date.now();

      return newUsed;
    },
    []
  );

  /** ゲームを初期化 */
  const init = useCallback(() => {
    setEvents([...EVENTS]);
    setSprint(0);
    setEventIndex(0);
    setSprintAnswers([]);
    setLog([]);
    setStats({ ...INITIAL_GAME_STATS });
    setUsedQuestions({});
  }, []);

  /** スプリントを開始 */
  const begin = useCallback(
    (
      sprintNumber: number,
      currentStats: GameStats,
      currentUsed: { [key: string]: Set<number> }
    ) => {
      const newEvents = makeEvents(sprintNumber, currentStats.debt);
      setEvents(newEvents);
      setEventIndex(0);
      setSprintAnswers([]);
      loadQuestion(newEvents, 0, currentUsed);
    },
    [loadQuestion]
  );

  /** 回答を処理 */
  const answer = useCallback(
    (optionIndex: number): AnswerResult | null => {
      if (answered.current || !quiz) return null;
      answered.current = true;

      const speed = Math.round((Date.now() - startTime.current) / 100) / 10;
      setSelectedAnswer(optionIndex);

      // 1. 純粋関数で結果を計算
      const result = computeAnswerResult({
        optionIndex,
        correctAnswer: quiz.answer,
        speed,
        eventId: events[eventIndex].id,
      });
      const debtDelta = computeDebtDelta(result.correct, result.eventId);

      // 2. 状態更新
      setSprintAnswers((prev) => [...prev, result]);
      setStats((prev) => nextGameStats(prev, result, debtDelta));

      // 3. 音声副作用
      if (result.correct) {
        sfxRef.current.onCorrectAnswer();
      } else {
        sfxRef.current.onIncorrectAnswer();
      }

      return result;
    },
    [quiz, events, eventIndex]
  );

  /** 次のイベントへ進む */
  const advance = useCallback((): boolean => {
    const nextIndex = eventIndex + 1;
    if (nextIndex >= events.length) {
      return false;
    }
    setEventIndex(nextIndex);
    loadQuestion(events, nextIndex, usedQuestions);
    return true;
  }, [eventIndex, events, usedQuestions, loadQuestion]);

  /** スプリントを終了 */
  const finish = useCallback((): SprintSummary => {
    const summary = createSprintSummary(sprintAnswers, sprint, stats.debt);
    setLog((prev) => [...prev, summary]);
    return summary;
  }, [sprintAnswers, sprint, stats.debt]);

  /** 派生統計 */
  const derived = useMemo((): DerivedStats => {
    return {
      correctRate: percentage(stats.totalCorrect, stats.totalQuestions),
      averageSpeed: average(stats.speeds),
      stability: clamp(100 - stats.debt * 1.5, 0, 100),
      sprintCorrectRates: log.map((x) => x.correctRate),
    };
  }, [stats, log]);

  return {
    phase,
    setPhase,
    sprint,
    setSprint,
    eventIndex,
    events,
    quiz,
    quizIndex,
    options,
    selectedAnswer,
    stats,
    log,
    usedQuestions,
    answered,
    init,
    begin,
    answer,
    advance,
    finish,
    derived,
  };
}
