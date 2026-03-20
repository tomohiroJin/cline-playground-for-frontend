/**
 * ストレージポートのモック実装
 *
 * テスト用のインメモリ実装。
 */
import { PuzzleRecord } from '../types/puzzle';
import {
  PuzzleRecordStorage,
  TotalClearsStorage,
  ClearHistoryStorage,
} from '../application/ports/storage-port';

/** パズル記録のインメモリ実装 */
export class MockPuzzleRecordStorage implements PuzzleRecordStorage {
  private records: PuzzleRecord[] = [];

  getAll(): PuzzleRecord[] {
    return [...this.records];
  }

  get(imageId: string, division: number): PuzzleRecord | undefined {
    return this.records.find(r => r.imageId === imageId && r.division === division);
  }

  save(record: PuzzleRecord): void {
    const index = this.records.findIndex(
      r => r.imageId === record.imageId && r.division === record.division
    );
    if (index >= 0) {
      this.records[index] = record;
    } else {
      this.records.push(record);
    }
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

/** 累計クリア数のインメモリ実装 */
export class MockTotalClearsStorage implements TotalClearsStorage {
  private count = 0;

  get(): number {
    return this.count;
  }

  increment(): number {
    return ++this.count;
  }
}

/** クリア履歴のインメモリ実装 */
export class MockClearHistoryStorage implements ClearHistoryStorage {
  private history: { imageName: string; elapsedTime: number; date: string }[] = [];

  getAll(): readonly { imageName: string; elapsedTime: number; date: string }[] {
    return [...this.history];
  }

  add(imageName: string, elapsedTime: number): void {
    this.history.push({
      imageName,
      elapsedTime,
      date: new Date().toISOString(),
    });
  }
}
