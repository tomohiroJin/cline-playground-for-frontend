/**
 * 問題選択（純粋関数）
 *
 * 旧 game-logic.ts の pickQuestion を純粋化。
 * Math.random の代わりに randomFn を引数で受け取る。
 */
import { Question } from '../types';

/** pickQuestion のオプション */
export interface PickQuestionOptions {
  /** 使用済み問題インデックス */
  usedIndices?: Set<number>;
  /** 乱数生成関数（テスト用に注入可能） */
  randomFn?: () => number;
}

/**
 * 問題を選択（純粋関数 - 問題配列を引数で受け取る）
 *
 * @param questions 問題配列
 * @param optionsOrUsedIndices オプションオブジェクト、または後方互換用の usedIndices
 */
export function pickQuestion(
  questions: Question[],
  optionsOrUsedIndices?: PickQuestionOptions | Set<number>,
): { question: Question; index: number } {
  // 後方互換: Set<number> が渡された場合はオプションに変換
  const options: PickQuestionOptions =
    optionsOrUsedIndices instanceof Set
      ? { usedIndices: optionsOrUsedIndices }
      : optionsOrUsedIndices ?? {};

  const { usedIndices, randomFn = Math.random } = options;
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
      ? available[Math.floor(randomFn() * available.length)]
      : Math.floor(randomFn() * questions.length);

  return { question: questions[index], index };
}
