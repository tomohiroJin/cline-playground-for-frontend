// difficulty のテスト

import { getStage } from './stage-catalog';
import { applyDifficulty, getMultipliers } from './difficulty';

describe('getMultipliers', () => {
  it('NORMAL は全 1.0', () => {
    const m = getMultipliers('NORMAL');
    expect(m.initialTime).toBe(1.0);
    expect(m.checkpointBonus).toBe(1.0);
  });

  it('HARD は 1.0 未満', () => {
    const m = getMultipliers('HARD');
    expect(m.initialTime).toBeLessThan(1);
    expect(m.checkpointBonus).toBeLessThan(1);
  });
});

describe('applyDifficulty', () => {
  it('NORMAL は元ステージを返す（恒等）', () => {
    const stage = getStage(1);
    expect(applyDifficulty(stage, 'NORMAL')).toBe(stage);
  });

  it('HARD で時間が短縮される', () => {
    const stage = getStage(1);
    const hard = applyDifficulty(stage, 'HARD');
    expect(hard.initialTimeSec).toBeLessThan(stage.initialTimeSec);
    expect(hard.checkpointBonusSec).toBeLessThan(stage.checkpointBonusSec);
    expect(hard.goldRankTimeSec).toBeLessThan(stage.goldRankTimeSec);
  });

  it('HARD でも silverRankTimeSec > goldRankTimeSec の不変条件は保たれる', () => {
    const stage = getStage(1);
    const hard = applyDifficulty(stage, 'HARD');
    expect(hard.silverRankTimeSec).toBeGreaterThan(hard.goldRankTimeSec);
  });

  it('全ステージで HARD が assertValidStage を通る', () => {
    for (let i = 1; i <= 8; i++) {
      const stage = getStage(i as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
      expect(() => applyDifficulty(stage, 'HARD')).not.toThrow();
    }
  });
});
