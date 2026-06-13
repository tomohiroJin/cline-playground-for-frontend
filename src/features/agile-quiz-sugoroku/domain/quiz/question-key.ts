/**
 * 問題の同定キー生成
 *
 * Question 型に id がないため、問題文を正規化したものを安定キーとする。
 * 将来 id 導入時はここだけ差し替えればよい。
 */
import type { Question } from '../types';

/** 問題から安定した同定キーを生成する */
export function makeQuestionKey(question: Question): string {
  return question.question.trim();
}
