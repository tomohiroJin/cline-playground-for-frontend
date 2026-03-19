/**
 * CPU AI ドメインサービス
 * - core/ai.ts のロジックを移行
 * - 純粋関数のみ
 */
import type { GameState, Vector } from '../../core/types';
import type { AiBehaviorConfig } from '../constants/ai-presets';
import { PHYSICS_CONSTANTS } from '../constants/physics';
import { clamp, randomRange, distance } from '../../../../utils/math-utils';

/** 壁バウンス予測 */
const predictWithWallBounce = (x: number, W: number): number => {
  const margin = 20;
  let px = x;
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

export type CpuUpdateResult = Pick<GameState, 'cpu' | 'cpuTarget' | 'cpuTargetTime' | 'cpuStuckTimer'>;

export const DomainCpuAI = {
  calculateTargetWithBehavior(
    game: GameState,
    config: AiBehaviorConfig,
    now: number,
    canvasWidth = PHYSICS_CONSTANTS.CANVAS_WIDTH,
    canvasHeight = PHYSICS_CONSTANTS.CANVAS_HEIGHT
  ): Vector {
    const W = canvasWidth;
    const H = canvasHeight;
    const { cpu, pucks, cpuTarget, cpuTargetTime } = game;
    const puck = pucks[0];

    if (cpu.x < 50 || cpu.x > W - 50) return { x: W / 2, y: 80 };

    if (puck && puck.vy < 0 && puck.y < H / 2 + 50) {
      let predictedX = puck.x + puck.vx * config.predictionFactor;

      if (config.wallBounce) {
        predictedX = predictWithWallBounce(predictedX, W);
      }

      if (config.wobble > 0) {
        predictedX += randomRange(-config.wobble, config.wobble);
      }

      if (config.centerWeight > 0) {
        predictedX = predictedX * (1 - config.centerWeight) + (W / 2) * config.centerWeight;
      }

      const yDist = puck.y - cpu.y;
      const aggressiveY = yDist < 100 && config.predictionFactor >= 4
        ? Math.min(puck.y + 20, H / 2 - 60)
        : Math.min(puck.y - 10, H / 2 - 60);

      return { x: predictedX, y: aggressiveY };
    }

    if (config.predictionFactor >= 10) {
      return { x: W / 2, y: 60 };
    }

    if (!cpuTarget || now - cpuTargetTime > 2000) {
      return { x: randomRange(80, W - 80), y: randomRange(50, 130) };
    }
    return game.cpuTarget!;
  },

  updateWithBehavior(
    game: GameState,
    config: AiBehaviorConfig,
    now: number,
    canvasWidth = PHYSICS_CONSTANTS.CANVAS_WIDTH,
    canvasHeight = PHYSICS_CONSTANTS.CANVAS_HEIGHT
  ): CpuUpdateResult | null {
    const W = canvasWidth;
    const H = canvasHeight;
    let cpuTarget = game.cpuTarget;
    let cpuTargetTime = game.cpuTargetTime;

    if (!cpuTarget || now - cpuTargetTime > 2000) {
      const target = this.calculateTargetWithBehavior(game, config, now, W, H);
      if (target !== cpuTarget) {
        cpuTarget = target;
        cpuTargetTime = now;
      }
    }

    let target = cpuTarget!;
    const immediateTarget = this.calculateTargetWithBehavior(game, config, now, W, H);
    if (!cpuTarget || (immediateTarget.y !== cpuTarget.y && immediateTarget.x !== cpuTarget.x)) {
      target = immediateTarget;
    }

    if (config.skipRate > 0 && Math.random() < config.skipRate) {
      return null;
    }

    const clampedTargetX = clamp(target.x, 60, W - 60);
    const clampedTargetY = clamp(target.y, 50, H / 2 - 50);
    const dx = clampedTargetX - game.cpu.x;
    const dy = clampedTargetY - game.cpu.y;
    const d = distance(0, 0, dx, dy);

    let newVx: number;
    let newVy: number;
    if (d > 3) {
      const speed = Math.min(d * 0.08, config.maxSpeed);
      newVx = (dx / d) * speed;
      newVy = (dy / d) * speed;
    } else {
      newVx = 0;
      newVy = 0;
    }

    let newX = clamp(game.cpu.x + newVx, 50, W - 50);
    let newY = clamp(game.cpu.y + newVy, 40, H / 2 - 40);

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
};
