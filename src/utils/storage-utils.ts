/**
 * ストレージユーティリティ — バレル再エクスポート（後方互換性のため）
 *
 * Phase 6 のクリーンアップで削除予定。
 */
export type { ClearHistory } from './storage/clearHistory';
export {
  getClearHistory,
  saveClearHistory,
  addClearHistory,
} from './storage/clearHistory';

// extractImageName は shared/utils/image-utils.ts に移動済み
export { extractImageName } from '../shared/utils/image-utils';

export {
  getTotalClears,
  incrementTotalClears,
} from './storage/totalClears';

export {
  getPuzzleRecords,
  savePuzzleRecords,
  recordScore,
  migrateClearHistory,
} from './storage/puzzleRecords';
