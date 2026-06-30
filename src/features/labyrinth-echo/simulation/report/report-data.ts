/**
 * 迷宮の残響 - レポートデータ構築
 *
 * aggregateAll の集計結果に generatedAt/config を載せ、ReportData を組み立てる純粋関数。
 * 時刻は引数で注入する（決定論維持: Date.now を内部で呼ばない）。
 */
import { aggregateAll } from '../analysis';
import type { ReportData } from './render-html';

/** 集計を実行し ReportData を構築する（generatedAt は呼び出し側が注入） */
export const buildReportData = (cfg: { seeds: number; careers: number; maxRuns: number }, generatedAt: string): ReportData => {
  const agg = aggregateAll(cfg);
  return { generatedAt, ...agg, config: cfg };
};
