/**
 * 問題選択（純粋関数）
 *
 * 旧 game-logic.ts の pickQuestion を純粋化。
 * Math.random の代わりに randomFn を引数で受け取る。
 */
import { Question } from '../types';

/** 問題を選択（純粋関数 - 問題配列を引数で受け取る） */
export function pickQuestion(
  questions: Question[],
  usedIndices?: Set<number>,
  randomFn: () => number = Math.random,
): { question: Question; index: number } {
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
