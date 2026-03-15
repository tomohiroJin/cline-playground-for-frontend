/**
 * Agile Quiz Sugoroku - 履歴ストレージ
 *
 * 後方互換用の再エクスポート。
 * 実装は infrastructure/storage/history-repository.ts に移行済み。
 */
import { GameHistoryEntry, SavedGameResult } from './types';
import { LocalStorageAdapter } from './infrastructure/storage/local-storage-adapter';
import { HistoryRepository } from './infrastructure/storage/history-repository';

export { MAX_HISTORY_COUNT } from './infrastructure/storage/history-repository';

const repository = new HistoryRepository(new LocalStorageAdapter());

/** 履歴を読み込む */
export function loadHistory(): GameHistoryEntry[] {
  return repository.loadAll();
}

/** 履歴にエントリを追加 */
export function saveHistory(entry: GameHistoryEntry): void {
  repository.save(entry);
}

/** SavedGameResult から GameHistoryEntry に変換 */
export function toHistoryEntry(result: SavedGameResult): GameHistoryEntry {
  return HistoryRepository.toHistoryEntry(result);
}

/** 履歴を削除する */
export function clearHistory(): void {
  repository.clear();
}

/** 旧 aqs_last_result から履歴へのマイグレーション */
export function migrateLastResultToHistory(): void {
  repository.migrateLastResultToHistory();
}
