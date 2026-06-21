/**
 * バランス検証シミュレータの健全性テスト（CI で常時実行する軽量版）。
 *
 * シミュレータ自身が「本番 reducer を最後まで破綻なく駆動できる」ことを保証する。
 * バランスそのものの定量レポートは balance-report.test.ts（手動実行）で行う。
 */
import { simulateRun, type SimConfig } from './run-simulator';
import { TOTEMS } from '../constants';

const BASE: Omit<SimConfig, 'totemId' | 'seed'> = {
  di: 0,
  evoStrategy: 'greedy-atk',
};

describe('run-simulator', () => {
  it('全 6 トーテムで 1 ランが victory/defeat に収束する', () => {
    for (const totem of TOTEMS) {
      const r = simulateRun({ ...BASE, totemId: totem.id, seed: 12345 });
      expect(['victory', 'defeat']).toContain(r.result);
      expect(r.battles).toBeGreaterThan(0);
      expect(r.ticks).toBeGreaterThan(0);
      expect(r.powerCurve.length).toBe(r.battles);
    }
  });

  it('同一シードでは完全に決定論的（再現性）', () => {
    const a = simulateRun({ ...BASE, totemId: 'blood', seed: 999 });
    const b = simulateRun({ ...BASE, totemId: 'blood', seed: 999 });
    expect(b).toEqual(a);
  });

  it('シードが異なれば結果は分岐しうる（乱数が効いている）', () => {
    const results = Array.from({ length: 8 }, (_, i) =>
      simulateRun({ ...BASE, totemId: 'blood', seed: 1000 + i }));
    const distinct = new Set(results.map(r => `${r.result}:${r.biomesCleared}:${r.ticks}`));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('Math.random をシミュレーション後に復元する', () => {
    const before = Math.random;
    simulateRun({ ...BASE, totemId: 'flame', seed: 1 });
    expect(Math.random).toBe(before);
  });

  it('パワーカーブは戦闘ごとに単調に進行する（bc が逆行しない）', () => {
    const r = simulateRun({ ...BASE, totemId: 'pack', seed: 42, evoStrategy: 'balanced' });
    for (let i = 1; i < r.powerCurve.length; i++) {
      expect(r.powerCurve[i].bc).toBeGreaterThanOrEqual(r.powerCurve[i - 1].bc);
      expect(r.powerCurve[i].battleIndex).toBe(r.powerCurve[i - 1].battleIndex + 1);
    }
  });
});
