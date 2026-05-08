// advance-stage-time の単体テスト

import { getStage } from '../../domain/race/stage-catalog';
import { createCampaignRuntime } from '../campaign-runtime';
import { advanceStageTime } from './advance-stage-time';

describe('advanceStageTime', () => {
  it('残り時間を減らし、経過時間を加算する', () => {
    const r = createCampaignRuntime(getStage(1));
    const updated = advanceStageTime(r, 1);
    expect(updated.timeRemainingSec).toBe(r.timeRemainingSec - 1);
    expect(updated.elapsedSec).toBe(1);
  });

  it('残り時間 0 でクランプ、経過時間は増え続ける', () => {
    const r = createCampaignRuntime(getStage(1));
    const updated = advanceStageTime({ ...r, timeRemainingSec: 0.3 }, 1);
    expect(updated.timeRemainingSec).toBe(0);
    expect(updated.elapsedSec).toBe(r.elapsedSec + 1);
  });

  it('runtime のステージや残機は変わらない', () => {
    const r = createCampaignRuntime(getStage(1), 2);
    const updated = advanceStageTime(r, 0.5);
    expect(updated.stage).toBe(r.stage);
    expect(updated.livesRemaining).toBe(2);
  });
});
