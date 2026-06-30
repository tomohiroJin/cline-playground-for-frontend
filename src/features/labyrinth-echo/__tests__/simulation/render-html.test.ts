import { renderHtml } from '../../simulation/report/render-html';
import type { ReportData } from '../../simulation/report/render-html';

const data: ReportData = {
  generatedAt: '2026-06-29T00:00:00.000Z',
  survival: { cells: [{ difficultyId: 'easy', pressure: 0, careful: 1, random: 0.66 }], pressures: [0], difficultyIds: ['easy'] },
  poweredSurvival: { cells: [{ difficultyId: 'hard', pressure: 3, baseline: 0, best: 0.12, bestLegacyId: 'lg_elna', delta: 0.12 }], pressures: [3], difficultyIds: ['hard'] },
  fullPowerSurvival: { cells: [{ difficultyId: 'abyss', pressure: 6, baseline: 0, best: 0.42, bestLegacyId: 'lg_first', delta: 0.42 }], pressures: [6], difficultyIds: ['abyss'] },
  careers: [{ label: 'easy × careful', difficultyId: 'easy', policy: 'careful', reachRate: 1, runsMedian: 19, runsMean: 19, escapesMedian: 19, deathsMedian: 0, sample: { unlocked: true, runsToUnlock: 19, escapesToUnlock: 19, deathsToUnlock: 0, finalDepth: 6, finalFragments: 19, timeline: [{ runIndex: 1, survived: true, cause: 'escape', floorReached: 5, depth: 1, fragmentCount: 1, fragsReadThisRun: 0, safetyNetGranted: true }], legacyUnlocks: [{ runIndex: 4, legacyId: 'lg_lian' }] } }],
  legacies: { unlockTimeline: [{ legacyId: 'lg_lian', runIndex: 4 }], effects: [{ legacyId: 'lg_lian', survivalP0: 0.87, survivalP3: 0.6 }], baselineP0: 0.81, baselineP3: 0.47 },
  endings: { rows: [{ label: 'easy 圧0', counts: { perfect: 30, scholar: 10 }, total: 40 }], endingIds: ['perfect', 'scholar'] },
  endingCensus: { rows: [{ id: 'standard', reachCount: 120, reachedBy: 'easy 圧0 careful 無補助' }, { id: 'veteran', reachCount: 0, reachedBy: '' }], trueEndingIds: ['te_inheritor', 'te_liberator'] },
  violations: [],
  config: { careers: 20, seeds: 40, maxRuns: 60 },
};

describe('renderHtml', () => {
  it('自己完結HTML（<html>と<style>を含む）を返す', () => {
    const html = renderHtml(data);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<style>');
    expect(html).toContain('迷宮の残響');
  });

  it('主要数値が埋め込まれる（中央値19・到達率）', () => {
    const html = renderHtml(data);
    expect(html).toContain('19');
    expect(html).toContain('easy × careful');
  });

  it('違反0件なら「異常なし」、ありなら詳細を表示', () => {
    expect(renderHtml(data)).toContain('異常なし');
    const withV = renderHtml({ ...data, violations: [{ severity: 'error', rule: 'depth_max', detail: 'run 1: depth 7 > 6' }] });
    expect(withV).toContain('depth_max');
    expect(withV).toContain('run 1: depth 7 &gt; 6'); // HTMLエスケープ確認
  });

  it('generatedAt が表示される', () => {
    expect(renderHtml(data)).toContain('2026-06-29');
  });

  it('継承パワーアップ後の生還率セクションを描画する（勝者レガシーと Δ を含む）', () => {
    const html = renderHtml(data);
    expect(html).toContain('継承パワーアップ後');
    expect(html).toContain('lg_elna'); // 勝者レガシー
  });

  it('フル強化（全アンロック＋ベストレガシー）セクションを描画する', () => {
    const html = renderHtml(data);
    expect(html).toContain('フル強化');
    expect(html).toContain('42.0%'); // abyss 圧6 のフル強化 best
  });

  it('エンディング到達性センサスを描画する（未到達ENDを強調）', () => {
    const html = renderHtml(data);
    expect(html).toContain('到達性センサス');
    expect(html).toContain('veteran'); // 未到達として表示
    expect(html).toContain('未到達'); // 強調ラベル
  });
});
