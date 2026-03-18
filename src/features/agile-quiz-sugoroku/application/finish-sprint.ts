/**
 * スプリント終了ユースケース
 *
 * domain の createSprintSummary を利用してスプリント集計を生成する。
 */
import { AnswerResult, SprintSummary } from '../domain/types';
import { createSprintSummary } from '../domain/game/sprint';

/** ユースケース入力 */
export interface FinishSprintInput {
  /** スプリント中の回答結果一覧 */
  sprintAnswers: AnswerResult[];
  /** スプリント番号（0始まり） */
  sprintNumber: number;
  /** 現在の技術的負債 */
  debt: number;
}

/** ユースケース出力 */
export interface FinishSprintOutput {
  /** スプリント集計 */
  summary: SprintSummary;
}

/**
 * スプリント終了処理を実行する
 *
 * domain の純粋関数に委譲してスプリント集計を生成する。
 */
export function executeFinishSprint(
  input: FinishSprintInput,
): FinishSprintOutput {
  const summary = createSprintSummary(
    input.sprintAnswers,
    input.sprintNumber,
    input.debt,
  );

  return { summary };
}
