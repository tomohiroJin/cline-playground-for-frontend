import { buildStageDifficulty, grassEnemyMix, isTrueEnding } from './difficulty';

describe('difficulty', () => {
  it('ループが進むと危険サイクルが短くなる', () => {
    const l1 = buildStageDifficulty(1);
    const l4 = buildStageDifficulty(4);
    expect(l4.hazardCycle).toBeLessThanOrEqual(l1.hazardCycle);
  });

  it('草原敵ミックスを返す', () => {
    const mix = grassEnemyMix(3);
    expect(mix.eliteRate).toBeGreaterThan(0);
    expect(mix.shiftRate).toBeGreaterThan(0);
  });

  it('真エンド条件を判定する', () => {
    expect(isTrueEnding(1, 999999)).toBe(false);
    expect(isTrueEnding(3, 200000)).toBe(true);
  });
});
