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

// パズル記録・累計クリア数の読み書きは application/ports の Storage 実装へ一本化済み。
// ここに残るのは旧データ形式からの一度きりのマイグレーションのみ。
export {
  migrateClearHistory,
} from './storage/puzzleRecords';
