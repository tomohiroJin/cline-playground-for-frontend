/**
 * 敵AIの幾何計算・検知判定
 *
 * 座標計算（方向ステップ・距離）とプレイヤー検知・追跡継続判定を提供する。
 * 純粋関数のみ（マップ衝突や乱数には依存しない）。
 */
import { Enemy, Position } from '../../types';
import { GAME_BALANCE } from '../../config/gameBalance';
import { manhattanDistance as getManhattanDistance } from '../../services/geometryService';

/** AI の検知・追跡・攻撃に関する時間定数 */
export const AI_CONFIG = {
  updateInterval: GAME_BALANCE.enemyAi.updateIntervalMs,
  chaseTimeout: GAME_BALANCE.enemyAi.chaseTimeoutMs,
  attackCooldown: GAME_BALANCE.enemyAi.attackCooldownMs,
} as const;

// 4消費者（attackState/enemyMovement/chargeBehavior/rangedBehavior）が依存するため再公開
export { getManhattanDistance };

/**
 * 2点間の各軸の単位ステップ（-1 / 0 / +1）を返す。
 * 座標は整数のため Math.sign は従来の `d>0?1:-1`（0→0）と挙動が一致する。
 */
export const calculateStep = (
  from: Position,
  to: Position
): { stepX: number; stepY: number } => ({
  stepX: Math.sign(to.x - from.x),
  stepY: Math.sign(to.y - from.y),
});

/** プレイヤーが検知範囲内か */
export const detectPlayer = (enemy: Enemy, player: Position): boolean =>
  getManhattanDistance(enemy, player) <= enemy.detectionRange;

/** 追跡を開始すべきか */
export const shouldChase = (enemy: Enemy, player: Position): boolean => {
  if (!detectPlayer(enemy, player)) return false;
  if (enemy.chaseRange === undefined) return true;
  return getManhattanDistance(enemy, player) <= enemy.chaseRange;
};

/** 追跡を中断すべきか */
export const shouldStopChase = (enemy: Enemy, player: Position, currentTime: number): boolean => {
  if (enemy.chaseRange !== undefined && getManhattanDistance(enemy, player) > enemy.chaseRange) {
    return true;
  }
  if (enemy.lastSeenAt !== undefined && currentTime - enemy.lastSeenAt > AI_CONFIG.chaseTimeout) {
    return true;
  }
  return false;
};

/** プレイヤーと反対方向の隣接マス（逃走方向） */
export const calculateFleeDirection = (enemy: Enemy, player: Position): Position => {
  const { stepX, stepY } = calculateStep(player, enemy);
  return { x: enemy.x + stepX, y: enemy.y + stepY };
};

/** 敵からプレイヤーへの直線パス（L字: 先に横、次に縦） */
export const getDirectPathToPlayer = (enemy: Enemy, player: Position): Position[] => {
  const { stepX, stepY } = calculateStep(enemy, player);
  const path: Position[] = [];
  let currentX = enemy.x;
  let currentY = enemy.y;
  while (currentX !== player.x) {
    currentX += stepX;
    path.push({ x: currentX, y: currentY });
  }
  while (currentY !== player.y) {
    currentY += stepY;
    path.push({ x: currentX, y: currentY });
  }
  return path;
};
