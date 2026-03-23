/**
 * ストーリーモード バランス設定
 * ステージごとの AI 振る舞い・アイテム出現・カムバック補正を定義
 */
import type { Difficulty } from './types';
import type { GameConstants } from './constants';
import { CONSTANTS } from './constants';

// ── AI 振る舞い設定型 ──────────────────────────────

/** CPU AI の振る舞いを制御するパラメータ */
export type AiBehaviorConfig = {
  /** CPU の最大移動速度 */
  maxSpeed: number;
  /** パック軌道の予測係数（高いほど先読みが深い） */
  predictionFactor: number;
  /** 狙いのブレ幅（px、大きいほど不正確） */
  wobble: number;
  /** フレームスキップ率（0-1、CPU がミスする確率） */
  skipRate: number;
  /** ターゲットを中央に寄せる重み（0-1、高いほど中央に留まる） */
  centerWeight: number;
  /** 壁バウンス予測の有無 */
  wallBounce: boolean;
};

// ── 難易度プリセット ──────────────────────────────

export const AI_BEHAVIOR_PRESETS: Record<Difficulty, AiBehaviorConfig> = {
  easy: {
    maxSpeed: 2.0,
    predictionFactor: 1.3,
    wobble: 40,
    skipRate: 0.05,
    centerWeight: 0.7,
    wallBounce: false,
  },
  normal: {
    maxSpeed: 4.7,
    predictionFactor: 8,
    wobble: 0,
    skipRate: 0,
    centerWeight: 0,
    wallBounce: false,
  },
  hard: {
    maxSpeed: 8.0,
    predictionFactor: 16,
    wobble: 0,
    skipRate: 0,
    centerWeight: 0,
    wallBounce: true,
  },
};

// ── ステージ別バランス設定型 ──────────────────────

/** ステージごとのバランス調整パラメータ */
export type StageBalanceConfig = {
  /** AI 振る舞い設定 */
  ai: AiBehaviorConfig;
  /** アイテム出現間隔（ms） */
  itemSpawnInterval: number;
  /** カムバック補正の発動スコア差閾値 */
  comebackThreshold: number;
  /** カムバック時のマレットサイズボーナス（0-1） */
  comebackMalletBonus: number;
  /** カムバック時のゴールサイズ縮小率（0-1） */
  comebackGoalReduction: number;
};

// ── ステージ別バランスマップ ──────────────────────

const STAGE_BALANCE_MAP: Record<string, StageBalanceConfig> = {
  // ステージ 1-1: はじめの一打（初心者が2-3回で勝てる）
  '1-1': {
    ai: {
      maxSpeed: 1.6,
      predictionFactor: 0.7,
      wobble: 53,
      skipRate: 0.1,
      centerWeight: 0.8,
      wallBounce: false,
    },
    itemSpawnInterval: CONSTANTS.TIMING.ITEM_SPAWN,
    comebackThreshold: CONSTANTS.COMEBACK.THRESHOLD,
    comebackMalletBonus: CONSTANTS.COMEBACK.MALLET_BONUS,
    comebackGoalReduction: CONSTANTS.COMEBACK.GOAL_REDUCTION,
  },
  // ステージ 1-2: テクニカルな壁（アイテム活用で勝てる）
  '1-2': {
    ai: {
      maxSpeed: 4.0,
      predictionFactor: 5.3,
      wobble: 13,
      skipRate: 0.02,
      centerWeight: 0.2,
      wallBounce: false,
    },
    itemSpawnInterval: 4000, // アイテム出現を速めて活用を促す
    comebackThreshold: 2, // スコア差2で発動（デフォルト3より早い）
    comebackMalletBonus: 0.15, // マレットボーナス強め
    comebackGoalReduction: CONSTANTS.COMEBACK.GOAL_REDUCTION,
  },
  // ステージ 1-3: 部長の壁（苦戦するが練習すれば勝てる）
  '1-3': {
    ai: {
      maxSpeed: 6.7,
      predictionFactor: 13.3,
      wobble: 0,
      skipRate: 0,
      centerWeight: 0,
      wallBounce: true,
    },
    itemSpawnInterval: CONSTANTS.TIMING.ITEM_SPAWN,
    comebackThreshold: 2,
    comebackMalletBonus: 0.15,
    comebackGoalReduction: 0.15,
  },
};

/** デフォルトバランス設定（normal プリセットベース） */
const DEFAULT_BALANCE: StageBalanceConfig = {
  ai: { ...AI_BEHAVIOR_PRESETS.normal },
  itemSpawnInterval: CONSTANTS.TIMING.ITEM_SPAWN,
  comebackThreshold: CONSTANTS.COMEBACK.THRESHOLD,
  comebackMalletBonus: CONSTANTS.COMEBACK.MALLET_BONUS,
  comebackGoalReduction: CONSTANTS.COMEBACK.GOAL_REDUCTION,
};

// ── 公開関数 ──────────────────────────────────────

/** ステージ ID に対応するバランス設定を取得 */
export const getStoryStageBalance = (stageId: string): StageBalanceConfig => {
  return STAGE_BALANCE_MAP[stageId] ?? DEFAULT_BALANCE;
};

/** ステージ ID に対応する GameConstants を生成（不変） */
export const createStageConstants = (stageId: string): GameConstants => {
  const balance = getStoryStageBalance(stageId);
  return {
    ...CONSTANTS,
    CPU: {
      easy: balance.ai.maxSpeed,
      normal: balance.ai.maxSpeed,
      hard: balance.ai.maxSpeed,
    },
    TIMING: {
      ...CONSTANTS.TIMING,
      ITEM_SPAWN: balance.itemSpawnInterval,
    },
    COMEBACK: {
      THRESHOLD: balance.comebackThreshold,
      MALLET_BONUS: balance.comebackMalletBonus,
      GOAL_REDUCTION: balance.comebackGoalReduction,
    },
  };
};
