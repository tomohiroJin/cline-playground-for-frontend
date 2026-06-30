import { buildReportData } from '../../simulation/report/report-data';

describe('buildReportData', () => {
  it('generatedAt と config を載せ、4軸＋violations を持つ ReportData を返す', () => {
    const data = buildReportData({ seeds: 30, careers: 10, maxRuns: 50 }, '2026-06-29T00:00:00.000Z');
    expect(data.generatedAt).toBe('2026-06-29T00:00:00.000Z');
    expect(data.config).toEqual({ seeds: 30, careers: 10, maxRuns: 50 });
    expect(data.survival.cells.length).toBeGreaterThan(0);
    expect(data.careers.length).toBeGreaterThan(0);
    expect(data.legacies.effects.length).toBe(5);
    expect(data.endings.rows.length).toBeGreaterThan(0);
    expect(Array.isArray(data.violations)).toBe(true);
  });
});
