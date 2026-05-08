// handle-stage-clear の単体テスト

import { getStage } from '../../domain/race/stage-catalog';
import { createInitialProgress } from '../../domain/race/campaign-progress';
import { handleStageClear } from './handle-stage-clear';

describe('handleStageClear', () => {
  it('クリア時にベストタイムが記録され、次ステージがアンロックされる', () => {
    const progress = createInitialProgress();
    const updated = handleStageClear({
      progress,
      stage: getStage(1),
      goalTimeSec: 50,
      rank: 'GOLD',
    });
    expect(updated.records[1].bestTimeSec).toBe(50);
    expect(updated.records[1].rank).toBe('GOLD');
    expect(updated.highestUnlocked).toBe(2);
  });

  it('遅いタイムでもアンロックは進む（記録は更新しない）', () => {
    const initial = handleStageClear({
      progress: createInitialProgress(),
      stage: getStage(1),
      goalTimeSec: 50,
      rank: 'GOLD',
    });
    const updated = handleStageClear({
      progress: initial,
      stage: getStage(1),
      goalTimeSec: 60,
      rank: 'SILVER',
    });
    expect(updated.records[1].bestTimeSec).toBe(50);
    expect(updated.records[1].rank).toBe('GOLD');
    expect(updated.highestUnlocked).toBe(2);
  });

  it('chosenBranch を保存する', () => {
    const updated = handleStageClear({
      progress: createInitialProgress(),
      stage: getStage(3),
      goalTimeSec: 60,
      rank: 'SILVER',
      chosenBranch: 'b',
    });
    expect(updated.records[3].chosenBranch).toBe('b');
  });
});
