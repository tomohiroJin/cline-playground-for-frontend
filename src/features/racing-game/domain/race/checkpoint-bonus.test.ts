// checkpoint-bonus.ts の単体テスト

import { applyCheckpointBonus } from './checkpoint-bonus';

describe('applyCheckpointBonus', () => {
  it('残時間にボーナスを加算する', () => {
    expect(applyCheckpointBonus(30, 12)).toBe(42);
  });

  it('小数同士の加算', () => {
    expect(applyCheckpointBonus(10.5, 2.5)).toBeCloseTo(13);
  });

  it('残時間 0 から加算できる（time_up 後の救済シナリオ用）', () => {
    expect(applyCheckpointBonus(0, 8)).toBe(8);
  });

  it('ボーナスが 0 のときは変化なし', () => {
    expect(applyCheckpointBonus(42, 0)).toBe(42);
  });

  it('負のボーナスはアサーションで弾く', () => {
    expect(() => applyCheckpointBonus(30, -1)).toThrow();
  });
});
