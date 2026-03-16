/**
 * リジェネ処理ユースケース
 * 時間経過に応じたHP自動回復を管理
 */
import { Player } from '../../types';
import { GAME_BALANCE } from '../../domain/config/gameBalance';

/** リジェネ関連の定数 */
export const REGEN_CONFIG = {
  /** 基本回復間隔（12秒） */
  BASE_INTERVAL: GAME_BALANCE.regen.baseIntervalMs,
  /** healBonus 1ポイントあたりの短縮量（1秒） */
  REDUCTION_PER_BONUS: GAME_BALANCE.regen.reductionPerBonus,
  /** 最短回復間隔（5秒） */
  MIN_INTERVAL: GAME_BALANCE.regen.minIntervalMs,
  /** 回復量（固定1HP） */
  AMOUNT: GAME_BALANCE.regen.baseHealAmount,
} as const;

/**
 * リジェネ処理を実行する
 * healBonus により回復間隔が短縮される（最短5秒）
 */
export function resolveRegen(player: Player, currentTime: number): Player {
  const regenInterval = Math.max(
    REGEN_CONFIG.MIN_INTERVAL,
    REGEN_CONFIG.BASE_INTERVAL - player.stats.healBonus * REGEN_CONFIG.REDUCTION_PER_BONUS
  );

  if (
    currentTime - player.lastRegenAt >= regenInterval &&
    player.hp < player.maxHp &&
    player.hp > 0
  ) {
    return {
      ...player,
      hp: Math.min(player.hp + REGEN_CONFIG.AMOUNT, player.maxHp),
      lastRegenAt: currentTime,
    };
  }

  return player;
}
