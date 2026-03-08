/**
 * 統計関連の型定義
 */
import type { SynergyTag } from './evolution';

/** ランの統計データ（集計用） */
export interface RunStatsState {
  kills: number;
  dmgDealt: number;
  dmgTaken: number;
  maxHit: number;
  wDmg: number;
  wTurn: number;
  totalHealing: number;
}

/** ラン統計 */
export interface RunStats {
  id: string;
  date: string;
  result: 'victory' | 'defeat';
  difficulty: number;
  biomeCount: number;
  totalKills: number;
  maxDamage: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealing: number;
  evolutionCount: number;
  synergyCount: number;
  eventCount: number;
  skillUsageCount: number;
  boneEarned: number;
  playtimeSeconds: number;
  awakening: string | undefined;
  challengeId: string | undefined;
  /** エンドレスモード到達ウェーブ（非エンドレスなら undefined） */
  endlessWave: number | undefined;
}

/** 累計統計（実績判定に使用） */
export interface AggregateStats {
  totalRuns: number;
  totalClears: number;
  totalKills: number;
  totalBoneEarned: number;
  totalEvents: number;
  clearedDifficulties: number[];
  achievedAwakenings: string[];
  achievedSynergiesTier1: SynergyTag[];
  achievedSynergiesTier2: SynergyTag[];
  clearedChallenges: string[];
  treeCompletionRate: number;
  lastBossDamageTaken: number;
}
