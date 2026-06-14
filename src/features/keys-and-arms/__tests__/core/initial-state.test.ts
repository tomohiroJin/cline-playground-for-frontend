import { createInitialCaveState } from '../../core/initial-cave-state';
import { createInitialPrairieState } from '../../core/initial-prairie-state';
import { createInitialBossState } from '../../core/initial-boss-state';

describe('初期状態ファクトリ', () => {
  it('洞窟: 全フィールド定義済み・パーティクルプールは空配列', () => {
    const s = createInitialCaveState();
    expect(s.sparks).toEqual([]);
    expect(s.drips).toEqual([]);
    expect(Object.values(s).every((v) => v !== undefined)).toBe(true);
  });
  it('草原: 全フィールド定義済み・プールは空配列', () => {
    const s = createInitialPrairieState();
    expect(s.slash).toEqual([]);
    expect(s.miss).toEqual([]);
    expect(Object.values(s).every((v) => v !== undefined)).toBe(true);
  });
  it('ボス: 全フィールド定義済み・プールは空配列', () => {
    const s = createInitialBossState();
    expect(s.particles).toEqual([]);
    expect(s.armTrail).toEqual([]);
    expect(Object.values(s).every((v) => v !== undefined)).toBe(true);
  });

  it('ボス: アーム配列は不活性（空）・シールドは 0', () => {
    const s = createInitialBossState();
    // 型では満たせない「不活性」不変条件を検証（loop 依存値が混入していないこと）
    expect(s.armStage).toEqual([]);
    expect(s.armSpeed).toEqual([]);
    expect(s.shields).toBe(0);
  });

  it('草原: 不活性デフォルト（goal / guards は 0）', () => {
    const s = createInitialPrairieState();
    expect(s.goal).toBe(0);
    expect(s.guards).toBe(0);
  });

  it('RNG 非依存: 2 回呼んでも同一の状態を返す', () => {
    // ファクトリが RNG を消費しないことを保証（呼び出しごとに値が変わらない）
    expect(createInitialCaveState()).toEqual(createInitialCaveState());
    expect(createInitialPrairieState()).toEqual(createInitialPrairieState());
    expect(createInitialBossState()).toEqual(createInitialBossState());
  });
});
