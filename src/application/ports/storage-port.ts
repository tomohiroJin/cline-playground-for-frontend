/**
 * ストレージポート（インターフェース）
 *
 * ドメイン層がストレージの具体実装に依存しないようにする。
 */
import { PuzzleRecord } from '../../types/puzzle';

/** パズル記録ストレージ */
export interface PuzzleRecordStorage {
  /** 全記録を取得する */
  getAll(): PuzzleRecord[];
  /** 特定の画像×難易度の記録を取得する */
  get(imageId: string, division: number): PuzzleRecord | undefined;
  /** 記録を保存する */
  save(record: PuzzleRecord): void;
  /** スコアを記録する（ベストスコア判定付き） */
  recordScore(
    imageId: string,
    division: number,
    score: number,
    rank: PuzzleRecord['bestRank'],
    time: number,
    moves: number
  ): { isBestScore: boolean };
}

/** 累計クリア数ストレージ */
export interface TotalClearsStorage {
  /** 累計クリア数を取得する */
  get(): number;
  /** 累計クリア数をインクリメントする */
  increment(): number;
}

/**
 * スコア記録の共通ロジック
 *
 * ベストスコア判定・レコード更新のロジックを一元管理する。
 * ストレージ実装（Local / Mock）で重複しないようにするためのヘルパー。
 */
export const buildRecordScore = (
  storage: Pick<PuzzleRecordStorage, 'get' | 'save'>
) => (
  imageId: string,
  division: number,
  score: number,
  rank: PuzzleRecord['bestRank'],
  time: number,
  moves: number
): { isBestScore: boolean } => {
  const existing = storage.get(imageId, division);
  const isBestScore = !existing || score > existing.bestScore;

  if (isBestScore) {
    storage.save({
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
    storage.save({
      ...existing,
      clearCount: existing.clearCount + 1,
      lastClearDate: new Date().toISOString(),
    });
  }

  return { isBestScore };
};

/** クリア履歴ストレージ */
export interface ClearHistoryStorage {
  /** クリア履歴を取得する */
  getAll(): readonly { imageName: string; elapsedTime: number; date: string }[];
  /** クリア履歴を追加する */
  add(imageName: string, elapsedTime: number): void;
}
