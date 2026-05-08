// campaign-tick の単体テスト

import { getStage } from '../../domain/race/stage-catalog';
import { createCampaignRuntime } from '../campaign-runtime';
import { executeCampaignTick } from './campaign-tick';

describe('executeCampaignTick', () => {
  const stage = getStage(1);

  it('チェックポイントヒットなしで時間が進む', () => {
    const r = createCampaignRuntime(stage);
    const result = executeCampaignTick({
      runtime: r,
      prevCheckpointFlags: 0b0001,
      currentCheckpointFlags: 0b0001,
      hasCrossedFinishLine: false,
      dt: 1,
    });
    expect(result.runtime.timeRemainingSec).toBe(stage.initialTimeSec - 1);
    expect(result.runtime.elapsedSec).toBe(1);
    expect(result.appliedBonusSec).toBeUndefined();
    expect(result.outcome.kind).toBe('in_progress');
  });

  it('新しいチェックポイント通過でボーナスが加算される（時間進行も同時）', () => {
    const r = createCampaignRuntime(stage);
    const result = executeCampaignTick({
      runtime: r,
      prevCheckpointFlags: 0b0001,
      currentCheckpointFlags: 0b0011,  // ビット 1 が新規
      hasCrossedFinishLine: false,
      dt: 1,
    });
    expect(result.runtime.timeRemainingSec).toBe(stage.initialTimeSec + stage.checkpointBonusSec - 1);
    expect(result.runtime.checkpointsHit).toBe(1);
    expect(result.appliedBonusSec).toBe(stage.checkpointBonusSec);
    expect(result.outcome.kind).toBe('in_progress');
  });

  it('ゴール通過なら cleared を返す', () => {
    const r = { ...createCampaignRuntime(stage), elapsedSec: 50 };
    const result = executeCampaignTick({
      runtime: r,
      prevCheckpointFlags: 0,
      currentCheckpointFlags: 0,
      hasCrossedFinishLine: true,
      dt: 0,
    });
    expect(result.outcome.kind).toBe('cleared');
    if (result.outcome.kind === 'cleared') {
      expect(result.outcome.rank).toBe('GOLD');  // stage.gold = 50
    }
  });

  it('時間切れなら time_up を返す', () => {
    const r = { ...createCampaignRuntime(stage), timeRemainingSec: 0.3, elapsedSec: 79.7 };
    const result = executeCampaignTick({
      runtime: r,
      prevCheckpointFlags: 0,
      currentCheckpointFlags: 0,
      hasCrossedFinishLine: false,
      dt: 1,
    });
    expect(result.runtime.timeRemainingSec).toBe(0);
    expect(result.outcome.kind).toBe('time_up');
  });

  it('ゴール通過と時間切れが同時なら cleared 優先', () => {
    const r = { ...createCampaignRuntime(stage), timeRemainingSec: 0.3, elapsedSec: 79.7 };
    const result = executeCampaignTick({
      runtime: r,
      prevCheckpointFlags: 0,
      currentCheckpointFlags: 0,
      hasCrossedFinishLine: true,
      dt: 1,
    });
    expect(result.outcome.kind).toBe('cleared');
  });

  it('ビット位置が複数進んだ場合も新規ビットを検出', () => {
    const r = createCampaignRuntime(stage);
    const result = executeCampaignTick({
      runtime: r,
      prevCheckpointFlags: 0b0001,
      currentCheckpointFlags: 0b0111,  // 2 ビット新規
      hasCrossedFinishLine: false,
      dt: 0.5,
    });
    expect(result.appliedBonusSec).toBe(stage.checkpointBonusSec);  // 一括判定なので 1 回分のみ
  });

  it('既に立っていたビットだけのときはボーナスなし', () => {
    const r = createCampaignRuntime(stage);
    const result = executeCampaignTick({
      runtime: r,
      prevCheckpointFlags: 0b0011,
      currentCheckpointFlags: 0b0011,
      hasCrossedFinishLine: false,
      dt: 0.5,
    });
    expect(result.appliedBonusSec).toBeUndefined();
  });
});
