/**
 * ゲーム状態管理フック
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import {
  GamePhase,
  GameEvent,
  Question,
  AnswerResult,
  SprintSummary,
  GameStats,
  DerivedStats,
  CategoryStats,
} from '../types';
import {
  CONFIG,
  EVENTS,
  EMERGENCY_EVENT,
  DEBT_EVENTS,
  getDebtPoints,
  INITIAL_GAME_STATS,
} from '../constants';
import { QUESTIONS } from '../quiz-data';
import { playSfxCorrect, playSfxIncorrect } from '../audio/sound';

/** 配列をシャッフル */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 平均値を計算 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** パーセンテージを計算 */
function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** 値を範囲内にクランプ */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 問題を選択 */
function pickQuestion(
  eventId: string,
  usedIndices?: Set<number>
): { question: Question; index: number } {
  const questions = QUESTIONS[eventId] ?? QUESTIONS.planning;
  const used = usedIndices ?? new Set<number>();

  // 未使用の問題インデックスを取得
  const available: number[] = [];
  for (let i = 0; i < questions.length; i++) {
    if (!used.has(i)) {
      available.push(i);
    }
  }

  // 未使用があればそこから、なければランダム
  const index =
    available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : Math.floor(Math.random() * questions.length);

  return { question: questions[index], index };
}

/** スプリントイベントを生成（緊急対応の発生判定含む） */
function makeEvents(sprintNumber: number, debt: number): GameEvent[] {
  const events = [...EVENTS];

  // 2スプリント目以降で緊急対応が発生する可能性
  if (sprintNumber > 0) {
    const probability = Math.min(
      CONFIG.emergency.maxProbability,
      CONFIG.emergency.base + debt * CONFIG.emergency.debtMultiplier
    );

    if (Math.random() < probability) {
      // ランダムな位置（1〜4）に緊急対応を挿入
      const position =
        CONFIG.emergency.minPosition +
        Math.floor(
          Math.random() *
            (CONFIG.emergency.maxPosition - CONFIG.emergency.minPosition)
        );
      events[position] = { ...EMERGENCY_EVENT };
    }
  }

  return events;
}

/** スプリント集計を生成 */
function createSprintSummary(
  answers: AnswerResult[],
  sprintNumber: number,
  debt: number
): SprintSummary {
  let correctCount = 0;
  answers.forEach((a) => {
    if (a.c) correctCount++;
  });

  // カテゴリ別統計
  const cats: CategoryStats = {};
  answers.forEach((a) => {
    if (!cats[a.e]) {
      cats[a.e] = { c: 0, t: 0 };
    }
    cats[a.e].t++;
    if (a.c) cats[a.e].c++;
  });

  return {
    sp: sprintNumber + 1,
    pct: percentage(correctCount, answers.length),
    cor: correctCount,
    tot: answers.length,
    spd: average(answers.map((a) => a.s)),
    debt,
    em: answers.some((a) => a.e === 'emergency'),
    emOk: answers.filter((a) => a.e === 'emergency' && a.c).length,
    cats,
  };
}

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
 */
export function useGame(): UseGameReturn {
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
      const { question, index: qIdx } = pickQuestion(eventId, used[eventId]);

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
      const isCorrect = optionIndex === quiz.a;
      setSelectedAnswer(optionIndex);

      const result: AnswerResult = {
        c: isCorrect,
        s: speed,
        e: events[eventIndex].id,
      };
      setSprintAnswers((prev) => [...prev, result]);

      // 負債計算
      const debtDelta =
        !isCorrect && DEBT_EVENTS[result.e]
          ? getDebtPoints(result.e)
          : 0;

      setStats((prev) => {
        const newCombo = isCorrect ? prev.combo + 1 : 0;
        return {
          tc: prev.tc + (isCorrect ? 1 : 0),
          tq: prev.tq + 1,
          sp: [...prev.sp, speed],
          debt: prev.debt + debtDelta,
          emC: prev.emC + (result.e === 'emergency' ? 1 : 0),
          emS: prev.emS + (result.e === 'emergency' && isCorrect ? 1 : 0),
          combo: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
        };
      });

      // 効果音
      if (isCorrect) {
        playSfxCorrect();
      } else {
        playSfxIncorrect();
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
      tp: percentage(stats.tc, stats.tq),
      spd: average(stats.sp),
      stab: clamp(100 - stats.debt * 1.5, 0, 100),
      sc: log.map((x) => x.pct),
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
