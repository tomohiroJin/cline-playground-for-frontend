// 入力処理（Command パターン）

import type { Player } from '../domain/player/types';
import type { Point } from '../domain/shared/types';
import type { CpuStrategy } from '../domain/player/cpu-strategy';
import type { InputState } from './ports/input-port';
import { PLAYER, DRIFT } from '../domain/player/constants';
import { getCardMultiplier } from '../domain/card/card-effect';

/** プレイヤー入力コマンド */
export interface PlayerCommand {
  readonly turnRate: number;
  readonly handbrake: boolean;
  readonly steering: number;
}

/** 入力をコマンドに変換 */
export const processInput = (
  player: Player,
  inputState: InputState,
  cpuStrategy: CpuStrategy | null,
  trackPoints: readonly Point[],
  trackWidth: number,
): PlayerCommand => {
  let steering = 0;
  let handbrake = false;

  if (player.isCpu && cpuStrategy) {
    // CPU プレイヤー: Strategy パターンで計算
    steering = cpuStrategy.calculateTurn(player, trackPoints, trackWidth);
    handbrake = cpuStrategy.shouldDrift(player, trackPoints, trackWidth);
  } else {
    // 人間プレイヤー: 入力状態から変換
    if (inputState.left) steering = -PLAYER.TURN_RATE;
    if (inputState.right) steering = PLAYER.TURN_RATE;
    handbrake = inputState.handbrake;
  }

  // カード効果: 旋回速度倍率
  const turnMul = getCardMultiplier(player.activeCards, 'turnMultiplier');

  // ドリフト中は旋回速度を増幅
  const turnRate = player.drift.active && steering !== 0
    ? Math.sign(steering) * (PLAYER.TURN_RATE * DRIFT.ANGLE_MULTIPLIER * turnMul)
    : steering * turnMul;

  return { turnRate, handbrake, steering };
};
