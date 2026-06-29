import { aggregateAll } from '../../simulation/analysis';

describe('aggregateAll', () => {
  // 小さめ設定で高速化
  const result = aggregateAll({ seeds: 40, careers: 20, maxRuns: 60 });

  it('生還率行列: 全難易度に圧0セルが存在し、集計構造が正しい', () => {
    // 難易度間の生還率単調性は balance-contract.test.ts(N=200)が権威的に保証する。
    // ここでは集計構造のみ検証（小サンプルでのフレーキー回避）
    const difficultyIds = ['easy', 'normal', 'hard', 'abyss'];
    for (const id of difficultyIds) {
      const p0Cell = result.survival.cells.find(c => c.difficultyId === id && c.pressure === 0);
      expect(p0Cell).toBeDefined();
    }
  });

  it('生還率は 0..1 の範囲', () => {
    for (const c of result.survival.cells) {
      expect(c.careful).toBeGreaterThanOrEqual(0);
      expect(c.careful).toBeLessThanOrEqual(1);
      expect(c.random).toBeGreaterThanOrEqual(0);
      expect(c.random).toBeLessThanOrEqual(1);
    }
  });

  it('キャリアサマリーが条件分あり、reachRate は 0..1', () => {
    expect(result.careers.length).toBeGreaterThan(0);
    for (const s of result.careers) {
      expect(s.reachRate).toBeGreaterThanOrEqual(0);
      expect(s.reachRate).toBeLessThanOrEqual(1);
      expect(s.sample.timeline.length).toBeGreaterThan(0);
    }
  });

  it('レガシー分析: effects は5件、baseline を含む', () => {
    expect(result.legacies.effects.length).toBe(5);
    expect(typeof result.legacies.baselineP0).toBe('number');
  });

  it('エンディング分布: 各行の counts 合計が total に一致', () => {
    for (const row of result.endings.rows) {
      const sum = Object.values(row.counts).reduce((a, b) => a + b, 0);
      expect(sum).toBe(row.total);
    }
  });

  it('実シム集計では error レベルの違反0件', () => {
    // warn レベル（統計的傾向の乖離）は CI を落とさない。error のみをガード
    expect(result.violations.filter(v => v.severity === 'error')).toEqual([]);
  });
});
