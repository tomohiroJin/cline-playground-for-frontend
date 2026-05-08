// キャンペーン進捗（永続化対象、純粋関数）

import type { StageId } from './stage';
import type { StageRank } from './rank';

export type StageRecord = {
  /** ベストタイム（秒）。未クリアは undefined */
  readonly bestTimeSec?: number;
  /** ベストランク。未クリアは 'NONE' */
  readonly rank: StageRank;
  /**
   * 分岐ステージで選択された側。Phase 1〜2 では分岐ステージは a を既定とする。
   * 既存セーブで undefined が混在した場合、リポジトリ読み込み時に 'a' へマイグレーションする。
   */
  readonly chosenBranch?: 'a' | 'b';
};

export type CampaignProgress = {
  readonly records: Record<StageId, StageRecord>;
  readonly highestUnlocked: StageId;
};

const ALL_STAGE_IDS: readonly StageId[] = [1, 2, 3, 4, 5, 6, 7, 8];
const FINAL_STAGE_ID: StageId = ALL_STAGE_IDS[ALL_STAGE_IDS.length - 1] as StageId;

const emptyRecord = (): StageRecord => ({ rank: 'NONE' });

/** 初期進捗（ステージ 1 のみアンロック・全ステージ未クリア） */
export const createInitialProgress = (): CampaignProgress => ({
  records: ALL_STAGE_IDS.reduce(
    (acc, id) => ({ ...acc, [id]: emptyRecord() }),
    {} as Record<StageId, StageRecord>,
  ),
  highestUnlocked: 1,
});

/** クリアしたステージ ID から次ステージを解放した進捗を返す（純粋関数） */
export const unlockNextStage = (
  progress: CampaignProgress,
  clearedId: StageId,
): CampaignProgress => {
  const nextUnlocked = Math.min(clearedId + 1, FINAL_STAGE_ID) as StageId;
  if (nextUnlocked <= progress.highestUnlocked) return progress;
  return { ...progress, highestUnlocked: nextUnlocked };
};

/**
 * ベスト記録を更新（より速いタイムのときのみ更新）。
 * 既存記録より遅い、または同タイムは無視する（既存尊重）。
 */
export const updateBestRecord = (
  progress: CampaignProgress,
  stageId: StageId,
  newRecord: Required<Pick<StageRecord, 'bestTimeSec' | 'rank'>> & Partial<StageRecord>,
): CampaignProgress => {
  const existing = progress.records[stageId];
  const isFaster =
    existing.bestTimeSec === undefined || newRecord.bestTimeSec < existing.bestTimeSec;
  if (!isFaster) return progress;
  return {
    ...progress,
    records: {
      ...progress.records,
      [stageId]: { ...existing, ...newRecord },
    },
  };
};

/**
 * キャンペーン全クリア判定（派生プロパティ）。
 * `completed` フィールドを別持ちすると不整合を生むため、必ずこの関数で判定する。
 */
export const isCampaignCompleted = (progress: CampaignProgress): boolean =>
  progress.highestUnlocked === FINAL_STAGE_ID &&
  progress.records[FINAL_STAGE_ID].rank !== 'NONE';

/** RESET PROGRESS 用。初期進捗を返す */
export const resetProgress = (): CampaignProgress => createInitialProgress();
