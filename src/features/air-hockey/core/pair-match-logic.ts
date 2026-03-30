/**
 * 2v2 ペアマッチのゲームロジックヘルパー
 * processCollisions や resolveMalletPuckOverlap で使用するマレット配列構築など
 */
import type { GameState, Mallet, Vector, EffectTarget, Puck } from './types';
import type { CpuUpdateResult } from './ai';
import type { AiBehaviorConfig } from './story-balance';
import type { GameConstants } from './constants';
import { getPlayerZone } from './constants';
import { clamp } from '../../../utils/math-utils';

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
 * スコア差に応じて aggressiveness を動的に調整する（S-4）
 * 負けている→攻撃的、勝っている→守備的
 * adaptability が高いほど調整幅が大きい
 */
export function getScoreAdjustment(
  scoreDiff: number,
  adaptability: number
): number {
  if (Math.abs(scoreDiff) < 2) return 0;
  const direction = scoreDiff < 0 ? 1 : -1;
  return direction * 0.1 * adaptability;
}

/** teamRole に基づく aggressiveness 調整値 */
const TEAM_ROLE_AGGRESSIVENESS: Record<string, number> = {
  attacker: 0.3,
  defender: -0.3,
  balanced: 0,
};

/**
 * ally の sidePreference 反転（R-4）と teamRole の aggressiveness 調整（S6-3e）を適用
 */
function applyTeamAndSideAdjustments(
  config: AiBehaviorConfig,
  isPlayerTeam: boolean
): AiBehaviorConfig {
  if (!config.playStyle) return config;

  const ps = config.playStyle;
  const sideFlip = isPlayerTeam ? -1 : 1;
  const roleAdj = TEAM_ROLE_AGGRESSIVENESS[ps.teamRole] ?? 0;
  const adjustedAggressiveness = Math.max(0, Math.min(1, ps.aggressiveness + roleAdj));

  return {
    ...config,
    playStyle: {
      ...ps,
      sidePreference: ps.sidePreference * sideFlip,
      aggressiveness: adjustedAggressiveness,
    },
  };
}

/** Y 軸を反転する（ally 用座標変換） */
function flipY(y: number, H: number): number {
  return H - y;
}

/** パック配列の Y 座標・速度を反転したコピーを生成 */
function flipPucks(pucks: Puck[], H: number): Puck[] {
  return pucks.map(p => ({ ...p, y: flipY(p.y, H), vy: -p.vy }));
}

/**
 * 追加マレット（ally/enemy）の CPU AI を更新する
 * CpuAI.updateWithBehavior は CPU 側（上半分）を前提とするため、
 * ally（player チーム・下半分）の場合は座標を Y 軸反転して渡し、結果を再度反転する
 *
 * @param team - 'player': ally（下半分）, 'cpu': enemy（上半分、反転不要）
 */
export function updateExtraMalletAI(
  game: GameState,
  mallet: Mallet,
  aiState: ExtraMalletAiState,
  updateFn: (g: GameState, config: AiBehaviorConfig, now: number, consts: GameConstants, scoreDiff?: number) => CpuUpdateResult | null,
  config: AiBehaviorConfig,
  now: number,
  consts: GameConstants,
  scoreDiff: number,
  team: 'player' | 'cpu' = 'cpu'
): { mallet: Mallet; aiState: ExtraMalletAiState } | undefined {
  const H = consts.CANVAS.HEIGHT;
  const isPlayerTeam = team === 'player';

  // ally（player チーム）の場合、座標を Y 軸反転して AI に渡す
  const effectiveMallet = isPlayerTeam
    ? { ...mallet, y: flipY(mallet.y, H), vy: -mallet.vy }
    : mallet;
  const effectivePucks = isPlayerTeam ? flipPucks(game.pucks, H) : game.pucks;
  const effectiveTarget = isPlayerTeam && aiState.target
    ? { ...aiState.target, y: flipY(aiState.target.y, H) }
    : aiState.target;

  // R-4: ally の Y 軸反転に伴い sidePreference の左右も反転
  // S6-3e: teamRole による aggressiveness 調整
  const effectiveConfig = applyTeamAndSideAdjustments(config, isPlayerTeam);

  const tempGame = {
    ...game,
    pucks: effectivePucks,
    cpu: effectiveMallet,
    cpuTarget: effectiveTarget,
    cpuTargetTime: aiState.targetTime,
    cpuStuckTimer: aiState.stuckTimer,
  };
  const result = updateFn(tempGame, effectiveConfig, now, consts, scoreDiff);
  if (!result) return undefined;

  // ally の場合、結果を Y 軸再反転して戻す
  const finalMallet = isPlayerTeam
    ? { ...result.cpu, y: flipY(result.cpu.y, H), vy: -result.cpu.vy }
    : result.cpu;
  const finalTarget = isPlayerTeam && result.cpuTarget
    ? { ...result.cpuTarget, y: flipY(result.cpuTarget.y, H) }
    : result.cpuTarget;

  // ゾーン制約で安全性を確保
  const slot = isPlayerTeam ? 'player2' : 'player4';
  const zone = getPlayerZone(slot, consts);
  finalMallet.x = clamp(finalMallet.x, zone.minX, zone.maxX);
  finalMallet.y = clamp(finalMallet.y, zone.minY, zone.maxY);

  return {
    mallet: finalMallet,
    aiState: {
      target: finalTarget,
      targetTime: result.cpuTargetTime,
      stuckTimer: result.cpuStuckTimer,
    },
  };
}
