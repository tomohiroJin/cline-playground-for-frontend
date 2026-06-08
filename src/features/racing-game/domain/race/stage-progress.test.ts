// stage-progress.ts の単体テスト

import type { Stage } from './stage';
import { evaluateStage } from './stage-progress';

const stage: Stage = {
  id: 1,
  title: 'FOREST CALLING',
  numberLabel: 'STAGE 1',
  intro: '...',
  courseIndex: 0,
  difficulty: 'easy',
  initialTimeSec: 80,
  checkpointBonusSec: 12,
  goldRankTimeSec: 50,
  silverRankTimeSec: 65,
  lapsToClear: 1,
};

describe('evaluateStage', () => {
  it('ゴール到達なら cleared を返し、ランクを判定する', () => {
    const outcome = evaluateStage({ stage, timeRemainingSec: 30, elapsedSec: 50 }, true);
    expect(outcome).toEqual({ kind: 'cleared', goalTimeSec: 50, rank: 'GOLD' });
  });

  it('SILVER タイムでクリア', () => {
    const outcome = evaluateStage({ stage, timeRemainingSec: 5, elapsedSec: 60 }, true);
    expect(outcome).toEqual({ kind: 'cleared', goalTimeSec: 60, rank: 'SILVER' });
  });

  it('時間切れなら time_up', () => {
    const outcome = evaluateStage({ stage, timeRemainingSec: 0, elapsedSec: 80 }, false);
    expect(outcome).toEqual({ kind: 'time_up' });
  });

  it('ゴール未到達かつ時間残ありなら in_progress', () => {
    const outcome = evaluateStage({ stage, timeRemainingSec: 10, elapsedSec: 70 }, false);
    expect(outcome).toEqual({ kind: 'in_progress' });
  });

  it('時間 0 でもゴール到達なら cleared を優先', () => {
    const outcome = evaluateStage({ stage, timeRemainingSec: 0, elapsedSec: 80 }, true);
    expect(outcome.kind).toBe('cleared');
  });
});
