/**
 * 問題選択の共通ロジック
 *
 * start-game と advance-event で共有する
 * 「問題選択 → 使用済み更新 → 選択肢シャッフル」の処理。
 */
import { Question } from '../domain/types';
import { pickQuestion } from '../domain/quiz/question-picker';
import { RandomPort } from '../infrastructure/random/random-port';

/** 問題ロード結果 */
export interface LoadQuestionResult {
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
 * 指定イベントの問題を選択し、使用済みを更新する
 */
export function loadQuestion(
  eventId: string,
  questions: Record<string, Question[]>,
  usedQuestions: Record<string, Set<number>>,
  randomPort: RandomPort,
): LoadQuestionResult {
  const questionPool = questions[eventId] ?? questions.planning;
  const { question, index: questionIndex } = pickQuestion(questionPool, {
    usedIndices: usedQuestions[eventId],
    randomFn: () => randomPort.random(),
  });

  // 使用済み問題を更新
  const updatedUsed: Record<string, Set<number>> = { ...usedQuestions };
  updatedUsed[eventId] = new Set([
    ...(usedQuestions[eventId] ?? []),
    questionIndex,
  ]);

  // 選択肢をシャッフル
  const options = randomPort.shuffle([0, 1, 2, 3]);

  return { question, questionIndex, options, usedQuestions: updatedUsed };
}
