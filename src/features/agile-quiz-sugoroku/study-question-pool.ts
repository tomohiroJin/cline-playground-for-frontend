/**
 * Agile Quiz Sugoroku - 勉強会モード問題プール構築
 */
import { Question } from './types';
import { QUESTIONS } from './quiz-data';

/** 配列をシャッフル（Fisher-Yates） */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 選択されたジャンルに該当する問題を全カテゴリから横断的に収集
 * @param selectedTags 選択されたジャンルタグID
 * @param limit 最大問題数（0 = 制限なし）
 */
export function buildStudyPool(selectedTags: string[], limit: number = 0): Question[] {
  const allQuestions: Question[] = [];

  // 全カテゴリから問題を収集
  for (const questions of Object.values(QUESTIONS)) {
    for (const q of questions) {
      if (q.tags && q.tags.some((t) => selectedTags.includes(t))) {
        allQuestions.push(q);
      }
    }
  }

  // シャッフル
  const shuffled = shuffleArray(allQuestions);

  // 制限
  if (limit > 0 && shuffled.length > limit) {
    return shuffled.slice(0, limit);
  }

  return shuffled;
}

/** 選択ジャンルの問題数を取得（UI表示用） */
export function countStudyQuestions(selectedTags: string[]): number {
  let count = 0;
  for (const questions of Object.values(QUESTIONS)) {
    for (const q of questions) {
      if (q.tags && q.tags.some((t) => selectedTags.includes(t))) {
        count++;
      }
    }
  }
  return count;
}
