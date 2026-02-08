/* eslint-disable @typescript-eslint/no-explicit-any */

/** ゲームの進行フェーズ */
export type GamePhase =
  | 'title'
  | 'difficulty'
  | 'explore'
  | 'event'
  | 'result'
  | 'floor_clear'
  | 'game_over'
  | 'ending'
  | 'unlocks'
  | 'stats';

/** 難易度ID */
export type DifficultyId = 'easy' | 'normal' | 'hard' | 'abyss';

/** 難易度定義 */
export interface Difficulty {
  id: DifficultyId;
  name: string;
  sub: string;
  color: string;
  icon: string;
  desc: string;
  hpMod: number;
  mnMod: number;
  drainMod: number;
  dmgMult: number;
  kpDeath: number;
  kpWin: number;
}

/** 状態異常メタ情報 */
export interface StatusEffect {
  colors: [string, string, string];
  tick: { hp: number; mn: number } | null;
}

/** プレイヤー状態 */
export interface Player {
  hp: number;
  maxHp: number;
  mn: number;
  maxMn: number;
  inf: number;
  st: string[];
}

/** エンディング情報 */
export interface Ending {
  id: string;
  name: string;
}

/** メタデータ（周回情報） */
export interface MetaData {
  runs: number;
  escapes: number;
  kp: number;
  unlocked: string[];
  bestFl: number;
  totalEvents: number;
  endings: string[];
  clearedDiffs: string[];
  totalDeaths: number;
  lastRun: any;
  title: string | null;
}

/** ゲームイベント（Phase 1 では any を許容） */
export type GameEvent = any;
