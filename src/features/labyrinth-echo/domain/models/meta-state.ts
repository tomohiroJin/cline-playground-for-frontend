/**
 * 迷宮の残響 - MetaState 集約ルート
 *
 * 周回情報を保持する集約ルート。
 */
import type { DifficultyId } from './difficulty';

/** 前回ラン情報 */
export interface LastRunInfo {
  readonly cause: string;
  readonly floor: number;
  readonly endingId: string | null;
  readonly hp: number;
  readonly mn: number;
  readonly inf: number;
}

/** メタデータ（周回情報） */
export interface MetaState {
  readonly runs: number;
  readonly escapes: number;
  readonly kp: number;
  readonly unlocked: readonly string[];
  readonly bestFloor: number;
  readonly totalEvents: number;
  readonly endings: readonly string[];
  readonly clearedDifficulties: readonly DifficultyId[];
  readonly totalDeaths: number;
  readonly lastRun: LastRunInfo | null;
  readonly activeTitle: string | null;
}

/** 初期メタ状態の正規形 — 初期化とリセットの単一ソース (DRY) */
export const FRESH_META: Readonly<MetaState> = Object.freeze({
  runs: 0,
  escapes: 0,
  kp: 0,
  unlocked: [],
  bestFloor: 0,
  totalEvents: 0,
  endings: [],
  clearedDifficulties: [],
  totalDeaths: 0,
  lastRun: null,
  activeTitle: null,
});

/** 初期MetaStateを生成する（FRESH_META をベースに上書き） */
export const createMetaState = (overrides: Partial<MetaState> = {}): MetaState => ({
  ...FRESH_META,
  ...overrides,
});
