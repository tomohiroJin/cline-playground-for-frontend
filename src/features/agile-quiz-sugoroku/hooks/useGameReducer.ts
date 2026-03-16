/**
 * ゲーム状態管理 Reducer
 *
 * useGame フックの状態を単一の Reducer で管理する純粋関数。
 * 副作用（Audio, Storage）は含まない。
 */
import type {
  GamePhase,
  GameEvent,
  Question,
  AnswerResult,
  SprintSummary,
  GameStats,
  TagStats,
  AnswerResultWithDetail,
} from '../types';
import { EVENTS, INITIAL_GAME_STATS } from '../constants';
import { computeAnswerResult, computeDebtDelta, nextGameStats } from '../answer-processor';

// ── State ─────────────────────────────────────

/** ゲーム全体の状態 */
export interface GameState {
  phase: GamePhase;
  sprint: number;
  eventIndex: number;
  events: GameEvent[];
  quiz: Question | null;
  quizIndex: number;
  options: number[];
  selectedAnswer: number | null;
  usedQuestions: { [key: string]: Set<number> };
  sprintAnswers: AnswerResult[];
  log: SprintSummary[];
  stats: GameStats;
  tagStats: TagStats;
  incorrectQuestions: AnswerResultWithDetail[];
}

// ── Actions ───────────────────────────────────

/** ゲーム初期化 */
interface InitAction {
  type: 'INIT';
}

/** フェーズ遷移 */
interface SetPhaseAction {
  type: 'SET_PHASE';
  phase: GamePhase;
}

/** スプリント番号設定 */
interface SetSprintAction {
  type: 'SET_SPRINT';
  sprint: number;
}

/** スプリント開始 */
interface BeginSprintAction {
  type: 'BEGIN_SPRINT';
  events: GameEvent[];
  quiz: Question;
  quizIndex: number;
  options: number[];
  usedQuestions: { [key: string]: Set<number> };
}

/** 回答処理 */
interface AnswerAction {
  type: 'ANSWER';
  optionIndex: number;
  speed: number;
}

/** 次のイベントへ進む */
interface AdvanceEventAction {
  type: 'ADVANCE_EVENT';
  quiz: Question;
  quizIndex: number;
  options: number[];
  usedQuestions: { [key: string]: Set<number> };
}

/** スプリント終了 */
interface FinishSprintAction {
  type: 'FINISH_SPRINT';
  summary: SprintSummary;
}

/** セーブデータから復元 */
interface RestoreSaveAction {
  type: 'RESTORE_SAVE';
  sprint: number;
  stats: GameStats;
  log: SprintSummary[];
  usedQuestions: { [key: string]: Set<number> };
  tagStats: TagStats;
  incorrectQuestions: AnswerResultWithDetail[];
}

export type GameAction =
  | InitAction
  | SetPhaseAction
  | SetSprintAction
  | BeginSprintAction
  | AnswerAction
  | AdvanceEventAction
  | FinishSprintAction
  | RestoreSaveAction;

// ── 初期状態生成 ──────────────────────────────

/** 初期状態を生成 */
export function createInitialGameState(): GameState {
  return {
    phase: 'title',
    sprint: 0,
    eventIndex: 0,
    events: [...EVENTS],
    quiz: null,
    quizIndex: -1,
    options: [],
    selectedAnswer: null,
    usedQuestions: {},
    sprintAnswers: [],
    log: [],
    stats: { ...INITIAL_GAME_STATS },
    tagStats: {},
    incorrectQuestions: [],
  };
}

// ── Reducer ───────────────────────────────────

/** ゲーム状態の Reducer（純粋関数） */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT':
      return createInitialGameState();

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'SET_SPRINT':
      return { ...state, sprint: action.sprint };

    case 'BEGIN_SPRINT':
      return {
        ...state,
        events: action.events,
        eventIndex: 0,
        quiz: action.quiz,
        quizIndex: action.quizIndex,
        options: action.options,
        usedQuestions: action.usedQuestions,
        sprintAnswers: [],
        selectedAnswer: null,
      };

    case 'ANSWER':
      return reduceAnswer(state, action);

    case 'ADVANCE_EVENT':
      return {
        ...state,
        eventIndex: state.eventIndex + 1,
        quiz: action.quiz,
        quizIndex: action.quizIndex,
        options: action.options,
        usedQuestions: action.usedQuestions,
        selectedAnswer: null,
      };

    case 'FINISH_SPRINT':
      return {
        ...state,
        log: [...state.log, action.summary],
      };

    case 'RESTORE_SAVE':
      return {
        ...state,
        sprint: action.sprint,
        stats: action.stats,
        log: action.log,
        usedQuestions: action.usedQuestions,
        tagStats: action.tagStats,
        incorrectQuestions: action.incorrectQuestions,
        sprintAnswers: [],
        eventIndex: 0,
      };

    default:
      return state;
  }
}

// ── 回答処理のサブ Reducer ────────────────────

/** 回答処理（副作用なし） */
function reduceAnswer(state: GameState, action: AnswerAction): GameState {
  if (!state.quiz) return state;

  const { optionIndex, speed } = action;
  const event = state.events[state.eventIndex];

  // 回答結果を計算
  const result = computeAnswerResult({
    optionIndex,
    correctAnswer: state.quiz.answer,
    speed,
    eventId: event.id,
  });
  const debtDelta = computeDebtDelta(result.correct, result.eventId);

  // 統計更新
  const newStats = nextGameStats(state.stats, result, debtDelta);

  // タグ統計更新
  let newTagStats = state.tagStats;
  if (state.quiz.tags) {
    newTagStats = { ...state.tagStats };
    for (const tag of state.quiz.tags) {
      const prev = newTagStats[tag] ?? { correct: 0, total: 0 };
      newTagStats[tag] = {
        correct: prev.correct + (result.correct ? 1 : 0),
        total: prev.total + 1,
      };
    }
  }

  // 不正解問題の蓄積
  let newIncorrect = state.incorrectQuestions;
  if (!result.correct) {
    newIncorrect = [
      ...state.incorrectQuestions,
      {
        questionText: state.quiz.question,
        options: state.quiz.options,
        selectedAnswer: optionIndex,
        correctAnswer: state.quiz.answer,
        correct: false,
        tags: state.quiz.tags ?? [],
        explanation: state.quiz.explanation,
        eventId: result.eventId,
      },
    ];
  }

  return {
    ...state,
    selectedAnswer: optionIndex,
    sprintAnswers: [...state.sprintAnswers, result],
    stats: newStats,
    tagStats: newTagStats,
    incorrectQuestions: newIncorrect,
  };
}
