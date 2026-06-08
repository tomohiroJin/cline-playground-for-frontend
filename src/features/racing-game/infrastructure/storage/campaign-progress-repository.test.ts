// campaign-progress-repository の単体テスト

import { createInitialProgress, updateBestRecord, unlockNextStage } from '../../domain/race/campaign-progress';
import type { StorageLike } from './campaign-progress-repository';
import { createCampaignProgressRepository } from './campaign-progress-repository';

const createMockStorage = (initial: Record<string, string> = {}): StorageLike & { _data: Record<string, string> } => {
  const data = { ...initial };
  return {
    _data: data,
    getItem(key: string) { return data[key] ?? null; },
    setItem(key: string, value: string) { data[key] = value; },
    removeItem(key: string) { delete data[key]; },
  };
};

describe('campaign-progress-repository', () => {
  it('未保存ならデフォルト進捗を返す', () => {
    const repo = createCampaignProgressRepository(createMockStorage());
    expect(repo.load()).toEqual(createInitialProgress());
  });

  it('保存→読み込みでラウンドトリップする', () => {
    const storage = createMockStorage();
    const repo = createCampaignProgressRepository(storage);
    let progress = createInitialProgress();
    progress = updateBestRecord(progress, 1, { bestTimeSec: 50, rank: 'GOLD' });
    progress = unlockNextStage(progress, 1);
    repo.save(progress);
    expect(repo.load()).toEqual(progress);
  });

  it('不正な JSON はデフォルトにフォールバック', () => {
    const storage = createMockStorage({ 'racing-campaign-progress-v1': '{not json' });
    const repo = createCampaignProgressRepository(storage);
    expect(repo.load()).toEqual(createInitialProgress());
  });

  it('スキーマ違反（version 不一致）でデフォルトにフォールバック', () => {
    const storage = createMockStorage({
      'racing-campaign-progress-v1': JSON.stringify({ version: 999, records: {}, highestUnlocked: 1 }),
    });
    const repo = createCampaignProgressRepository(storage);
    expect(repo.load()).toEqual(createInitialProgress());
  });

  it('records が欠けている場合フォールバック', () => {
    const storage = createMockStorage({
      'racing-campaign-progress-v1': JSON.stringify({ version: 1, highestUnlocked: 1 }),
    });
    const repo = createCampaignProgressRepository(storage);
    expect(repo.load()).toEqual(createInitialProgress());
  });

  it('clear で消去できる', () => {
    const storage = createMockStorage();
    const repo = createCampaignProgressRepository(storage);
    repo.save(createInitialProgress());
    repo.clear();
    expect(storage._data['racing-campaign-progress-v1']).toBeUndefined();
  });

  it('chosenBranch を保存・復元できる', () => {
    const storage = createMockStorage();
    const repo = createCampaignProgressRepository(storage);
    let progress = createInitialProgress();
    progress = updateBestRecord(progress, 3, { bestTimeSec: 60, rank: 'SILVER', chosenBranch: 'b' });
    repo.save(progress);
    expect(repo.load().records[3].chosenBranch).toBe('b');
  });
});
