/**
 * buildRecordScore のスコア記録ロジックのテスト
 *
 * とくに「スコアはベストでないが time/moves が改善した再クリア」で
 * bestTime/bestMoves が正しく更新されることを保証する（回帰防止）。
 */
import { buildRecordScore, PuzzleRecordStorage } from './storage-port';
import { PuzzleRecord } from '../../types/puzzle';

/** テスト用のインメモリ PuzzleRecord ストレージ */
const createMemoryStorage = (): Pick<PuzzleRecordStorage, 'get' | 'save'> & {
  records: Map<string, PuzzleRecord>;
} => {
  const records = new Map<string, PuzzleRecord>();
  const keyOf = (imageId: string, division: number) => `${imageId}:${division}`;
  return {
    records,
    get: (imageId, division) => records.get(keyOf(imageId, division)),
    save: (record) => {
      records.set(keyOf(record.imageId, record.division), record);
    },
  };
};

describe('buildRecordScore', () => {
  it('初回クリアはベストスコアとして全フィールドを記録する', () => {
    const storage = createMemoryStorage();
    const recordScore = buildRecordScore(storage);

    const result = recordScore('img', 3, 1000, 'A', 50, 20);

    expect(result.isBestScore).toBe(true);
    const saved = storage.get('img', 3)!;
    expect(saved.bestScore).toBe(1000);
    expect(saved.bestTime).toBe(50);
    expect(saved.bestMoves).toBe(20);
    expect(saved.clearCount).toBe(1);
  });

  it('スコアはベストでなくても time/moves が改善していれば最良値を更新する', () => {
    const storage = createMemoryStorage();
    const recordScore = buildRecordScore(storage);

    // 1回目: 高スコアだが遅い・手数多い
    recordScore('img', 3, 1000, 'A', 80, 40);
    // 2回目: スコアは低いが、より速く・少ない手数でクリア
    const result = recordScore('img', 3, 500, 'B', 30, 15);

    expect(result.isBestScore).toBe(false);
    const saved = storage.get('img', 3)!;
    // ベストスコアと評価は維持
    expect(saved.bestScore).toBe(1000);
    expect(saved.bestRank).toBe('A');
    // time/moves は改善が反映される
    expect(saved.bestTime).toBe(30);
    expect(saved.bestMoves).toBe(15);
    // クリア回数は加算
    expect(saved.clearCount).toBe(2);
  });

  it('スコア非ベストかつ time/moves も悪化した場合は最良値を維持する', () => {
    const storage = createMemoryStorage();
    const recordScore = buildRecordScore(storage);

    recordScore('img', 3, 1000, 'A', 30, 15);
    recordScore('img', 3, 500, 'B', 90, 50);

    const saved = storage.get('img', 3)!;
    expect(saved.bestTime).toBe(30);
    expect(saved.bestMoves).toBe(15);
    expect(saved.clearCount).toBe(2);
  });
});
