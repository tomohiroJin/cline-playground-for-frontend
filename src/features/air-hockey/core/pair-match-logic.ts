/**
 * 2v2 ペアマッチのゲームロジックヘルパー
 * processCollisions や resolveMalletPuckOverlap で使用するマレット配列構築など
 */
import type { GameState, Mallet, Vector, EffectTarget } from './types';
import type { CpuUpdateResult } from './ai';
import type { AiBehaviorConfig } from './story-balance';
import type { GameConstants } from './constants';

/** マレット情報（衝突処理用） */
export type MalletEntry = {
  mallet: Mallet;
  side: EffectTarget;
  isPlayer: boolean; // チーム1（player/ally）= true
};

/**
 * GameState から全マレットを配列として取得する
 * 通常モード: player, cpu の2つ
 * 2v2 モード: player, cpu, ally, enemy の4つ
 */
export function getAllMallets(game: GameState): MalletEntry[] {
  const mallets: MalletEntry[] = [
    { mallet: game.player, side: 'player', isPlayer: true },
    { mallet: game.cpu, side: 'cpu', isPlayer: false },
  ];

  if (game.ally) {
    mallets.push({ mallet: game.ally, side: 'ally', isPlayer: true });
  }
  if (game.enemy) {
    mallets.push({ mallet: game.enemy, side: 'enemy', isPlayer: false });
  }

  return mallets;
}

/** チームスコアの型 */
export type TeamScore = { p: number; c: number };

/**
 * ゴール得点を処理する
 * パックが上ゴール（cpu 側）に入る → team1（p）得点
 * パックが下ゴール（player 側）に入る → team2（c）得点
 */
export function applyGoalScore(
  score: TeamScore,
  scored: 'player' | 'cpu'
): TeamScore {
  return scored === 'cpu'
    ? { ...score, p: score.p + 1 }
    : { ...score, c: score.c + 1 };
}

/** 2v2 の追加マレット AI 状態 */
export type ExtraMalletAiState = {
  target: Vector | null;
  targetTime: number;
  stuckTimer: number;
};

/**
 * 追加マレット（ally/enemy）の CPU AI を更新する
 * CpuAI.updateWithBehavior は GameState.cpu を操作するため、
 * 一時的に cpu フィールドを差し替えて呼び出し、結果を返す
 */
export function updateExtraMalletAI(
  game: GameState,
  mallet: Mallet,
  aiState: ExtraMalletAiState,
  updateFn: (g: GameState, config: AiBehaviorConfig, now: number, consts: GameConstants, scoreDiff?: number) => CpuUpdateResult | null,
  config: AiBehaviorConfig,
  now: number,
  consts: GameConstants,
  scoreDiff: number
): { mallet: Mallet; aiState: ExtraMalletAiState } | undefined {
  const tempGame = {
    ...game,
    cpu: mallet,
    cpuTarget: aiState.target,
    cpuTargetTime: aiState.targetTime,
    cpuStuckTimer: aiState.stuckTimer,
  };
  const result = updateFn(tempGame, config, now, consts, scoreDiff);
  if (!result) return undefined;
  return {
    mallet: result.cpu,
    aiState: {
      target: result.cpuTarget,
      targetTime: result.cpuTargetTime,
      stuckTimer: result.cpuStuckTimer,
    },
  };
}
