import { PuzzleScore, PuzzleRecord } from '../../types/puzzle';
import { readLocalStorage, writeLocalStorage } from './localStorage';
import { getClearHistory } from './clearHistory';

const RECORDS_KEY = 'puzzle_records';

/**
 * パズル記録をローカルストレージから取得する
 */
export const getPuzzleRecords = (): PuzzleRecord[] => {
  return readLocalStorage<PuzzleRecord[]>(RECORDS_KEY, []);
};

/**
 * パズル記録をローカルストレージに保存する
 */
export const savePuzzleRecords = (records: PuzzleRecord[]): void => {
  writeLocalStorage(RECORDS_KEY, records);
};

/**
 * スコアを記録し、ベスト更新があれば true を返す
 */
export const recordScore = (
  imageId: string,
  division: number,
  score: PuzzleScore
): { record: PuzzleRecord; isBestScore: boolean } => {
  const records = getPuzzleRecords();
  const existing = records.find(
    r => r.imageId === imageId && r.division === division
  );

  if (existing) {
    const isBestScore = score.totalScore > existing.bestScore;
    const updated: PuzzleRecord = {
      ...existing,
      bestScore: Math.max(existing.bestScore, score.totalScore),
      bestRank: isBestScore ? score.rank : existing.bestRank,
      bestTime: Math.min(existing.bestTime, score.elapsedTime),
      bestMoves: existing.bestMoves === null
        ? score.moveCount
        : Math.min(existing.bestMoves, score.moveCount),
      clearCount: existing.clearCount + 1,
      lastClearDate: new Date().toISOString(),
    };
    savePuzzleRecords(records.map(r =>
      r.imageId === imageId && r.division === division ? updated : r
    ));
    return { record: updated, isBestScore };
  }

  const newRecord: PuzzleRecord = {
    imageId,
    division,
    bestScore: score.totalScore,
    bestRank: score.rank,
    bestTime: score.elapsedTime,
    bestMoves: score.moveCount,
    clearCount: 1,
    lastClearDate: new Date().toISOString(),
  };
  savePuzzleRecords([...records, newRecord]);
  return { record: newRecord, isBestScore: true };
};

/**
 * 旧 ClearHistory から PuzzleRecord へマイグレーションする
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

  savePuzzleRecords(records);
  localStorage.setItem(MIGRATION_KEY, 'done');
};
