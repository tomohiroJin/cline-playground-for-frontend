/**
 * 原始進化録 - PRIMAL PATH - localStorage ラッパー
 */
import type { SaveData, RunStats, AchievementState, AggregateStats } from './types';
import { SAVE_KEY, FRESH_SAVE, STATS_KEY, ACHIEVEMENTS_KEY, AGGREGATE_KEY, MAX_RUN_STATS } from './constants';

/** セーブデータの読み書き（localStorage ラッパー） */
export const Storage = Object.freeze({
  /** セーブデータを localStorage に保存する */
  save: (data: SaveData): void => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e: unknown) {
      console.error('[Storage.save]', e instanceof Error ? e.message : String(e));
    }
  },
  /** localStorage からセーブデータを読み込む（未保存時は null） */
  load: (): SaveData | null => {
    try {
      const r = localStorage.getItem(SAVE_KEY);
      return r ? (JSON.parse(r) as SaveData) : null;
    } catch (e: unknown) {
      console.error('[Storage.load]', e instanceof Error ? e.message : String(e));
      return null;
    }
  },
  /** 初期状態のセーブデータを生成する（ディープコピー） */
  fresh: (): SaveData => JSON.parse(JSON.stringify(FRESH_SAVE)),
});

/** 初期累計統計 */
const FRESH_AGGREGATE: AggregateStats = {
  totalRuns: 0,
  totalClears: 0,
  totalKills: 0,
  totalBoneEarned: 0,
  totalEvents: 0,
  clearedDifficulties: [],
  achievedAwakenings: [],
  achievedSynergiesTier1: [],
  achievedSynergiesTier2: [],
  clearedChallenges: [],
  treeCompletionRate: 0,
  lastBossDamageTaken: 0,
};

/** メタ進行データのストレージ */
export const MetaStorage = Object.freeze({
  /** ラン統計の保存（最新50件に制限） */
  saveRunStats: (stats: RunStats[]): void => {
    try {
      const trimmed = stats.slice(-MAX_RUN_STATS);
      localStorage.setItem(STATS_KEY, JSON.stringify(trimmed));
    } catch (e: unknown) {
      console.error('[MetaStorage.saveRunStats]', e instanceof Error ? e.message : String(e));
    }
  },
  /** ラン統計の読込 */
  loadRunStats: (): RunStats[] => {
    try {
      const r = localStorage.getItem(STATS_KEY);
      return r ? (JSON.parse(r) as RunStats[]) : [];
    } catch (e: unknown) {
      console.error('[MetaStorage.loadRunStats]', e instanceof Error ? e.message : String(e));
      return [];
    }
  },
  /** 実績状態の保存 */
  saveAchievements: (states: AchievementState[]): void => {
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(states));
    } catch (e: unknown) {
      console.error('[MetaStorage.saveAchievements]', e instanceof Error ? e.message : String(e));
    }
  },
  /** 実績状態の読込 */
  loadAchievements: (): AchievementState[] => {
    try {
      const r = localStorage.getItem(ACHIEVEMENTS_KEY);
      return r ? (JSON.parse(r) as AchievementState[]) : [];
    } catch (e: unknown) {
      console.error('[MetaStorage.loadAchievements]', e instanceof Error ? e.message : String(e));
      return [];
    }
  },
  /** 累計統計の保存 */
  saveAggregate: (stats: AggregateStats): void => {
    try {
      localStorage.setItem(AGGREGATE_KEY, JSON.stringify(stats));
    } catch (e: unknown) {
      console.error('[MetaStorage.saveAggregate]', e instanceof Error ? e.message : String(e));
    }
  },
  /** 累計統計の読込 */
  loadAggregate: (): AggregateStats => {
    try {
      const r = localStorage.getItem(AGGREGATE_KEY);
      return r ? (JSON.parse(r) as AggregateStats) : { ...FRESH_AGGREGATE, clearedDifficulties: [], achievedAwakenings: [], achievedSynergiesTier1: [], achievedSynergiesTier2: [], clearedChallenges: [] };
    } catch (e: unknown) {
      console.error('[MetaStorage.loadAggregate]', e instanceof Error ? e.message : String(e));
      return { ...FRESH_AGGREGATE, clearedDifficulties: [], achievedAwakenings: [], achievedSynergiesTier1: [], achievedSynergiesTier2: [], clearedChallenges: [] };
    }
  },
});
