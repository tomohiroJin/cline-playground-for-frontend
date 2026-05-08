// checkpoint-time-bonus の単体テスト

import { getStage } from '../../domain/race/stage-catalog';
import { createCampaignRuntime } from '../campaign-runtime';
import { checkpointTimeBonus } from './checkpoint-time-bonus';

describe('checkpointTimeBonus', () => {
  it('ステージのボーナス秒だけ残り時間を加算する', () => {
    const stage = getStage(1);
    const r = createCampaignRuntime(stage);
    const result = checkpointTimeBonus({ ...r, timeRemainingSec: 30 });
    expect(result.runtime.timeRemainingSec).toBe(30 + stage.checkpointBonusSec);
    expect(result.bonusSec).toBe(stage.checkpointBonusSec);
  });

  it('checkpointsHit がインクリメントされる', () => {
    const stage = getStage(1);
    const r = createCampaignRuntime(stage);
    const result = checkpointTimeBonus(r);
    expect(result.runtime.checkpointsHit).toBe(1);
    const result2 = checkpointTimeBonus(result.runtime);
    expect(result2.runtime.checkpointsHit).toBe(2);
  });

  it('elapsedSec / livesRemaining / stage は変わらない', () => {
    const r = createCampaignRuntime(getStage(2), 2);
    const updated = { ...r, elapsedSec: 10 };
    const result = checkpointTimeBonus(updated);
    expect(result.runtime.elapsedSec).toBe(10);
    expect(result.runtime.livesRemaining).toBe(2);
    expect(result.runtime.stage).toBe(r.stage);
  });
});
