// campaign-runtime.ts の単体テスト

import { getStage } from '../domain/race/stage-catalog';
import { INITIAL_LIVES } from '../domain/race/lives';
import { createCampaignRuntime } from './campaign-runtime';

describe('createCampaignRuntime', () => {
  it('ステージ 1 のランタイムを初期値で生成する', () => {
    const stage = getStage(1);
    const r = createCampaignRuntime(stage);
    expect(r.stage).toBe(stage);
    expect(r.timeRemainingSec).toBe(stage.initialTimeSec);
    expect(r.elapsedSec).toBe(0);
    expect(r.checkpointsHit).toBe(0);
    expect(r.livesRemaining).toBe(INITIAL_LIVES);
  });

  it('残機を引き継ぐ', () => {
    const stage = getStage(1);
    const r = createCampaignRuntime(stage, 2);
    expect(r.livesRemaining).toBe(2);
  });

  it('別ステージでも仕様どおり', () => {
    const stage = getStage(8);
    const r = createCampaignRuntime(stage, 3);
    expect(r.timeRemainingSec).toBe(stage.initialTimeSec);
  });
});
