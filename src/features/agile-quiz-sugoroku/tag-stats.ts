/**
 * ジャンル別統計ユーティリティ（後方互換用）
 *
 * 実体は domain/quiz/tag-stats.ts に移動済み。
 * 既存のインポートパスを壊さないよう再エクスポートを維持する。
 */
export {
  getTagColor,
  computeTagStatEntries,
  getWeakGenres,
  getWeakGenreIds,
} from './domain/quiz';
export type { TagStatEntry } from './domain/quiz';
