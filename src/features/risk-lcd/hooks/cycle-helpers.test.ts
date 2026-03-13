import {
  calcCycleTiming,
  pickFakeObstacle,
} from './cycle-helpers';
import type { RuntimeStageConfig } from '../types';
import type { RngApi } from './phases/types';

// テスト用 RNG
function createMockRng(overrides: Partial<RngApi> = {}): RngApi {
  return {
    int: () => 0,
    pick: <T,>(a: readonly T[]) => a[0],
    chance: () => true,
    shuffle: <T,>(a: readonly T[]) => [...a],
    random: () => 0.5,
    ...overrides,
  };
}

describe('calcCycleTiming', () => {
  it('基本のタイミングを計算する', () => {
    // Arrange
    const cfg: RuntimeStageConfig = { cy: 8, spd: 2600, si: 1, fk: false };
    const wm = 0;
    const speedMod = 0;
    const slowMod = 0;
    const cycle = 1;

    // Act
    const { totalDur, step } = calcCycleTiming({ cfg, wm, speedMod, slowMod, cycle });

    // Assert
    expect(totalDur).toBe(2600); // spd * 1
    expect(step).toBeCloseTo(2600 / 9.8); // ROWS(8) + 1.8
  });

  it('速度修飾が適用される', () => {
    const cfg: RuntimeStageConfig = { cy: 8, spd: 2000, si: 1, fk: false };

    const { totalDur } = calcCycleTiming({ cfg, wm: 0.5, speedMod: 0, slowMod: 0, cycle: 1 });

    // spd * (1 + 0.5) = 2000 * 1.5 = 3000
    expect(totalDur).toBe(3000);
  });

  it('スローモードが適用される', () => {
    const cfg: RuntimeStageConfig = { cy: 8, spd: 2000, si: 1, fk: false };

    const { totalDur } = calcCycleTiming({ cfg, wm: 0, speedMod: 0, slowMod: 0.15, cycle: 1 });

    // spd * 1 * 1.15 = 2300
    expect(totalDur).toBe(2300);
  });

  it('_calm モードで終盤は加速する', () => {
    const cfg: RuntimeStageConfig = { cy: 10, spd: 2000, si: 1, fk: false, _calm: true };

    // cycle 8 > 10 * 0.7 = 7 → 加速適用
    const { totalDur } = calcCycleTiming({ cfg, wm: 0, speedMod: 0, slowMod: 0, cycle: 8 });

    // spd * 1 * 1 * 0.7 = 1400
    expect(totalDur).toBe(1400);
  });

  it('_calm モードで前半は通常速度', () => {
    const cfg: RuntimeStageConfig = { cy: 10, spd: 2000, si: 1, fk: false, _calm: true };

    // cycle 3 <= 10 * 0.7 = 7 → 通常
    const { totalDur } = calcCycleTiming({ cfg, wm: 0, speedMod: 0, slowMod: 0, cycle: 3 });

    expect(totalDur).toBe(2000);
  });
});

describe('pickFakeObstacle', () => {
  it('fk が false なら -1 を返す', () => {
    const cfg: RuntimeStageConfig = { cy: 8, spd: 2000, si: 1, fk: false };
    const rng = createMockRng();

    expect(pickFakeObstacle(cfg, [1], rng)).toBe(-1);
  });

  it('障害物が空なら -1 を返す', () => {
    const cfg: RuntimeStageConfig = { cy: 8, spd: 2000, si: 1, fk: true };
    const rng = createMockRng();

    expect(pickFakeObstacle(cfg, [], rng)).toBe(-1);
  });

  it('chance が false なら -1 を返す', () => {
    const cfg: RuntimeStageConfig = { cy: 8, spd: 2000, si: 1, fk: true };
    const rng = createMockRng({ chance: () => false });

    expect(pickFakeObstacle(cfg, [1], rng)).toBe(-1);
  });

  it('条件を満たす場合、障害物からランダムに1つ選ぶ', () => {
    const cfg: RuntimeStageConfig = { cy: 8, spd: 2000, si: 1, fk: true };
    const rng = createMockRng({
      chance: () => true,
      pick: <T,>(a: readonly T[]) => a[0],
    });

    expect(pickFakeObstacle(cfg, [2, 0], rng)).toBe(2);
  });
});
