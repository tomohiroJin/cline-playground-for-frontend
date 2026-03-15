/**
 * クイズ契約（Design by Contract）
 *
 * クイズ・問題選択に関する事前条件・事後条件を定義する。
 */
import type { Question, AnswerResult } from '../domain/types';
import { assertContract } from './contract-error';

/**
 * 事前条件: 問題を選択できる状態か検証する
 *
 * - 問題プールが空でないこと
 * - usedIndices の各値が問題インデックスの範囲内であること
 */
export function assertCanPickQuestion(
  questions: readonly Question[],
  usedIndices: ReadonlySet<number>,
): void {
  assertContract(
    questions.length > 0,
    '問題プールが空',
  );
  for (const index of usedIndices) {
    assertContract(
      index >= 0 && index < questions.length,
      `使用済みインデックスが範囲外: index=${index}, length=${questions.length}`,
    );
  }
}

/**
 * 事後条件: 回答結果が有効か検証する
 *
 * - 回答時間が非負であること
 * - イベントIDが空でないこと
 */
export function assertValidAnswerResult(result: AnswerResult): void {
  assertContract(
    result.speed >= 0,
    `回答時間が負: ${result.speed}`,
  );
  assertContract(
    result.eventId.length > 0,
    'イベントIDが空',
  );
}

/**
 * 不変条件: コンボ値が非負であること
 */
export function assertValidCombo(combo: number): void {
  assertContract(
    combo >= 0,
    `コンボが負: ${combo}`,
  );
}
