/**
 * 迷宮の残響 - シミュレーション集計層
 *
 * 単発生還率・周回キャリア・継承分析・END分布を plain data に集計する純粋関数群。
 * Jest（数値アサート）と HTML レポートが同じ集計を共有する（数値ソースの単一化）。
 * 決定論: 全シードは引数で与えられた固定値から導出する。
 */
import { simulateRun } from './run-simulator';
import { simulateCareer } from './career-simulator';
import type { CareerResult } from './career-simulator';
import { CAREFUL_POLICY, RANDOM_POLICY, LORE_POLICY, RECKLESS_POLICY } from './policies';
import type { RunPolicy } from './run-simulator';
import { checkCareer, checkRun, checkSurvivalMonotonic, checkEndingCoverage } from './invariants';
import type { Violation } from './invariants';
import { DIFFICULTY } from '../domain/constants/difficulty-defs';
import { LEGACIES } from '../domain/constants/legacy-defs';
import { UNLOCKS } from '../domain/constants/unlock-defs';
import { ENDINGS } from '../domain/constants/ending-defs';
import { TRUE_ENDINGS } from '../domain/constants/true-ending-defs';
import { computeFx } from '../domain/services/unlock-service';
import type { FxState } from '../domain/models/unlock';
import { SeededRandomSource } from '../domain/events/random';
import { EV } from '../events/event-data';
import { ECHO_EVENTS } from '../events/echo-events';
import { REVENANT_EVENTS } from '../events/revenant-events';
import type { EchoLegacy } from '../domain/models/echo';

/** 全イベントを結合したマスターリスト */
const EVENTS = [...EV, ...ECHO_EVENTS, ...REVENANT_EVENTS];
/** 継承なし・アンロックなしのベース fx */
const BASE_FX = computeFx([]);
/** 全アンロック適用後の fx（理論上の最大強化＝veteran 想定。trophy/achieve 含む全40種） */
const FULL_FX = computeFx(UNLOCKS.map(u => u.id));
/** 対象難易度 ID（単調性チェックの順序に合わせる） */
const DIFFICULTY_IDS = ['easy', 'normal', 'hard', 'abyss'];
/** 残響圧レベル */
const PRESSURES = [0, 1, 2, 3, 4, 5, 6];

/** 難易度 ID から DifficultyDef を取得するユーティリティ */
const d = (id: string) => DIFFICULTY.find(x => x.id === id)!;

/** 中央値（奇数: 中央要素、偶数: 中央2要素の平均） */
const median = (xs: number[]): number => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** 算術平均 */
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export interface SurvivalCell { difficultyId: string; pressure: number; careful: number; random: number; }
export interface SurvivalMatrix { cells: SurvivalCell[]; pressures: number[]; difficultyIds: string[]; }
/**
 * 継承パワーアップ後セル: 各 難易度×圧 で「継承なし(baseline)」と全5レガシーを試し、
 * 最良の選択（継承なしを含む）を best とする。bestLegacyId は勝者（none=継承なし）。
 * レガシーは排他選択でスタックしないため、best=max(baseline, 各レガシー)。delta は常に非負。
 */
export interface PoweredSurvivalCell { difficultyId: string; pressure: number; baseline: number; best: number; bestLegacyId: string; delta: number; }
export interface PoweredSurvivalMatrix { cells: PoweredSurvivalCell[]; pressures: number[]; difficultyIds: string[]; }
export interface CareerSummary { label: string; difficultyId: string; policy: string; reachRate: number; runsMedian: number; runsMean: number; escapesMedian: number; deathsMedian: number; sample: CareerResult; }
export interface LegacyAnalysis { unlockTimeline: { legacyId: string; runIndex: number }[]; effects: { legacyId: string; survivalP0: number; survivalP3: number }[]; baselineP0: number; baselineP3: number; }
export interface EndingRow { label: string; counts: Record<string, number>; total: number; }
export interface EndingDistribution { rows: EndingRow[]; endingIds: string[]; }
/** 各ENDの到達回数と「最初に到達した条件」。reachedBy が空＝未到達 */
export interface EndingCensusRow { id: string; reachCount: number; reachedBy: string; }
export interface EndingCensus { rows: EndingCensusRow[]; trueEndingIds: string[]; }

/** 指定条件の生還率（0..1）を seeds 件で算出（fx 既定はアンロックなし） */
const survivalRate = (difficultyId: string, pressure: number, policy: RunPolicy, seeds: number, legacy: EchoLegacy | null = null, fx: FxState = BASE_FX): number => {
  let survived = 0;
  for (let s = 1; s <= seeds; s++) {
    const r = simulateRun({ difficulty: d(difficultyId), fx, rng: new SeededRandomSource(s), policy, events: EVENTS, pressure, legacy });
    if (r.survived) survived++;
  }
  return survived / seeds;
};

/** ① 単発生還率行列（難易度×圧レベル×ポリシー） */
const buildSurvival = (seeds: number): SurvivalMatrix => {
  const cells: SurvivalCell[] = [];
  for (const id of DIFFICULTY_IDS) {
    for (const p of PRESSURES) {
      cells.push({
        difficultyId: id,
        pressure: p,
        careful: survivalRate(id, p, CAREFUL_POLICY, seeds),
        random: survivalRate(id, p, RANDOM_POLICY, seeds),
      });
    }
  }
  return { cells, pressures: PRESSURES, difficultyIds: DIFFICULTY_IDS };
};

/**
 * 指定 fx の下で「継承なし＋全5レガシー」の最良セル行列（難易度×圧、careful）を構築する。
 *
 * 各セルで「継承なし」と全5レガシーの生還率を測り、最良の選択を best とする
 * （継承なしも選択肢に含めるため delta=best-baseline は常に非負）。
 * best は baseline（無補助・①と同じ）を起点に max を取るため delta は構築上常に非負。
 * bestLegacyId は勝者（none=継承なしが最良）。同率なら継承なしを優先（strict >）。
 *
 * 極限セル（例: abyss×圧6 + MN減少レガシー）でも、初期ステータスは createNewPlayer が
 * 最小1にクランプするため起動可能で、精神力1からの実測生還率（ほぼ0%）が算出される。
 * かつて maxMn≤0 で throw していた契約違反は Issue #141 の根本修正で解消済み。
 * 例外を握り潰すと本ツールの目的（バグ検出）に反するため、survivalRate を直接呼ぶ。
 * @param fx run に渡す基礎 fx（①-b は BASE_FX、①-c は FULL_FX）
 * @param noLegacyRate 「このfxで継承なし」の生還率（①-b は baseline と同じ、①-c はフル無継承）
 */
const buildBestLegacyMatrix = (seeds: number, fx: FxState, noLegacyRate: (id: string, p: number) => number): PoweredSurvivalMatrix => {
  const cells: PoweredSurvivalCell[] = [];
  for (const id of DIFFICULTY_IDS) {
    for (const p of PRESSURES) {
      const baseline = survivalRate(id, p, CAREFUL_POLICY, seeds); // 無補助（①）
      let best = baseline;
      let bestLegacyId = 'none';
      const none = noLegacyRate(id, p);
      if (none > best) { best = none; bestLegacyId = 'none'; }
      for (const l of LEGACIES) {
        const rate = survivalRate(id, p, CAREFUL_POLICY, seeds, l, fx);
        if (rate > best) { best = rate; bestLegacyId = l.id; }
      }
      cells.push({ difficultyId: id, pressure: p, baseline, best, bestLegacyId, delta: best - baseline });
    }
  }
  return { cells, pressures: PRESSURES, difficultyIds: DIFFICULTY_IDS };
};

/** ①-b 継承パワーアップ後（アンロックなし＋ベストレガシー）。baseline=無補助、best=max(無補助, 各レガシー) */
const buildPoweredSurvival = (seeds: number): PoweredSurvivalMatrix =>
  buildBestLegacyMatrix(seeds, BASE_FX, (id, p) => survivalRate(id, p, CAREFUL_POLICY, seeds));

/** ①-c フル強化（全アンロック＋ベストレガシー）。baseline=無補助(①)、best=max(無補助, フル無継承, フル各レガシー)。Δ=素からの総上げ幅 */
const buildFullPowerSurvival = (seeds: number): PoweredSurvivalMatrix =>
  buildBestLegacyMatrix(seeds, FULL_FX, (id, p) => survivalRate(id, p, CAREFUL_POLICY, seeds, null, FULL_FX));

/** キャリア条件定義（難易度×ポリシーの組み合わせ） */
const CAREER_CONDS: { label: string; difficultyId: string; policyName: string; policy: RunPolicy }[] = [
  { label: 'easy × careful', difficultyId: 'easy', policyName: 'careful', policy: CAREFUL_POLICY },
  { label: 'easy × lorehunter', difficultyId: 'easy', policyName: 'lorehunter', policy: LORE_POLICY },
  { label: 'normal × careful', difficultyId: 'normal', policyName: 'careful', policy: CAREFUL_POLICY },
  { label: 'normal × lorehunter', difficultyId: 'normal', policyName: 'lorehunter', policy: LORE_POLICY },
];

/** ② 周回キャリアサマリー（条件別）と全 CareerResult を返す */
const buildCareers = (careers: number, maxRuns: number): { summaries: CareerSummary[]; all: CareerResult[] } => {
  const summaries: CareerSummary[] = [];
  const all: CareerResult[] = [];
  for (const cond of CAREER_CONDS) {
    const results = Array.from(
      { length: careers },
      (_, i) => simulateCareer({
        difficulty: d(cond.difficultyId),
        fx: BASE_FX,
        policy: cond.policy,
        events: EVENTS,
        careerSeed: i + 1,
        maxRuns,
      }),
    );
    all.push(...results);
    const unlocked = results.filter(r => r.unlocked);
    summaries.push({
      label: cond.label,
      difficultyId: cond.difficultyId,
      policy: cond.policyName,
      reachRate: unlocked.length / careers,
      runsMedian: median(unlocked.map(r => r.runsToUnlock)),
      runsMean: mean(unlocked.map(r => r.runsToUnlock)),
      escapesMedian: median(unlocked.map(r => r.escapesToUnlock)),
      deathsMedian: median(unlocked.map(r => r.deathsToUnlock)),
      sample: results[0],
    });
  }
  return { summaries, all };
};

/** ③ 継承分析（取得タイミングは easy×lorehunter の代表キャリア、効果は各レガシーの生還率） */
const buildLegacies = (seeds: number, maxRuns: number): LegacyAnalysis => {
  const sample = simulateCareer({
    difficulty: d('easy'),
    fx: BASE_FX,
    policy: LORE_POLICY,
    events: EVENTS,
    careerSeed: 1,
    maxRuns,
  });
  const effects = LEGACIES.map(l => ({
    legacyId: l.id,
    survivalP0: survivalRate('normal', 0, CAREFUL_POLICY, seeds, l),
    survivalP3: survivalRate('normal', 3, CAREFUL_POLICY, seeds, l),
  }));
  return {
    unlockTimeline: sample.legacyUnlocks.map(u => ({ legacyId: u.legacyId, runIndex: u.runIndex })),
    effects,
    baselineP0: survivalRate('normal', 0, CAREFUL_POLICY, seeds),
    baselineP3: survivalRate('normal', 3, CAREFUL_POLICY, seeds),
  };
};

/** エンディング集計の対象条件 */
const ENDING_CONDS: { label: string; difficultyId: string; pressure: number }[] = [
  { label: 'easy 圧0', difficultyId: 'easy', pressure: 0 },
  { label: 'normal 圧0', difficultyId: 'normal', pressure: 0 },
  { label: 'normal 圧3', difficultyId: 'normal', pressure: 3 },
  { label: 'hard 圧0', difficultyId: 'hard', pressure: 0 },
];

/** ④ エンディング到達分布（脱出時の endingId を条件別に集計） */
const buildEndings = (seeds: number): EndingDistribution => {
  const idSet = new Set<string>();
  const rows: EndingRow[] = ENDING_CONDS.map(cond => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (let s = 1; s <= seeds; s++) {
      const r = simulateRun({
        difficulty: d(cond.difficultyId),
        fx: BASE_FX,
        rng: new SeededRandomSource(s),
        policy: CAREFUL_POLICY,
        events: EVENTS,
        pressure: cond.pressure,
      });
      if (r.survived && r.endingId) {
        counts[r.endingId] = (counts[r.endingId] ?? 0) + 1;
        idSet.add(r.endingId);
        total++;
      }
    }
    return { label: cond.label, counts, total };
  });
  return { rows, endingIds: [...idSet].sort() };
};

/** ④-b エンディング到達性センサスの掃引条件（policy × fx の組合せ） */
const CENSUS_POLICIES: { name: string; policy: RunPolicy }[] = [
  { name: 'careful', policy: CAREFUL_POLICY },
  { name: 'random', policy: RANDOM_POLICY },
  { name: 'reckless', policy: RECKLESS_POLICY },
];
const CENSUS_FXS: { name: string; fx: FxState }[] = [
  { name: '無補助', fx: BASE_FX },
  { name: 'フル強化', fx: FULL_FX },
];
const CENSUS_PRESSURES = [0, 3, 6];

/**
 * ④-b エンディング到達性センサス。
 *
 * 難易度×圧×policy(careful/random)×fx(無補助/フル強化) を広く掃引し、脱出時の endingId を集計。
 * 全ENDの到達回数と「最初に到達した条件」を返す。到達0回のENDは到達不能の疑いとして可視化する。
 * 真END（te_*）は終章専用で単発runでは出ないため別枠で示す（finale-flow テストが担保）。
 */
const buildEndingCensus = (seeds: number): EndingCensus => {
  const counts: Record<string, number> = {};
  const reachedBy: Record<string, string> = {};
  for (const id of DIFFICULTY_IDS) {
    for (const p of CENSUS_PRESSURES) {
      for (const pol of CENSUS_POLICIES) {
        for (const fxOpt of CENSUS_FXS) {
          for (let s = 1; s <= seeds; s++) {
            const r = simulateRun({ difficulty: d(id), fx: fxOpt.fx, rng: new SeededRandomSource(s), policy: pol.policy, events: EVENTS, pressure: p });
            if (!r.survived || !r.endingId) continue;
            counts[r.endingId] = (counts[r.endingId] ?? 0) + 1;
            if (!reachedBy[r.endingId]) reachedBy[r.endingId] = `${id} 圧${p} ${pol.name} ${fxOpt.name}`;
          }
        }
      }
    }
  }
  const rows: EndingCensusRow[] = ENDINGS.map(e => ({ id: e.id, reachCount: counts[e.id] ?? 0, reachedBy: reachedBy[e.id] ?? '' }));
  return { rows, trueEndingIds: TRUE_ENDINGS.map(e => e.id) };
};

/** 全シムを実行し集計と違反を返す */
export const aggregateAll = (cfg: { seeds: number; careers: number; maxRuns: number }): {
  survival: SurvivalMatrix;
  poweredSurvival: PoweredSurvivalMatrix;
  fullPowerSurvival: PoweredSurvivalMatrix;
  careers: CareerSummary[];
  legacies: LegacyAnalysis;
  endings: EndingDistribution;
  endingCensus: EndingCensus;
  violations: Violation[];
} => {
  const survival = buildSurvival(cfg.seeds);
  const poweredSurvival = buildPoweredSurvival(cfg.seeds);
  const fullPowerSurvival = buildFullPowerSurvival(cfg.seeds);
  const { summaries, all } = buildCareers(cfg.careers, cfg.maxRuns);
  const legacies = buildLegacies(cfg.seeds, cfg.maxRuns);
  const endings = buildEndings(cfg.seeds);
  const endingCensus = buildEndingCensus(cfg.seeds);

  // 不変条件チェック: 全キャリア + 生還率の難易度単調性（圧0 careful）
  const violations: Violation[] = [];
  for (const c of all) violations.push(...checkCareer(c));
  const p0 = survival.cells
    .filter(c => c.pressure === 0)
    .map(c => ({ label: c.difficultyId, rate: c.careful }));
  violations.push(...checkSurvivalMonotonic(p0));
  // 代表 run の健全性（各難易度1本ずつ checkRun）
  for (const id of DIFFICULTY_IDS) {
    const r = simulateRun({
      difficulty: d(id),
      fx: BASE_FX,
      rng: new SeededRandomSource(1),
      policy: CAREFUL_POLICY,
      events: EVENTS,
    });
    violations.push(...checkRun(r));
  }
  // エンディング到達カバレッジ（未到達ENDを warn 報告）
  violations.push(...checkEndingCoverage(endingCensus.rows));
  return { survival, poweredSurvival, fullPowerSurvival, careers: summaries, legacies, endings, endingCensus, violations };
};
