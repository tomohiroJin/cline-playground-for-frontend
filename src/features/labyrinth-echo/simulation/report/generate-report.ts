/**
 * 迷宮の残響 - シミュレーションレポート生成 CLI
 *
 * 集計→HTML化→ファイル書き込みを行う唯一の副作用境界。
 * 実行: npm run sim:labyrinth-echo
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { buildReportData } from './report-data';
import { renderHtml } from './render-html';

/** レポート設定（重すぎない既定値。必要なら環境変数で調整） */
const CFG = {
  seeds: Number(process.env.SIM_SEEDS ?? 200),
  careers: Number(process.env.SIM_CAREERS ?? 100),
  maxRuns: Number(process.env.SIM_MAX_RUNS ?? 120),
};

const main = (): void => {
  const generatedAt = new Date().toISOString();
  const datePart = generatedAt.slice(0, 10);
  const data = buildReportData(CFG, generatedAt);
  const html = renderHtml(data);

  const outDir = resolve(process.cwd(), 'reports');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `labyrinth-echo-sim-${datePart}.html`);
  writeFileSync(outPath, html, 'utf-8');

  const errors = data.violations.filter(v => v.severity === 'error').length;
  console.log(`レポートを生成しました: ${outPath}`);
  console.log(`不変条件違反: ${data.violations.length} 件（error: ${errors}）`);
  if (errors > 0) process.exitCode = 1; // CIで異常検知できるよう非0終了
};

main();
