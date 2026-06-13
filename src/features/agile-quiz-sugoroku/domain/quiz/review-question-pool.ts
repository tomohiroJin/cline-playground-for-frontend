/**
 * 復習出題プールの組み立て
 *
 * 誤答 / ブックマーク / タグ別 の 3 ソースから復習問題配列を作る。
 */
import type { Question, ReviewEntry } from '../types';

/** 復習ソース種別 */
export type ReviewSource = 'wrong' | 'bookmark' | 'tag';

/** buildReviewPool の入力 */
export interface ReviewPoolInput {
  source: ReviewSource;
  /** source=tag のときの対象タグ */
  tagId?: string;
  wrong: ReviewEntry[];
  bookmarks: ReviewEntry[];
  /** タグ id → そのタグを含む全問題 */
  allByTag: Record<string, Question[]>;
}

/** 復習問題プールを組み立てる */
export function buildReviewPool(input: ReviewPoolInput): Question[] {
  switch (input.source) {
    case 'wrong':
      return input.wrong.map((e) => e.question);
    case 'bookmark':
      return input.bookmarks.map((e) => e.question);
    case 'tag':
      return input.tagId ? (input.allByTag[input.tagId] ?? []) : [];
    default:
      return [];
  }
}
