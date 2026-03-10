import { CONSTANTS, GameConstants } from './constants';
import { GameState, Difficulty, Vector } from './types';
import { clamp, randomRange, distance } from '../../../utils/math-utils';
import { AI_BEHAVIOR_PRESETS, AiBehaviorConfig } from './story-balance';

/**
 * CpuAI.update の戻り値型
 */
export type CpuUpdateResult = Pick<GameState, 'cpu' | 'cpuTarget' | 'cpuTargetTime' | 'cpuStuckTimer'>;

/**
 * 壁バウンス予測: 予測X座標が壁を超える場合に反射をシミュレート
 */
const predictWithWallBounce = (x: number, W: number): number => {
  const margin = 20;
  let px = x;
  // 壁反射を最大3回までシミュレート
  for (let i = 0; i < 3; i++) {
    if (px < margin) {
      px = margin + (margin - px);
    } else if (px > W - margin) {
      px = (W - margin) - (px - (W - margin));
    } else {
      break;
    }
  }
  return clamp(px, margin, W - margin);
};

export const CpuAI = {
  /**
   * AiBehaviorConfig ベースのターゲット計算
   */
  calculateTargetWithBehavior(
    game: GameState,
    config: AiBehaviorConfig,
    now: number,
    consts: GameConstants = CONSTANTS
  ): Vector {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const { cpu, pucks, cpuTarget, cpuTargetTime } = game;
    const puck = pucks[0];

    // 範囲外ならホームポジションに戻る
    if (cpu.x < 50 || cpu.x > W - 50) return { x: W / 2, y: 80 };

    // パックが CPU 側に向かっている場合
    if (puck && puck.vy < 0 && puck.y < H / 2 + 50) {
      let predictedX = puck.x + puck.vx * config.predictionFactor;

      // 壁バウンス予測
      if (config.wallBounce) {
        predictedX = predictWithWallBounce(predictedX, W);
      }

      // ウォブル（ブレ）
      if (config.wobble > 0) {
        predictedX += randomRange(-config.wobble, config.wobble);
      }

      // centerWeight: ターゲットを中央に寄せる
      if (config.centerWeight > 0) {
        predictedX = predictedX * (1 - config.centerWeight) + (W / 2) * config.centerWeight;
      }

      // アグレッシブ Y: 予測精度が高いほどパックに近づく
      const yDist = puck.y - cpu.y;
      const aggressiveY = yDist < 100 && config.predictionFactor >= 4
        ? Math.min(puck.y + 20, H / 2 - 60)
        : Math.min(puck.y - 10, H / 2 - 60);

      return { x: predictedX, y: aggressiveY };
    }

    // パックが来ていない時: 高精度 AI はゴール中央に戻る
    if (config.predictionFactor >= 10) {
      return { x: W / 2, y: 60 };
    }

    if (!cpuTarget || now - cpuTargetTime > 2000) {
      return { x: randomRange(80, W - 80), y: randomRange(50, 130) };
    }
    return game.cpuTarget!;
  },

  /**
   * AiBehaviorConfig ベースの CPU 更新
   */
  updateWithBehavior(
    game: GameState,
    config: AiBehaviorConfig,
    now: number,
    consts: GameConstants = CONSTANTS
  ): CpuUpdateResult | null {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    let cpuTarget = game.cpuTarget;
    let cpuTargetTime = game.cpuTargetTime;

    // ターゲット状態の同期ロジック
    if (!cpuTarget || now - cpuTargetTime > 2000) {
      const target = this.calculateTargetWithBehavior(game, config, now, consts);
      if (target !== cpuTarget) {
        cpuTarget = target;
        cpuTargetTime = now;
      }
    }

    let target = cpuTarget!;
    // インターセプトロジックの再検証
    const immediateTarget = this.calculateTargetWithBehavior(game, config, now, consts);
    if (!cpuTarget || (immediateTarget.y !== cpuTarget.y && immediateTarget.x !== cpuTarget.x)) {
      target = immediateTarget;
    }

    // スキップ率
    if (config.skipRate > 0 && Math.random() < config.skipRate) {
      return null;
    }

    const clampedTargetX = clamp(target.x, 60, W - 60);
    const clampedTargetY = clamp(target.y, 50, H / 2 - 50);
    const dx = clampedTargetX - game.cpu.x;
    const dy = clampedTargetY - game.cpu.y;
    const dist = distance(0, 0, dx, dy);

    let newVx: number;
    let newVy: number;
    if (dist > 3) {
      const speed = Math.min(dist * 0.08, config.maxSpeed);
      newVx = (dx / dist) * speed;
      newVy = (dy / dist) * speed;
    } else {
      newVx = 0;
      newVy = 0;
    }

    let newX = clamp(game.cpu.x + newVx, 50, W - 50);
    let newY = clamp(game.cpu.y + newVy, 40, H / 2 - 40);

    // スタック検出
    const actualDx = newX - game.cpu.x;
    const actualDy = newY - game.cpu.y;
    const barelyMoved = Math.abs(actualDx) < 0.5 && Math.abs(actualDy) < 0.5;

    let cpuStuckTimer = game.cpuStuckTimer;
    if (barelyMoved) {
      if (cpuStuckTimer === 0) {
        cpuStuckTimer = now;
      } else if (now - cpuStuckTimer > 2000) {
        newX = W / 2;
        newY = 80;
        cpuTarget = { x: W / 2, y: 80 };
        cpuTargetTime = now;
        cpuStuckTimer = 0;
      }
    } else {
      cpuStuckTimer = 0;
    }

    return {
      cpu: { ...game.cpu, x: newX, y: newY, vx: newVx, vy: newVy },
      cpuTarget,
      cpuTargetTime,
      cpuStuckTimer,
    };
  },

  /**
   * Difficulty 文字列ベースのターゲット計算（後方互換）
   */
  calculateTarget(
    game: GameState,
    difficulty: Difficulty,
    now: number,
    consts: GameConstants = CONSTANTS
  ): Vector {
    return this.calculateTargetWithBehavior(game, AI_BEHAVIOR_PRESETS[difficulty], now, consts);
  },

  /**
   * Difficulty 文字列ベースの CPU 更新（後方互換）
   */
  update(
    game: GameState,
    difficulty: Difficulty,
    now: number,
    consts: GameConstants = CONSTANTS
  ): CpuUpdateResult | null {
    return this.updateWithBehavior(game, AI_BEHAVIOR_PRESETS[difficulty], now, consts);
  },
};
