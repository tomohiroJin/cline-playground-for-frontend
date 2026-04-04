/**
 * ストーリーモード バランス設定
 * ステージごとの AI 振る舞い・アイテム出現・カムバック補正を定義
 */
import type { Difficulty } from './types';
import type { GameConstants } from './constants';
import { CONSTANTS } from './constants';
import { type AiPlayStyle, DEFAULT_PLAY_STYLE, CHARACTER_AI_PROFILES, getCharacterAiProfile } from './character-ai-profiles';

// AiPlayStyle と DEFAULT_PLAY_STYLE を re-export（後方互換のため）
export type { AiPlayStyle };
export { DEFAULT_PLAY_STYLE };

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
  /** キャラクター個性によるプレイスタイル（オプショナル・後方互換） */
  playStyle?: AiPlayStyle;
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
    playStyle: CHARACTER_AI_PROFILES['rookie'],
  },
  normal: {
    maxSpeed: 4.7,
    predictionFactor: 8,
    wobble: 0,
    skipRate: 0,
    centerWeight: 0,
    wallBounce: false,
    playStyle: CHARACTER_AI_PROFILES['regular'],
  },
  hard: {
    maxSpeed: 8.0,
    predictionFactor: 16,
    wobble: 0,
    skipRate: 0,
    centerWeight: 0,
    wallBounce: true,
    playStyle: CHARACTER_AI_PROFILES['ace'],
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
      playStyle: CHARACTER_AI_PROFILES['hiro'],
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
      playStyle: CHARACTER_AI_PROFILES['misaki'],
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
      playStyle: CHARACTER_AI_PROFILES['takuma'],
    },
    itemSpawnInterval: CONSTANTS.TIMING.ITEM_SPAWN,
    comebackThreshold: 2,
    comebackMalletBonus: 0.15,
    comebackGoalReduction: 0.15,
  },
  // ── 第2章: 地区大会編 ──────────────────────────────
  // ステージ 2-1: 嵐の前の一打（練習試合 vs ソウタ — ウォーミングアップ）
  '2-1': {
    ai: {
      maxSpeed: 1.8,
      predictionFactor: 1.0,
      wobble: 35,
      skipRate: 0.05,
      centerWeight: 0.7,
      wallBounce: false,
      playStyle: CHARACTER_AI_PROFILES['rookie'],
    },
    itemSpawnInterval: CONSTANTS.TIMING.ITEM_SPAWN,
    comebackThreshold: CONSTANTS.COMEBACK.THRESHOLD,
    comebackMalletBonus: CONSTANTS.COMEBACK.MALLET_BONUS,
    comebackGoalReduction: CONSTANTS.COMEBACK.GOAL_REDUCTION,
  },
  // ステージ 2-2: 堅実なる壁（1回戦 vs ケンジ — 基本の壁）
  '2-2': {
    ai: {
      maxSpeed: 3.5,
      predictionFactor: 6,
      wobble: 8,
      skipRate: 0.01,
      centerWeight: 0.4,
      wallBounce: false,
      playStyle: CHARACTER_AI_PROFILES['regular'],
    },
    itemSpawnInterval: CONSTANTS.TIMING.ITEM_SPAWN,
    comebackThreshold: 3,
    comebackMalletBonus: CONSTANTS.COMEBACK.MALLET_BONUS,
    comebackGoalReduction: CONSTANTS.COMEBACK.GOAL_REDUCTION,
  },
  // ステージ 2-3: 幻惑の罠（準決勝 vs カナタ — 壁バウンス変則）
  '2-3': {
    ai: {
      maxSpeed: 3.8,
      predictionFactor: 5,
      wobble: 20,
      skipRate: 0,
      centerWeight: 0.1,
      wallBounce: true,
      playStyle: CHARACTER_AI_PROFILES['kanata'],
    },
    itemSpawnInterval: 3500,
    comebackThreshold: 2,
    comebackMalletBonus: 0.15,
    comebackGoalReduction: CONSTANTS.COMEBACK.GOAL_REDUCTION,
  },
  // ステージ 2-4: 氷の頂へ（決勝 vs レン — 最強の壁）
  '2-4': {
    ai: {
      maxSpeed: 6.5,
      predictionFactor: 13,
      wobble: 0,
      skipRate: 0,
      centerWeight: 0,
      wallBounce: true,
      playStyle: CHARACTER_AI_PROFILES['ace'],
    },
    itemSpawnInterval: CONSTANTS.TIMING.ITEM_SPAWN,
    comebackThreshold: 2,
    comebackMalletBonus: 0.2,
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

/** フリー対戦用 AI 設定を構築する（難易度ベース + キャラ playStyle） */
export const buildFreeBattleAiConfig = (
  difficulty: Difficulty,
  characterId?: string
): AiBehaviorConfig => {
  const base = AI_BEHAVIOR_PRESETS[difficulty];
  if (!characterId) return base;
  return {
    ...base,
    playStyle: getCharacterAiProfile(characterId),
  };
};

/** 味方 CPU の aggressiveness 上限（守備的に） */
const ALLY_AGGRESSIVENESS_CAP = 0.5;
/** 味方 CPU の reactionDelay 上限（最低限の反応速度を保証 #9） */
const ALLY_REACTION_DELAY_CAP = 120;

/** 味方 CPU 用 AI 設定を構築する（aggressiveness と reactionDelay に上限を設けて味方性能を保証） */
export const buildAllyAiConfig = (
  difficulty: Difficulty,
  characterId?: string
): AiBehaviorConfig => {
  const base = buildFreeBattleAiConfig(difficulty, characterId);
  if (!base.playStyle) return base;

  const needsCap =
    base.playStyle.aggressiveness > ALLY_AGGRESSIVENESS_CAP ||
    base.playStyle.reactionDelay > ALLY_REACTION_DELAY_CAP;
  if (!needsCap) return base;

  return {
    ...base,
    playStyle: {
      ...base.playStyle,
      aggressiveness: Math.min(base.playStyle.aggressiveness, ALLY_AGGRESSIVENESS_CAP),
      reactionDelay: Math.min(base.playStyle.reactionDelay, ALLY_REACTION_DELAY_CAP),
    },
  };
};

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
