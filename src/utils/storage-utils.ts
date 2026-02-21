/**
 * ストレージユーティリティ — バレル再エクスポート（後方互換性のため）
 */
export type { ClearHistory } from './storage/clearHistory';
export {
  getClearHistory,
  saveClearHistory,
  addClearHistory,
  extractImageName,
} from './storage/clearHistory';

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
