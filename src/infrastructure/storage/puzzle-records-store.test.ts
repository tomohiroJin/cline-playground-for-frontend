/**
 * パズル記録ストアのテスト
 *
 * getAll/get/save の round-trip と、buildRecordScore 経由の recordScore が
 * ベストスコア判定・最良値更新を正しく永続化することを検証する。
 */
import { LocalPuzzleRecordStorage } from './puzzle-records-store';

describe('LocalPuzzleRecordStorage', () => {
  let store: LocalPuzzleRecordStorage;

  beforeEach(() => {
    localStorage.clear();
    store = new LocalPuzzleRecordStorage();
  });

  it('未保存の場合 getAll は空配列を返す', () => {
    expect(store.getAll()).toEqual([]);
  });

  it('save した記録を get/getAll で取得できる', () => {
    store.save({
      imageId: 'img',
      division: 4,
      bestScore: 100,
      bestRank: '★★☆',
      bestTime: 60,
      bestMoves: 30,
      clearCount: 1,
      lastClearDate: '2025-01-01T00:00:00.000Z',
    });

    expect(store.getAll()).toHaveLength(1);
    expect(store.get('img', 4)?.bestScore).toBe(100);
    expect(store.get('img', 99)).toBeUndefined();
  });

  it('同一 imageId×division の save は既存レコードを更新する', () => {
    const base = {
      imageId: 'img',
      division: 4,
      bestRank: '★★☆' as const,
      bestTime: 60,
      bestMoves: 30,
      clearCount: 1,
      lastClearDate: '2025-01-01T00:00:00.000Z',
    };
    store.save({ ...base, bestScore: 100 });
    store.save({ ...base, bestScore: 200 });

    expect(store.getAll()).toHaveLength(1);
    expect(store.get('img', 4)?.bestScore).toBe(200);
  });

  it('recordScore はベストスコア更新時に isBestScore=true を返し永続化する', () => {
    const first = store.recordScore('img', 4, 500, '★★☆', 80, 40);
    expect(first.isBestScore).toBe(true);

    // 高スコアで再クリア → ベスト更新
    const better = store.recordScore('img', 4, 900, '★★★', 50, 25);
    expect(better.isBestScore).toBe(true);

    const saved = store.get('img', 4)!;
    expect(saved.bestScore).toBe(900);
    expect(saved.bestTime).toBe(50);
    expect(saved.clearCount).toBe(2);
  });

  it('recordScore はスコア非ベストでも time/moves の改善を反映する', () => {
    store.recordScore('img', 4, 900, '★★★', 80, 40);
    const result = store.recordScore('img', 4, 300, '★☆☆', 30, 15);

    expect(result.isBestScore).toBe(false);
    const saved = store.get('img', 4)!;
    expect(saved.bestScore).toBe(900);
    expect(saved.bestTime).toBe(30);
    expect(saved.bestMoves).toBe(15);
    expect(saved.clearCount).toBe(2);
  });
});
