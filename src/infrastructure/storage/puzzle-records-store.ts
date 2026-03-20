/**
 * パズル記録ストア — PuzzleRecordStorage ポートの localStorage 実装
 */
import { PuzzleRecord } from '../../types/puzzle';
import { PuzzleRecordStorage } from '../../application/ports/storage-port';
import { readLocalStorage, writeLocalStorage } from './local-storage-adapter';

const RECORDS_KEY = 'puzzle_records';

/**
 * localStorage ベースのパズル記録ストレージ
 */
export class LocalPuzzleRecordStorage implements PuzzleRecordStorage {
  getAll(): PuzzleRecord[] {
    return readLocalStorage<PuzzleRecord[]>(RECORDS_KEY, []);
  }

  get(imageId: string, division: number): PuzzleRecord | undefined {
    return this.getAll().find(r => r.imageId === imageId && r.division === division);
  }

  save(record: PuzzleRecord): void {
    const records = this.getAll();
    const index = records.findIndex(
      r => r.imageId === record.imageId && r.division === record.division
    );
    if (index >= 0) {
      records[index] = record;
    } else {
      records.push(record);
    }
    writeLocalStorage(RECORDS_KEY, records);
  }

  recordScore(
    imageId: string,
    division: number,
    score: number,
    rank: PuzzleRecord['bestRank'],
    time: number,
    moves: number
  ): { isBestScore: boolean } {
    const existing = this.get(imageId, division);
    const isBestScore = !existing || score > existing.bestScore;

    if (isBestScore) {
      this.save({
        imageId,
        division,
        bestScore: score,
        bestRank: rank,
        bestTime: existing ? Math.min(existing.bestTime, time) : time,
        bestMoves: existing?.bestMoves !== null && existing?.bestMoves !== undefined
          ? Math.min(existing.bestMoves, moves)
          : moves,
        clearCount: (existing?.clearCount ?? 0) + 1,
        lastClearDate: new Date().toISOString(),
      });
    } else if (existing) {
      this.save({
        ...existing,
        clearCount: existing.clearCount + 1,
        lastClearDate: new Date().toISOString(),
      });
    }

    return { isBestScore };
  }
}
