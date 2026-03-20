/**
 * パズル記録ストア — PuzzleRecordStorage ポートの localStorage 実装
 */
import { PuzzleRecord } from '../../types/puzzle';
import { PuzzleRecordStorage, buildRecordScore } from '../../application/ports/storage-port';
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

  recordScore = buildRecordScore(this);
}
