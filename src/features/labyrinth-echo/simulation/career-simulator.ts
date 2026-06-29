/**
 * 迷宮の残響 - キャリア（周回）シミュレータ
 *
 * 真ルート解禁まで run を繰り返し、echoDepth 蓄積・断片収集・レガシー解禁の
 * 累積過程を再現する。本番ドメイン関数（incrementEchoDepth/selectSafetyNetFragment/
 * isTrueRouteUnlocked/unlockedLegacies）を流用し定数乖離を防ぐ。決定論（seed固定）。
 */
import { simulateRun } from './run-simulator';
import type { RunPolicy } from './run-simulator';
import { incrementEchoDepth, selectSafetyNetFragment } from '../domain/services/echo-service';
import { isTrueRouteUnlocked } from '../domain/services/finale-service';
import { unlockedLegacies } from '../domain/services/legacy-service';
import { createMetaState } from '../domain/models/meta-state';
import type { MetaState } from '../domain/models/meta-state';
import type { DifficultyDef } from '../domain/models/difficulty';
import type { FxState } from '../domain/models/unlock';
import type { EchoLegacy } from '../domain/models/echo';
import type { GameEvent } from '../events/event-utils';
import { SeededRandomSource } from '../domain/events/random';

/** 1周（run）の記録 */
export interface CareerStep {
  runIndex: number;
  survived: boolean;
  cause: string;
  floorReached: number;
  depth: number;
  fragmentCount: number;
  fragsReadThisRun: number;
  safetyNetGranted: boolean;
}

/** 1キャリア（真ルート解禁まで）の結果 */
export interface CareerResult {
  unlocked: boolean;
  runsToUnlock: number;
  escapesToUnlock: number;
  deathsToUnlock: number;
  finalDepth: number;
  finalFragments: number;
  timeline: CareerStep[];
  legacyUnlocks: { runIndex: number; legacyId: string }[];
}

/** 1キャリアを決定論的にシミュレートする */
export const simulateCareer = (params: {
  difficulty: DifficultyDef;
  fx: FxState;
  policy: RunPolicy;
  events: readonly GameEvent[];
  careerSeed: number;
  maxRuns: number;
  pressure?: number;
  legacy?: EchoLegacy | null;
}): CareerResult => {
  const { difficulty, fx, policy, events, careerSeed, maxRuns, pressure = 0, legacy = null } = params;
  let meta: MetaState = createMetaState();
  let runs = 0, escapes = 0, deaths = 0;
  const timeline: CareerStep[] = [];
  const legacyUnlocks: { runIndex: number; legacyId: string }[] = [];
  const seenLegacies = new Set<string>();

  while (runs < maxRuns) {
    runs++;
    // 周回ごとに決定論シード（キャリアシード×1000 + run番号）
    const rng = new SeededRandomSource(careerSeed * 1000 + runs);
    const res = simulateRun({ difficulty, fx, rng, policy, events, pressure, meta, legacy });

    let fragsReadThisRun = 0;
    let safetyNetGranted = false;

    if (res.survived) {
      escapes++;
      const newDepth = incrementEchoDepth(meta.echoDepth);
      // 探索中に読んだ断片（未収集のみ採用）
      const readFrags = res.fragmentsRead.filter(id => !meta.fragments.includes(id));
      fragsReadThisRun = readFrags.length;
      let fragments = readFrags.length ? [...meta.fragments, ...readFrags] : meta.fragments;
      // セーフティネット（脱出ごとに1片保証）
      const safety = selectSafetyNetFragment(newDepth, fragments);
      if (safety && !fragments.includes(safety.id)) {
        fragments = [...fragments, safety.id];
        safetyNetGranted = true;
      }
      meta = { ...meta, echoDepth: newDepth, fragments, escapes: meta.escapes + 1 };

      // レガシー解禁検知（新規に完収集された先人）
      for (const lg of unlockedLegacies(meta.fragments)) {
        if (!seenLegacies.has(lg.id)) {
          seenLegacies.add(lg.id);
          legacyUnlocks.push({ runIndex: runs, legacyId: lg.id });
        }
      }
    } else {
      deaths++;
      meta = { ...meta, totalDeaths: meta.totalDeaths + 1 };
    }

    timeline.push({
      runIndex: runs,
      survived: res.survived,
      cause: res.cause,
      floorReached: res.floorReached,
      depth: meta.echoDepth,
      fragmentCount: meta.fragments.length,
      fragsReadThisRun,
      safetyNetGranted,
    });

    if (isTrueRouteUnlocked(meta)) {
      return { unlocked: true, runsToUnlock: runs, escapesToUnlock: escapes, deathsToUnlock: deaths, finalDepth: meta.echoDepth, finalFragments: meta.fragments.length, timeline, legacyUnlocks };
    }
  }
  return { unlocked: false, runsToUnlock: runs, escapesToUnlock: escapes, deathsToUnlock: deaths, finalDepth: meta.echoDepth, finalFragments: meta.fragments.length, timeline, legacyUnlocks };
};
