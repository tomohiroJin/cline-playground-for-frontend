// campaign-progress.ts の単体テスト

import {
  createInitialProgress,
  unlockNextStage,
  updateBestRecord,
  isCampaignCompleted,
  resetProgress,
} from './campaign-progress';

describe('createInitialProgress', () => {
  it('全ステージ未クリア・ステージ 1 のみアンロック状態を返す', () => {
    const p = createInitialProgress();
    expect(p.highestUnlocked).toBe(1);
    expect(p.records[1].rank).toBe('NONE');
    expect(p.records[8].rank).toBe('NONE');
    expect(p.records[1].bestTimeSec).toBeUndefined();
  });
});

describe('unlockNextStage', () => {
  it('ステージ N をクリアするとステージ N+1 が解放される', () => {
    const p = createInitialProgress();
    const next = unlockNextStage(p, 1);
    expect(next.highestUnlocked).toBe(2);
  });

  it('既に解放されている場合は変化しない', () => {
    const p = unlockNextStage(createInitialProgress(), 1);
    const sameAgain = unlockNextStage(p, 1);
    expect(sameAgain.highestUnlocked).toBe(2);
  });

  it('ステージ 8 をクリアしても 9 は無いので 8 で頭打ち', () => {
    let p = createInitialProgress();
    for (let i = 1; i <= 7; i++) {
      p = unlockNextStage(p, i as 1 | 2 | 3 | 4 | 5 | 6 | 7);
    }
    p = unlockNextStage(p, 8);
    expect(p.highestUnlocked).toBe(8);
  });
});

describe('updateBestRecord', () => {
  it('未クリア状態に新記録を設定すると登録される', () => {
    const p = createInitialProgress();
    const updated = updateBestRecord(p, 1, { bestTimeSec: 60, rank: 'SILVER' });
    expect(updated.records[1].bestTimeSec).toBe(60);
    expect(updated.records[1].rank).toBe('SILVER');
  });

  it('より速いタイムなら更新される', () => {
    const p = updateBestRecord(createInitialProgress(), 1, { bestTimeSec: 60, rank: 'SILVER' });
    const updated = updateBestRecord(p, 1, { bestTimeSec: 50, rank: 'GOLD' });
    expect(updated.records[1].bestTimeSec).toBe(50);
    expect(updated.records[1].rank).toBe('GOLD');
  });

  it('遅いタイムでは更新されない', () => {
    const p = updateBestRecord(createInitialProgress(), 1, { bestTimeSec: 50, rank: 'GOLD' });
    const updated = updateBestRecord(p, 1, { bestTimeSec: 60, rank: 'SILVER' });
    expect(updated.records[1].bestTimeSec).toBe(50);
    expect(updated.records[1].rank).toBe('GOLD');
  });

  it('同じタイムでは更新されない（既存を尊重）', () => {
    const p = updateBestRecord(createInitialProgress(), 1, { bestTimeSec: 50, rank: 'GOLD' });
    const updated = updateBestRecord(p, 1, { bestTimeSec: 50, rank: 'GOLD' });
    expect(updated.records[1].bestTimeSec).toBe(50);
  });

  it('chosenBranch も保存できる', () => {
    const p = createInitialProgress();
    const updated = updateBestRecord(p, 3, { bestTimeSec: 70, rank: 'BRONZE', chosenBranch: 'b' });
    expect(updated.records[3].chosenBranch).toBe('b');
  });
});

describe('isCampaignCompleted', () => {
  it('ステージ 8 が未クリアなら false', () => {
    expect(isCampaignCompleted(createInitialProgress())).toBe(false);
  });

  it('highestUnlocked が 8 でもステージ 8 のランクが NONE なら false', () => {
    let p = createInitialProgress();
    for (let i = 1; i <= 7; i++) {
      p = unlockNextStage(p, i as 1 | 2 | 3 | 4 | 5 | 6 | 7);
    }
    p = unlockNextStage(p, 8);
    expect(isCampaignCompleted(p)).toBe(false);
  });

  it('ステージ 8 にランクが付いていれば true', () => {
    let p = createInitialProgress();
    for (let i = 1; i <= 7; i++) {
      p = unlockNextStage(p, i as 1 | 2 | 3 | 4 | 5 | 6 | 7);
    }
    p = unlockNextStage(p, 8);
    p = updateBestRecord(p, 8, { bestTimeSec: 50, rank: 'GOLD' });
    expect(isCampaignCompleted(p)).toBe(true);
  });
});

describe('resetProgress', () => {
  it('createInitialProgress と同じ状態を返す', () => {
    expect(resetProgress()).toEqual(createInitialProgress());
  });
});
