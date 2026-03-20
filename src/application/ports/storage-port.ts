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

/** クリア履歴ストレージ */
export interface ClearHistoryStorage {
  /** クリア履歴を取得する */
  getAll(): readonly { imageName: string; elapsedTime: number; date: string }[];
  /** クリア履歴を追加する */
  add(imageName: string, elapsedTime: number): void;
}
