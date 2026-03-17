/**
 * 勉強会モード問題プール構築
 *
 * 旧 study-question-pool.ts から移動。
 */
import { Question } from '../types';
import { QUESTIONS } from '../../questions';
import { shuffle } from '../../../../utils/math-utils';

/** buildStudyPool のオプション */
export interface BuildStudyPoolOptions {
  /** 最大問題数（0 = 制限なし） */
  limit?: number;
  /** 乱数生成関数（テスト用に注入可能） */
  randomFn?: () => number;
}

/**
 * 選択されたジャンルに該当する問題を全カテゴリから横断的に収集
 *
 * @param selectedTags 選択されたジャンルタグID
 * @param optionsOrLimit オプションオブジェクト、または後方互換用の limit 値
 */
export function buildStudyPool(
  selectedTags: string[],
  optionsOrLimit?: BuildStudyPoolOptions | number,
): Question[] {
  // 後方互換: number が渡された場合はオプションに変換
  const options: BuildStudyPoolOptions =
    typeof optionsOrLimit === 'number'
      ? { limit: optionsOrLimit }
      : optionsOrLimit ?? {};

  const { limit = 0, randomFn = Math.random } = options;

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
  const shuffled = shuffle(allQuestions, randomFn);

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
