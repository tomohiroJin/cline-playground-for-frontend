/**
 * イベント進行ユースケース
 *
 * 次のイベントに進み、対応する問題を選択する。
 */
import { GameEvent, Question } from '../domain/types';
import { RandomPort } from '../infrastructure/random/random-port';
import { loadQuestion } from './load-question';

/** ユースケース入力 */
export interface AdvanceEventInput {
  /** イベント一覧 */
  events: GameEvent[];
  /** 現在のイベントインデックス */
  eventIndex: number;
  /** 使用済み問題インデックス */
  usedQuestions: Record<string, Set<number>>;
  /** カテゴリ別問題データ */
  questions: Record<string, Question[]>;
}

/** ユースケース依存 */
export interface AdvanceEventDeps {
  randomPort: RandomPort;
}

/** ユースケース出力 */
export interface AdvanceEventOutput {
  /** 次のイベントが存在するか */
  hasNext: boolean;
  /** 次のイベントインデックス */
  nextEventIndex: number;
  /** 選択された問題（hasNext=false の場合は undefined） */
  question?: Question;
  /** 問題インデックス（hasNext=false の場合は undefined） */
  questionIndex?: number;
  /** シャッフルされた選択肢順序（hasNext=false の場合は undefined） */
  options?: number[];
  /** 更新された使用済み問題 */
  usedQuestions: Record<string, Set<number>>;
}

/**
 * イベント進行を実行する
 *
 * 1. 次のイベントが存在するか判定
 * 2. 存在する場合、問題を選択しシャッフル
 */
export function executeAdvanceEvent(
  input: AdvanceEventInput,
  deps: AdvanceEventDeps,
): AdvanceEventOutput {
  const { events, eventIndex, questions } = input;
  const { randomPort } = deps;
  const nextIndex = eventIndex + 1;

  if (nextIndex >= events.length) {
    return {
      hasNext: false,
      nextEventIndex: nextIndex,
      usedQuestions: { ...input.usedQuestions },
    };
  }

  // 次のイベントの問題を選択・シャッフル
  const { question, questionIndex, options, usedQuestions } = loadQuestion(
    events[nextIndex].id,
    questions,
    input.usedQuestions,
    randomPort,
  );

  return {
    hasNext: true,
    nextEventIndex: nextIndex,
    question,
    questionIndex,
    options,
    usedQuestions,
  };
}
