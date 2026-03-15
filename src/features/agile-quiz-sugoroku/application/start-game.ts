/**
 * ゲーム初期化ユースケース
 *
 * domain の createEvents + pickQuestion と infrastructure の RandomPort を組み合わせ、
 * スプリント開始に必要な初期状態を構築する。
 */
import { GameEvent, Question } from '../domain/types';
import { createEvents } from '../domain/game/event-generator';
import { RandomPort } from '../infrastructure/random/random-port';
import { loadQuestion } from './load-question';

/** ユースケース入力 */
export interface StartGameInput {
  /** スプリント番号（0始まり） */
  sprintNumber: number;
  /** 現在の技術的負債 */
  debt: number;
  /** 使用済み問題インデックス */
  usedQuestions: Record<string, Set<number>>;
  /** カテゴリ別問題データ */
  questions: Record<string, Question[]>;
}

/** ユースケース依存 */
export interface StartGameDeps {
  randomPort: RandomPort;
}

/** ユースケース出力 */
export interface StartGameOutput {
  /** 生成されたイベント一覧 */
  events: GameEvent[];
  /** 選択された問題 */
  question: Question;
  /** 問題インデックス */
  questionIndex: number;
  /** シャッフルされた選択肢順序 */
  options: number[];
  /** 更新された使用済み問題 */
  usedQuestions: Record<string, Set<number>>;
}

/**
 * ゲーム初期化を実行する
 *
 * 1. イベント一覧を生成（緊急対応の発生判定含む）
 * 2. 最初のイベントに対応する問題を選択
 * 3. 選択肢をシャッフル
 */
export function executeStartGame(
  input: StartGameInput,
  deps: StartGameDeps,
): StartGameOutput {
  const { sprintNumber, debt, questions } = input;
  const { randomPort } = deps;

  // 1. イベント生成
  const events = createEvents(
    sprintNumber,
    debt,
    () => randomPort.random(),
  );

  // 2. 最初のイベントの問題を選択・シャッフル
  const { question, questionIndex, options, usedQuestions } = loadQuestion(
    events[0].id,
    questions,
    input.usedQuestions,
    randomPort,
  );

  return { events, question, questionIndex, options, usedQuestions };
}
