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

  describe('継承パワーアップ後の生還率行列（poweredSurvival）', () => {
    const VALID_WINNERS = new Set(['none', 'lg_lian', 'lg_twins', 'lg_galen', 'lg_elna', 'lg_first']);

    it('全難易度×全圧（4×7=28）のセルを持つ', () => {
      expect(result.poweredSurvival.cells.length).toBe(28);
    });

    it('baseline / best は 0..1、delta は常に非負（best>=baseline）', () => {
      for (const c of result.poweredSurvival.cells) {
        expect(c.baseline).toBeGreaterThanOrEqual(0);
        expect(c.baseline).toBeLessThanOrEqual(1);
        expect(c.best).toBeGreaterThanOrEqual(0);
        expect(c.best).toBeLessThanOrEqual(1);
        expect(c.delta).toBeGreaterThanOrEqual(0);
        expect(c.best).toBeCloseTo(c.baseline + c.delta, 10);
      }
    });

    it('bestLegacyId は「none」または有効なレガシーID', () => {
      for (const c of result.poweredSurvival.cells) {
        expect(VALID_WINNERS.has(c.bestLegacyId)).toBe(true);
      }
    });

    it('勝者が none のセルは delta=0、レガシーが勝つセルは best>baseline', () => {
      for (const c of result.poweredSurvival.cells) {
        if (c.bestLegacyId === 'none') {
          expect(c.delta).toBe(0);
        } else {
          expect(c.best).toBeGreaterThan(c.baseline);
        }
      }
    });

    it('baseline は ① 行列の careful と一致する（同一シードの決定論）', () => {
      for (const c of result.poweredSurvival.cells) {
        const base = result.survival.cells.find(s => s.difficultyId === c.difficultyId && s.pressure === c.pressure)!;
        expect(c.baseline).toBeCloseTo(base.careful, 10);
      }
    });
  });

  describe('フル強化（全アンロック＋ベストレガシー）の生還率行列（fullPowerSurvival）', () => {
    const VALID_WINNERS = new Set(['none', 'lg_lian', 'lg_twins', 'lg_galen', 'lg_elna', 'lg_first']);

    it('全難易度×全圧（4×7=28）のセルを持つ', () => {
      expect(result.fullPowerSurvival.cells.length).toBe(28);
    });

    it('baseline / best は 0..1、delta は常に非負（best>=baseline、構築上保証）', () => {
      for (const c of result.fullPowerSurvival.cells) {
        expect(c.baseline).toBeGreaterThanOrEqual(0);
        expect(c.best).toBeLessThanOrEqual(1);
        expect(c.delta).toBeGreaterThanOrEqual(0);
        expect(c.best).toBeCloseTo(c.baseline + c.delta, 10);
      }
    });

    it('bestLegacyId は「none」または有効なレガシーID', () => {
      for (const c of result.fullPowerSurvival.cells) {
        expect(VALID_WINNERS.has(c.bestLegacyId)).toBe(true);
      }
    });

    it('baseline は ① 行列の careful（無補助）と一致する＝Δは素からの総上げ幅', () => {
      for (const c of result.fullPowerSurvival.cells) {
        const base = result.survival.cells.find(s => s.difficultyId === c.difficultyId && s.pressure === c.pressure)!;
        expect(c.baseline).toBeCloseTo(base.careful, 10);
      }
    });

    it('フル強化は継承のみ(①-b)以上に底上げする（easy 圧0 で best>=①-b best）', () => {
      const id = 'easy', p = 0;
      const full = result.fullPowerSurvival.cells.find(c => c.difficultyId === id && c.pressure === p)!;
      const powered = result.poweredSurvival.cells.find(c => c.difficultyId === id && c.pressure === p)!;
      expect(full.best).toBeGreaterThanOrEqual(powered.best);
    });
  });

  describe('エンディング到達性センサス（endingCensus）', () => {
    it('全11ENDの行を持ち reachCount は非負', () => {
      expect(result.endingCensus.rows.length).toBe(11);
      for (const r of result.endingCensus.rows) expect(r.reachCount).toBeGreaterThanOrEqual(0);
    });

    it('少なくとも1つのENDに到達している（標準など）', () => {
      expect(result.endingCensus.rows.some(r => r.reachCount > 0)).toBe(true);
    });

    it('真END4種を別枠で保持（単発runでは出ない＝終章専用）', () => {
      expect(result.endingCensus.trueEndingIds.length).toBe(4);
    });

    it('到達したENDには reachedBy（条件ラベル）が入る', () => {
      for (const r of result.endingCensus.rows) {
        if (r.reachCount > 0) expect(r.reachedBy.length).toBeGreaterThan(0);
      }
    });
  });
});
