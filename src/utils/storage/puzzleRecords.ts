import { PuzzleRecord } from '../../types/puzzle';
import { writeLocalStorage } from './localStorage';
import { getClearHistory } from './clearHistory';

const RECORDS_KEY = 'puzzle_records';

/**
 * 旧 ClearHistory から PuzzleRecord へマイグレーションする
 *
 * 通常のパズル記録の読み書きは application/ports の PuzzleRecordStorage
 * （infrastructure/storage の実装）へ一本化済み。本関数は旧データ形式から
 * PuzzleRecord への一度きりの移行のみを担う。
 */
export const migrateClearHistory = (): void => {
  const MIGRATION_KEY = 'puzzle_migration_v1';
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const oldHistory = getClearHistory();
  if (oldHistory.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'done');
    return;
  }

  const grouped = new Map<string, typeof oldHistory>();
  for (const entry of oldHistory) {
    const list = grouped.get(entry.imageName) ?? [];
    list.push(entry);
    grouped.set(entry.imageName, list);
  }

  const records: PuzzleRecord[] = [];
  for (const [imageId, entries] of grouped) {
    const bestEntry = entries.reduce((a, b) =>
      a.clearTime < b.clearTime ? a : b
    );
    records.push({
      imageId,
      division: 4,
      bestScore: 0,
      bestRank: 'クリア',
      bestTime: bestEntry.clearTime,
      bestMoves: null,
      clearCount: entries.length,
      lastClearDate: bestEntry.clearDate,
    });
  }

  writeLocalStorage(RECORDS_KEY, records);
  localStorage.setItem(MIGRATION_KEY, 'done');
};
