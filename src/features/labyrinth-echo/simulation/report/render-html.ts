/**
 * 迷宮の残響 - シミュレーションレポート HTML レンダラ
 *
 * ReportData を自己完結HTML文字列に変換する純粋関数。副作用なし（fs/日時に非依存）。
 * チャートは div 幅% / inline SVG で描画し外部依存を持たない。
 */
import type { SurvivalMatrix, PoweredSurvivalMatrix, CareerSummary, LegacyAnalysis, EndingDistribution, EndingCensus } from '../analysis';
import type { Violation } from '../invariants';

/** レポート1枚分のデータ */
export interface ReportData {
  generatedAt: string;
  survival: SurvivalMatrix;
  poweredSurvival: PoweredSurvivalMatrix;
  fullPowerSurvival: PoweredSurvivalMatrix;
  careers: CareerSummary[];
  legacies: LegacyAnalysis;
  endings: EndingDistribution;
  endingCensus: EndingCensus;
  violations: Violation[];
  config: { careers: number; seeds: number; maxRuns: number };
}

/** HTML 特殊文字をエスケープする（内部データのみだが安全側に倒す） */
const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pct = (x: number): string => (x * 100).toFixed(1) + '%';

/** 横棒（div幅%）。0..1 を受け取る */
const bar = (ratio: number, color: string): string =>
  `<div class="bar"><div class="bar-fill" style="width:${Math.round(ratio * 100)}%;background:${color}"></div></div>`;

const renderSurvival = (m: SurvivalMatrix): string => {
  const head = `<tr><th>難易度＼圧</th>${m.pressures.map(p => `<th>圧${p}</th>`).join('')}</tr>`;
  const rows = m.difficultyIds.map(id => {
    const tds = m.pressures.map(p => {
      const cell = m.cells.find(c => c.difficultyId === id && c.pressure === p)!;
      // 生還率を色相で表現（高=緑, 低=赤）
      const hue = Math.round(cell.careful * 120);
      return `<td style="background:hsl(${hue},60%,28%)">${pct(cell.careful)}</td>`;
    }).join('');
    return `<tr><th>${esc(id)}</th>${tds}</tr>`;
  }).join('');
  return `<table class="heat">${head}${rows}</table>`;
};

/** best/Δ/勝者を持つ強化後ヒートマップ（①-b 継承のみ・①-c フル強化で共用） */
const renderPoweredSurvival = (m: PoweredSurvivalMatrix, caption: string): string => {
  const head = `<tr><th>難易度＼圧</th>${m.pressures.map(p => `<th>圧${p}</th>`).join('')}</tr>`;
  const rows = m.difficultyIds.map(id => {
    const tds = m.pressures.map(p => {
      const cell = m.cells.find(c => c.difficultyId === id && c.pressure === p)!;
      // 強化後（best）の生還率を色相で表現（高=緑, 低=赤）
      const hue = Math.round(cell.best * 120);
      // 勝者と無補助からの上げ幅（Δ）。強化が役立たないセルは Δ0 / 継承なし
      const note = cell.delta > 0
        ? `Δ+${(cell.delta * 100).toFixed(1)} ${esc(cell.bestLegacyId)}`
        : 'Δ0 継承なし';
      return `<td style="background:hsl(${hue},60%,28%)">${pct(cell.best)}<br><span class="delta">${note}</span></td>`;
    }).join('');
    return `<tr><th>${esc(id)}</th>${tds}</tr>`;
  }).join('');
  return `<p class="meta">${esc(caption)}</p>
    <table class="heat">${head}${rows}</table>`;
};

const renderCareers = (cs: CareerSummary[]): string => {
  const rows = cs.map(s => `<tr>
    <td>${esc(s.label)}</td><td>${pct(s.reachRate)}</td>
    <td>${s.runsMedian}</td><td>${s.runsMean.toFixed(1)}</td>
    <td>${s.escapesMedian}</td><td>${s.deathsMedian}</td></tr>`).join('');
  // 代表キャリア（先頭条件のsample）の depth/断片 推移
  const sample = cs[0]?.sample;
  const timeline = sample ? sample.timeline.map(st =>
    `<tr><td>${st.runIndex}</td><td>${st.depth}</td><td>${st.fragmentCount}/19</td>
     <td>${st.survived ? '脱出' : '死亡(' + esc(st.cause) + ')'}</td>
     <td>${bar(st.fragmentCount / 19, '#60a5fa')}</td></tr>`).join('') : '';
  return `<table><tr><th>条件</th><th>解禁率</th><th>総周回(中央)</th><th>平均</th><th>脱出(中央)</th><th>死亡(中央)</th></tr>${rows}</table>
    <h3>代表キャリア（${esc(cs[0]?.label ?? '')}）の進行</h3>
    <table><tr><th>周</th><th>depth</th><th>断片</th><th>結果</th><th>断片進捗</th></tr>${timeline}</table>`;
};

const renderLegacies = (l: LegacyAnalysis): string => {
  const timeline = l.unlockTimeline.map(u => `<tr><td>${esc(u.legacyId)}</td><td>${u.runIndex}周目</td></tr>`).join('');
  const effects = l.effects.map(e => `<tr>
    <td>${esc(e.legacyId)}</td>
    <td>${pct(e.survivalP0)} ${bar(e.survivalP0, '#34d399')}</td>
    <td>${pct(e.survivalP3)} ${bar(e.survivalP3, '#fbbf24')}</td></tr>`).join('');
  return `<h3>取得タイミング（easy×lorehunter 代表キャリア）</h3>
    <table><tr><th>レガシー</th><th>解禁周</th></tr>${timeline}</table>
    <h3>各レガシーの生還率（normal careful）</h3>
    <p>継承なし baseline: 圧0 ${pct(l.baselineP0)} / 圧3 ${pct(l.baselineP3)}</p>
    <table><tr><th>レガシー</th><th>圧0</th><th>圧3</th></tr>${effects}</table>`;
};

const renderEndings = (e: EndingDistribution): string => {
  const head = `<tr><th>条件</th>${e.endingIds.map(id => `<th>${esc(id)}</th>`).join('')}<th>計</th></tr>`;
  const rows = e.rows.map(row => {
    const tds = e.endingIds.map(id => {
      const n = row.counts[id] ?? 0;
      return `<td>${n ? pct(n / row.total) : '-'}</td>`;
    }).join('');
    return `<tr><th>${esc(row.label)}</th>${tds}<td>${row.total}</td></tr>`;
  }).join('');
  return `<table>${head}${rows}</table>`;
};

const renderEndingCensus = (c: EndingCensus): string => {
  const rows = c.rows.map(r => {
    const reached = r.reachCount > 0;
    const by = reached ? esc(r.reachedBy) : '<b>未到達（到達不能の疑い）</b>';
    return `<tr${reached ? '' : ' class="ng"'}><td>${esc(r.id)}</td><td>${r.reachCount}</td><td>${by}</td></tr>`;
  }).join('');
  return `<p class="meta">難易度×圧(0/3/6)×policy(careful/random)×fx(無補助/フル強化)を掃引した到達回数。未到達=赤。
    真END（${c.trueEndingIds.map(esc).join(', ')}）は終章専用で単発runには出ない（finale-flow テストが担保）。
    veteran は log 依存だが、simulator が消化イベント数を log 長として渡すため評価対象。</p>
    <table><tr><th>エンディング</th><th>到達回数</th><th>最初に到達した条件</th></tr>${rows}</table>`;
};

const renderViolations = (vs: Violation[]): string => {
  if (!vs.length) return `<p class="ok">✓ 異常なし（不変条件 全クリア）</p>`;
  const rows = vs.map(v => `<tr><td>${esc(v.severity)}</td><td>${esc(v.rule)}</td><td>${esc(v.detail)}</td></tr>`).join('');
  return `<p class="ng">⚠ ${vs.length} 件の不変条件違反を検出</p>
    <table><tr><th>重大度</th><th>ルール</th><th>詳細</th></tr>${rows}</table>`;
};

/** ReportData を自己完結HTML文字列に変換する */
export const renderHtml = (data: ReportData): string => {
  const errs = data.violations.filter(v => v.severity === 'error').length;
  const warns = data.violations.filter(v => v.severity === 'warn').length;
  const summaryBadge = errs
    ? `<span class="badge ng">違反(error) ${errs}</span>`
    : warns
      ? `<span class="badge warn">警告 ${warns}</span>`
      : `<span class="badge ok">✓ 異常なし</span>`;
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><title>迷宮の残響 シミュレーションレポート</title>
<style>
  body{background:#0f0f17;color:#e5e7eb;font-family:system-ui,sans-serif;margin:0;padding:24px;line-height:1.6}
  h1{color:#a5b4fc} h2{color:#818cf8;border-bottom:1px solid #312e81;padding-bottom:4px;margin-top:32px}
  h3{color:#c4b5fd;margin-top:20px}
  table{border-collapse:collapse;margin:12px 0;font-size:14px} th,td{border:1px solid #312e81;padding:4px 10px;text-align:center}
  th{background:#1e1b4b} .heat td{font-weight:bold;color:#fff}
  .delta{display:block;font-weight:normal;font-size:11px;color:#d1d5db;margin-top:2px}
  .bar{display:inline-block;width:80px;height:10px;background:#1f2937;border-radius:4px;overflow:hidden;vertical-align:middle}
  .bar-fill{height:100%}
  .badge{padding:2px 10px;border-radius:12px;font-weight:bold} .ok{color:#34d399} .ng{color:#f87171}
  .badge.ok{background:#064e3b} .badge.ng{background:#7f1d1d;color:#fecaca} .badge.warn{background:#78350f;color:#fde68a}
  tr.ng td{color:#fca5a5}
  .meta{color:#9ca3af;font-size:13px}
</style></head>
<body>
  <h1>迷宮の残響 — シミュレーションレポート</h1>
  <p class="meta">生成日時: ${esc(data.generatedAt)} ｜ 設定: careers=${data.config.careers}, seeds=${data.config.seeds}, maxRuns=${data.config.maxRuns} ｜ ${summaryBadge}</p>

  <h2>① 単発run 生還率カーブ（難易度×残響圧 / careful）</h2>
  ${renderSurvival(data.survival)}

  <h2>①-b 継承パワーアップ後の生還率（ベストレガシー / careful）</h2>
  ${renderPoweredSurvival(data.poweredSurvival, '各セル = 継承なしと全5レガシーの最良（継承なしも選択肢）。Δ は無補助からの上げ幅。')}

  <h2>①-c フル強化後の生還率（全アンロック＋ベストレガシー / careful）</h2>
  ${renderPoweredSurvival(data.fullPowerSurvival, '各セル = 全40アンロック適用＋（継承なし/5レガシーの最良）。Δ は無補助(①)からの総上げ幅。理論上の最大強化（veteran想定）。')}

  <h2>② 周回（キャリア）進行 — 真ルート解禁まで</h2>
  ${renderCareers(data.careers)}

  <h2>③ 継承（レガシー）分析</h2>
  ${renderLegacies(data.legacies)}

  <h2>④ エンディング到達分布</h2>
  ${renderEndings(data.endings)}

  <h2>④-b エンディング到達性センサス（全END到達可否）</h2>
  ${renderEndingCensus(data.endingCensus)}

  <h2>⚠ 検出した異常</h2>
  ${renderViolations(data.violations)}
</body></html>`;
};
