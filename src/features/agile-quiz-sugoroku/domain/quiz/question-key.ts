/**
 * 問題の同定キー生成
 *
 * Question 型に id がないため、問題文を正規化したものを安定キーとする。
 * 将来 id 導入時はここだけ差し替えればよい。
 */
import type { Question } from '../types';

/** 問題から安定した同定キーを生成する */
export function makeQuestionKey(question: Question): string {
  const trimmed = question.question.trim();
  // 問題文が空の場合は選択肢を結合してキーにする（同定の衝突を防ぐ）
  return trimmed !== '' ? trimmed : question.options.join('|');
}
