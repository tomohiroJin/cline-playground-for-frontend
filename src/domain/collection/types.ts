import { PuzzleRank } from '../../types/puzzle';

/** 作品1点の収蔵状況（同一 imageId の複数難易度レコードを集約した結果） */
export interface ArtworkStatus {
  readonly imageId: string;
  /** themes から引いた表示名（alt を流用） */
  readonly title: string;
  /** サムネイル用ファイル名 */
  readonly filename: string;
  /** 1回以上クリア済みか */
  readonly isCollected: boolean;
  /** 集約後の最高鑑定評価（未収蔵は undefined） */
  readonly bestRank?: PuzzleRank;
  /** 集約後のベストスコア最大値 */
  readonly bestScore: number;
  /** 集約後のベストタイム最小値（未収蔵は undefined） */
  readonly bestTime?: number;
  /** 集約後の最少手数（未取得は undefined） */
  readonly bestMoves?: number;
  /** 全難易度合算のクリア回数 */
  readonly clearCount: number;
  /** 最終クリア日時（ISO文字列・未収蔵は undefined） */
  readonly lastClearDate?: string;
}

/** 展示室1室の収蔵状況 */
export interface RoomCollection {
  readonly themeId: string;
  readonly name: string;
  readonly description: string;
  readonly isUnlocked: boolean;
  /** 未開館時の解放条件文言（開館済みは undefined） */
  readonly unlockHint?: string;
  readonly collectedCount: number;
  readonly totalCount: number;
  readonly artworks: readonly ArtworkStatus[];
}

/** 名誉学芸員（段階ゴール）の進捗 */
export interface CuratorGoal {
  /** 収蔵済み作品数 */
  readonly collected: number;
  /** ★★★収蔵の作品数 */
  readonly appraised3star: number;
  /** 全作品数（=15） */
  readonly total: number;
  /** 全作品を★★★収蔵したか */
  readonly isHonorary: boolean;
}

/** 収蔵目録ビューが受け取る集約全体 */
export interface CollectionSummary {
  readonly rooms: readonly RoomCollection[];
  readonly goal: CuratorGoal;
}
