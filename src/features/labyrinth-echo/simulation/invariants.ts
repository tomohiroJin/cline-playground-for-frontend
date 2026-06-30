/**
 * 迷宮の残響 - シミュレーション不変条件チェッカ
 *
 * キャリア・単発run・集計レベルの不変条件を検査し、違反レコードを返す純粋関数群。
 * CIテスト（回帰ガード＋検出器自体のテスト）とレポート警告欄の両方で使用する。
 */
import type { CareerResult } from './career-simulator';
import type { RunResult } from './run-simulator';
import { ECHO_DEPTH_MAX } from '../domain/services/echo-service';
import { ECHO_FRAGMENTS } from '../domain/constants/echo-fragment-defs';
import { ENDINGS } from '../domain/constants/ending-defs';
import { TRUE_ENDINGS } from '../domain/constants/true-ending-defs';
import { CFG } from '../domain/constants/config';
import { RUN_CAUSE } from './run-cause';

/** 不変条件違反レコード */
export interface Violation {
  severity: 'error' | 'warn';
  rule: string;
  detail: string;
}

const FRAGMENT_IDS = new Set(ECHO_FRAGMENTS.map(f => f.id));
const FRAGMENT_TOTAL = ECHO_FRAGMENTS.length; // 19
const ENDING_IDS = new Set<string>([...ENDINGS.map(e => e.id), ...TRUE_ENDINGS.map(e => e.id)]);
const KNOWN_CAUSES = new Set<string>(Object.values(RUN_CAUSE));

/** キャリア結果の不変条件を検査する */
export const checkCareer = (career: CareerResult): Violation[] => {
  const v: Violation[] = [];
  const { timeline } = career;

  for (const step of timeline) {
    if (step.depth > ECHO_DEPTH_MAX) {
      v.push({ severity: 'error', rule: 'depth_max', detail: `run ${step.runIndex}: depth ${step.depth} > ${ECHO_DEPTH_MAX}` });
    }
    if (step.fragmentCount > FRAGMENT_TOTAL) {
      v.push({ severity: 'error', rule: 'fragment_max', detail: `run ${step.runIndex}: 断片 ${step.fragmentCount} > ${FRAGMENT_TOTAL}` });
    }
  }
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].depth < timeline[i - 1].depth) {
      v.push({ severity: 'error', rule: 'depth_monotonic', detail: `run ${timeline[i].runIndex}: depth ${timeline[i].depth} < 前周 ${timeline[i - 1].depth}` });
    }
    if (timeline[i].fragmentCount < timeline[i - 1].fragmentCount) {
      v.push({ severity: 'error', rule: 'fragment_monotonic', detail: `run ${timeline[i].runIndex}: 断片 ${timeline[i].fragmentCount} < 前周 ${timeline[i - 1].fragmentCount}` });
    }
  }
  // escapes + deaths = runs を検査する。deaths >= 0 のため、これは escapes <= runs も含意する
  // （escapes > runs なら escapes + deaths > runs となり必ず本ルールが発火する）。
  // かつて別に持っていた escapes_le_runs ルールは独立した信号を増やさないため統合・削除した（Issue #143）。
  if (career.escapesToUnlock + career.deathsToUnlock !== career.runsToUnlock) {
    v.push({ severity: 'error', rule: 'run_count', detail: `escapes(${career.escapesToUnlock}) + deaths(${career.deathsToUnlock}) != runs(${career.runsToUnlock})` });
  }
  if (career.unlocked && (career.finalDepth !== ECHO_DEPTH_MAX || career.finalFragments !== FRAGMENT_TOTAL)) {
    v.push({ severity: 'error', rule: 'true_route_condition', detail: `解禁時 depth=${career.finalDepth}(要${ECHO_DEPTH_MAX}) 断片=${career.finalFragments}(要${FRAGMENT_TOTAL})` });
  }
  return v;
};

/** 単発run結果の不変条件を検査する */
export const checkRun = (run: RunResult): Violation[] => {
  const v: Violation[] = [];
  if (run.floorReached < 1 || run.floorReached > CFG.MAX_FLOOR) {
    v.push({ severity: 'error', rule: 'floor_range', detail: `floorReached=${run.floorReached} は 1..${CFG.MAX_FLOOR} 外` });
  }
  if (!KNOWN_CAUSES.has(run.cause)) {
    v.push({ severity: 'error', rule: 'cause_valid', detail: `未知の cause: ${run.cause}` });
  }
  if (run.survived && run.endingId !== null && !ENDING_IDS.has(run.endingId)) {
    v.push({ severity: 'error', rule: 'ending_valid', detail: `未知の endingId: ${run.endingId}` });
  }
  for (const id of run.fragmentsRead) {
    if (!FRAGMENT_IDS.has(id)) {
      v.push({ severity: 'error', rule: 'fragment_valid', detail: `未知の断片ID: ${id}` });
    }
  }
  return v;
};

/**
 * label 降順に rate が単調減少であるべき列を検査する（生還率カーブ）
 *
 * 難易度間の生還率単調性は統計的傾向であり、ハード不変条件ではない。
 * 小サンプルのシム実行ではサンプリングノイズで逆転し得るため、
 * 違反は warn として報告する（レポートには表示されるが CI は落とさない）。
 */
export const checkSurvivalMonotonic = (rates: { label: string; rate: number }[]): Violation[] => {
  const v: Violation[] = [];
  for (let i = 1; i < rates.length; i++) {
    if (rates[i].rate > rates[i - 1].rate) {
      v.push({ severity: 'warn', rule: 'survival_monotonic', detail: `${rates[i].label}(${rates[i].rate}) > ${rates[i - 1].label}(${rates[i - 1].rate})` });
    }
  }
  return v;
};

/**
 * エンディング到達性: センサスで到達0回のENDを warn 報告する。
 *
 * 未到達は「真に到達不能」か「測定範囲が狭い」かの切り分けが要るため warn（CIは落とさない）。
 * 引数は plain な行配列（analysis への循環参照を避けるため EndingCensus 型に依存しない）。
 */
export const checkEndingCoverage = (rows: { id: string; reachCount: number }[]): Violation[] => {
  const v: Violation[] = [];
  for (const r of rows) {
    if (r.reachCount === 0) {
      v.push({ severity: 'warn', rule: 'ending_unreached', detail: `${r.id} はセンサスで未到達（到達不能の疑い／要確認）` });
    }
  }
  return v;
};
