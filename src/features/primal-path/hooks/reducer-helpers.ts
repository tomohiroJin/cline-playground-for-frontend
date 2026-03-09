/**
 * 原始進化録 - PRIMAL PATH - Reducer 共通ヘルパー
 *
 * 複数の sub-reducer で共有されるユーティリティ関数。
 */
import type { GameState, RunState, SaveData, RunStats, AggregateStats, AchievementState } from '../types';
import {
  pickBiomeAuto, applyAutoLastBiome, applyFirstBiome, rollE,
  calcSynergies, checkAchievement,
} from '../game-logic';
import { ACHIEVEMENTS } from '../constants';

/** 100%復活時のコスト倍率 */
export const FULL_REVIVE_COST_MULTIPLIER = 1.8;

/** バイオーム遷移後の状態を決定する */
export function transitionAfterBiome(state: GameState, run: RunState): GameState {
  if (run.bc >= 3) {
    // エンドレスモード: チェックポイント画面で続行/終了を選択させる
    if (run.isEndless) {
      return { ...state, run, phase: 'endless_checkpoint' };
    }
    return { ...state, run, phase: 'prefinal' };
  }
  const pick = pickBiomeAuto(run);
  if (pick.needSelection) {
    return { ...state, run, phase: 'biome' };
  }
  const autoRun = applyAutoLastBiome(run);
  const evoPicks = rollE(autoRun);
  return { ...state, run: autoRun, phase: 'evo', evoPicks };
}

/** 進化選択フェーズに遷移する（rollE + phase 設定） */
export function transitionToEvoPicks(state: GameState, run: RunState): GameState {
  const evoPicks = rollE(run);
  return { ...state, run, phase: 'evo', evoPicks };
}

/** ラン開始時の初期バイオーム選択と進化セットアップ */
export function setupInitialRun(state: GameState, run: RunState, save: SaveData, extraOverrides?: Partial<GameState>): GameState {
  const pick = pickBiomeAuto(run);
  const next = !pick.needSelection ? applyFirstBiome(run) : run;
  const evoPicks = rollE(next);
  return {
    ...state, save, run: next, phase: 'evo', finalMode: false,
    evoPicks, pendingAwk: null, gameResult: null,
    ...extraOverrides,
  };
}

/** ランの結果から累計統計を更新する */
export function updateAggregate(prev: AggregateStats, rs: RunStats, run: RunState): AggregateStats {
  const next: AggregateStats = {
    ...prev,
    totalRuns: prev.totalRuns + 1,
    totalKills: prev.totalKills + rs.totalKills,
    totalBoneEarned: prev.totalBoneEarned + rs.boneEarned,
    totalEvents: prev.totalEvents + rs.eventCount,
    clearedDifficulties: [...prev.clearedDifficulties],
    achievedAwakenings: [...prev.achievedAwakenings],
    achievedSynergiesTier1: [...prev.achievedSynergiesTier1],
    achievedSynergiesTier2: [...prev.achievedSynergiesTier2],
    clearedChallenges: [...prev.clearedChallenges],
    treeCompletionRate: prev.treeCompletionRate,
    lastBossDamageTaken: run.dmgTaken,
  };

  if (rs.result === 'victory') {
    next.totalClears = prev.totalClears + 1;
    if (!next.clearedDifficulties.includes(rs.difficulty)) {
      next.clearedDifficulties.push(rs.difficulty);
    }
    if (rs.challengeId && !next.clearedChallenges.includes(rs.challengeId)) {
      next.clearedChallenges.push(rs.challengeId);
    }
  } else {
    next.totalClears = prev.totalClears;
  }

  /* 覚醒記録の更新 */
  for (const aw of run.awoken) {
    if (!next.achievedAwakenings.includes(aw.id)) {
      next.achievedAwakenings.push(aw.id);
    }
  }

  /* シナジー記録の更新 */
  const synergies = calcSynergies(run.evs);
  for (const syn of synergies) {
    if (syn.tier >= 1 && !next.achievedSynergiesTier1.includes(syn.tag)) {
      next.achievedSynergiesTier1.push(syn.tag);
    }
    if (syn.tier >= 2 && !next.achievedSynergiesTier2.includes(syn.tag)) {
      next.achievedSynergiesTier2.push(syn.tag);
    }
  }

  return next;
}

/** 実績チェックを実行し、新規解除を返す */
export function checkAllAchievements(
  currentStates: AchievementState[],
  stats: RunStats,
  aggregate: AggregateStats,
): { nextStates: AchievementState[]; newIds: string[] } {
  const newIds: string[] = [];
  const nextStates = ACHIEVEMENTS.map(ach => {
    const existing = currentStates.find(s => s.id === ach.id);
    if (existing?.unlocked) return existing;

    const unlocked = checkAchievement(ach, aggregate, stats);
    if (unlocked) {
      newIds.push(ach.id);
      return { id: ach.id, unlocked: true, unlockedDate: new Date().toISOString() };
    }
    return existing ?? { id: ach.id, unlocked: false, unlockedDate: undefined };
  });

  return { nextStates, newIds };
}
