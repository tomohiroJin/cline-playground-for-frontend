// キャンペーン進捗の localStorage アダプタ（CampaignProgressPort 実装）
//
// schema:
//   { version: 1, records: Record<StageId, StageRecord>, highestUnlocked: StageId }
//
// 不正データの場合はログを残してデフォルト進捗を返す（壊れた JSON でゲームを止めない）。

import type { CampaignProgressPort } from '../../application/ports/campaign-progress-port';
import type { CampaignProgress, StageRecord } from '../../domain/race/campaign-progress';
import type { StageId } from '../../domain/race/stage';
import { createInitialProgress } from '../../domain/race/campaign-progress';

const STORAGE_KEY = 'racing-campaign-progress-v1';
const SCHEMA_VERSION = 1;

type StoredProgress = {
  readonly version: 1;
  readonly records: Record<StageId, StageRecord>;
  readonly highestUnlocked: StageId;
};

const isValidStageId = (id: unknown): id is StageId =>
  typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 8;

const isValidRank = (rank: unknown): rank is StageRecord['rank'] =>
  rank === 'GOLD' || rank === 'SILVER' || rank === 'BRONZE' || rank === 'NONE';

const isValidRecord = (rec: unknown): rec is StageRecord => {
  if (typeof rec !== 'object' || rec === null) return false;
  const r = rec as Partial<StageRecord>;
  if (!isValidRank(r.rank)) return false;
  if (r.bestTimeSec !== undefined && typeof r.bestTimeSec !== 'number') return false;
  if (r.chosenBranch !== undefined && r.chosenBranch !== 'a' && r.chosenBranch !== 'b') return false;
  return true;
};

const isValidStored = (data: unknown): data is StoredProgress => {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Partial<StoredProgress>;
  if (d.version !== SCHEMA_VERSION) return false;
  if (!isValidStageId(d.highestUnlocked)) return false;
  if (typeof d.records !== 'object' || d.records === null) return false;
  for (let i = 1; i <= 8; i++) {
    const rec = (d.records as Record<number, unknown>)[i];
    if (!isValidRecord(rec)) return false;
  }
  return true;
};

// chosenBranch のマイグレーションについて:
// spec §5.5 では「undefined は 'a' とみなす」と規定しているが、保存データを書き換える
// のではなく、プレゼンテーション層で `chosenBranch ?? 'a'` のように扱うのが適切。
// プレイヤが意図しない 'a' を保存することを防ぐため、ここでは undefined のまま保持する。

/**
 * Storage インターフェース（テスト時にモック差替可能）。
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const createCampaignProgressRepository = (
  storage: StorageLike = window.localStorage,
): CampaignProgressPort => ({
  load(): CampaignProgress {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return createInitialProgress();
    try {
      const data = JSON.parse(raw) as unknown;
      if (!isValidStored(data)) {
        console.warn('[campaign-progress] invalid stored data, using default');
        return createInitialProgress();
      }
      return {
        records: data.records,
        highestUnlocked: data.highestUnlocked,
      };
    } catch (e) {
      console.warn('[campaign-progress] parse error, using default', e);
      return createInitialProgress();
    }
  },

  save(progress: CampaignProgress): void {
    const stored: StoredProgress = {
      version: SCHEMA_VERSION,
      records: progress.records,
      highestUnlocked: progress.highestUnlocked,
    };
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {
      console.warn('[campaign-progress] save failed', e);
    }
  },

  clear(): void {
    storage.removeItem(STORAGE_KEY);
  },
});
