/**
 * CPU AI ドメインサービス
 * - core/ai.ts のロジックを移行
 * - 乱数生成器を注入可能にして純粋性を確保
 */
import type { GameState, Vector } from '../types';
import type { AiBehaviorConfig } from '../constants/ai-presets';
import { PHYSICS_CONSTANTS } from '../constants/physics';
import { clamp, randomRange, distance } from '../../../../utils/math-utils';

/** AI 計算オプション */
export type CpuAIOptions = {
  canvasWidth?: number;
  canvasHeight?: number;
  random?: () => number;
};

/** 位置制限・マージン定数 */
const AI_POSITION = {
  /** フィールド端判定マージン（px） */
  EDGE_MARGIN: 50,
  /** デフォルト待機Y座標 */
  DEFAULT_Y: 80,
  /** 移動クランプXマージン */
  CLAMP_X_MARGIN: 60,
  /** 移動クランプY上マージン */
  CLAMP_Y_TOP: 50,
  /** 位置クランプマージン（最終位置制限） */
  POSITION_CLAMP_MARGIN: 50,
  /** 位置クランプY下マージン */
  POSITION_CLAMP_Y_BOTTOM: 40,
} as const;

/** パック追跡・攻撃行動定数 */
const AI_BEHAVIOR = {
  /** パック追跡判定のY方向オフセット */
  PUCK_TRACKING_Y_OFFSET: 50,
  /** 攻撃的Y座標の近距離閾値 */
  AGGRESSIVE_NEAR_THRESHOLD: 100,
  /** 攻撃的Y座標の最小predictionFactor */
  AGGRESSIVE_PREDICTION_MIN: 4,
  /** 攻撃的Y座標の近距離オフセット */
  AGGRESSIVE_Y_NEAR_OFFSET: 20,
  /** 攻撃的Y座標の遠距離オフセット */
  AGGRESSIVE_Y_FAR_OFFSET: 10,
  /** 攻撃的Y座標の上限マージン */
  AGGRESSIVE_Y_MARGIN: 60,
  /** 高predictionFactor閾値 */
  HIGH_PREDICTION_THRESHOLD: 10,
  /** 高predictionFactor時の待機Y */
  HIGH_PREDICTION_Y: 60,
  /** 壁バウンス予測マージン */
  WALL_PREDICT_MARGIN: 20,
  /** 壁バウンス予測最大反復回数 */
  WALL_PREDICT_MAX_ITER: 3,
} as const;

/** 移動速度・判定閾値定数 */
const AI_MOVEMENT = {
  /** 速度ゼロ閾値 */
  DISTANCE_THRESHOLD: 3,
  /** 速度の距離比率 */
  SPEED_DISTANCE_RATIO: 0.08,
  /** ほぼ停止判定閾値 */
  BARELY_MOVED_THRESHOLD: 0.5,
} as const;

/** タイミング・アイドル行動定数 */
const AI_TIMING = {
  /** ターゲットリフレッシュ間隔（ms） */
  TARGET_REFRESH_MS: 2000,
  /** スタックタイムアウト（ms） */
  STUCK_TIMEOUT_MS: 2000,
  /** アイドル時ランダム範囲X最小 */
  IDLE_X_MIN: 80,
  /** アイドル時ランダム範囲Y最小 */
  IDLE_Y_MIN: 50,
  /** アイドル時ランダム範囲Y最大 */
  IDLE_Y_MAX: 130,
} as const;

/** 壁バウンス予測 */
const predictWithWallBounce = (x: number, W: number): number => {
  const margin = AI_BEHAVIOR.WALL_PREDICT_MARGIN;
  let px = x;
  for (let i = 0; i < AI_BEHAVIOR.WALL_PREDICT_MAX_ITER; i++) {
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

/** 注入された乱数 or デフォルトの randomRange を使用する */
const randomRangeWith = (min: number, max: number, rng?: () => number): number => {
  if (rng) {
    return min + rng() * (max - min);
  }
  return randomRange(min, max);
};

export type CpuUpdateResult = Pick<GameState, 'cpu' | 'cpuTarget' | 'cpuTargetTime' | 'cpuStuckTimer'>;

export const DomainCpuAI = {
  calculateTargetWithBehavior(
    game: GameState,
    config: AiBehaviorConfig,
    now: number,
    options?: CpuAIOptions
  ): Vector {
    const W = options?.canvasWidth ?? PHYSICS_CONSTANTS.CANVAS_WIDTH;
    const H = options?.canvasHeight ?? PHYSICS_CONSTANTS.CANVAS_HEIGHT;
    const rng = options?.random;
    const { cpu, pucks, cpuTarget, cpuTargetTime } = game;
    const puck = pucks[0];

    if (cpu.x < AI_POSITION.EDGE_MARGIN || cpu.x > W - AI_POSITION.EDGE_MARGIN) {
      return { x: W / 2, y: AI_POSITION.DEFAULT_Y };
    }

    if (puck && puck.vy < 0 && puck.y < H / 2 + AI_BEHAVIOR.PUCK_TRACKING_Y_OFFSET) {
      let predictedX = puck.x + puck.vx * config.predictionFactor;

      if (config.wallBounce) {
        predictedX = predictWithWallBounce(predictedX, W);
      }

      if (config.wobble > 0) {
        predictedX += randomRangeWith(-config.wobble, config.wobble, rng);
      }

      if (config.centerWeight > 0) {
        predictedX = predictedX * (1 - config.centerWeight) + (W / 2) * config.centerWeight;
      }

      const yDist = puck.y - cpu.y;
      const aggressiveY = yDist < AI_BEHAVIOR.AGGRESSIVE_NEAR_THRESHOLD && config.predictionFactor >= AI_BEHAVIOR.AGGRESSIVE_PREDICTION_MIN
        ? Math.min(puck.y + AI_BEHAVIOR.AGGRESSIVE_Y_NEAR_OFFSET, H / 2 - AI_BEHAVIOR.AGGRESSIVE_Y_MARGIN)
        : Math.min(puck.y - AI_BEHAVIOR.AGGRESSIVE_Y_FAR_OFFSET, H / 2 - AI_BEHAVIOR.AGGRESSIVE_Y_MARGIN);

      return { x: predictedX, y: aggressiveY };
    }

    if (config.predictionFactor >= AI_BEHAVIOR.HIGH_PREDICTION_THRESHOLD) {
      return { x: W / 2, y: AI_BEHAVIOR.HIGH_PREDICTION_Y };
    }

    if (!cpuTarget || now - cpuTargetTime > AI_TIMING.TARGET_REFRESH_MS) {
      return {
        x: randomRangeWith(AI_TIMING.IDLE_X_MIN, W - AI_TIMING.IDLE_X_MIN, rng),
        y: randomRangeWith(AI_TIMING.IDLE_Y_MIN, AI_TIMING.IDLE_Y_MAX, rng),
      };
    }
    return game.cpuTarget!;
  },

  updateWithBehavior(
    game: GameState,
    config: AiBehaviorConfig,
    now: number,
    options?: CpuAIOptions
  ): CpuUpdateResult | undefined {
    const W = options?.canvasWidth ?? PHYSICS_CONSTANTS.CANVAS_WIDTH;
    const H = options?.canvasHeight ?? PHYSICS_CONSTANTS.CANVAS_HEIGHT;
    const rng = options?.random;
    const opts: CpuAIOptions = { canvasWidth: W, canvasHeight: H, random: rng };
    let cpuTarget = game.cpuTarget;
    let cpuTargetTime = game.cpuTargetTime;

    if (!cpuTarget || now - cpuTargetTime > AI_TIMING.TARGET_REFRESH_MS) {
      const target = this.calculateTargetWithBehavior(game, config, now, opts);
      if (target !== cpuTarget) {
        cpuTarget = target;
        cpuTargetTime = now;
      }
    }

    let target = cpuTarget!;
    const immediateTarget = this.calculateTargetWithBehavior(game, config, now, opts);
    if (!cpuTarget || (immediateTarget.y !== cpuTarget.y && immediateTarget.x !== cpuTarget.x)) {
      target = immediateTarget;
    }

    if (config.skipRate > 0 && (rng ?? Math.random)() < config.skipRate) {
      return undefined;
    }

    const clampedTargetX = clamp(target.x, AI_POSITION.CLAMP_X_MARGIN, W - AI_POSITION.CLAMP_X_MARGIN);
    const clampedTargetY = clamp(target.y, AI_POSITION.CLAMP_Y_TOP, H / 2 - AI_POSITION.CLAMP_Y_TOP);
    const dx = clampedTargetX - game.cpu.x;
    const dy = clampedTargetY - game.cpu.y;
    const d = distance(0, 0, dx, dy);

    let newVx: number;
    let newVy: number;
    if (d > AI_MOVEMENT.DISTANCE_THRESHOLD) {
      const speed = Math.min(d * AI_MOVEMENT.SPEED_DISTANCE_RATIO, config.maxSpeed);
      newVx = (dx / d) * speed;
      newVy = (dy / d) * speed;
    } else {
      newVx = 0;
      newVy = 0;
    }

    let newX = clamp(game.cpu.x + newVx, AI_POSITION.POSITION_CLAMP_MARGIN, W - AI_POSITION.POSITION_CLAMP_MARGIN);
    let newY = clamp(game.cpu.y + newVy, AI_POSITION.POSITION_CLAMP_Y_BOTTOM, H / 2 - AI_POSITION.POSITION_CLAMP_Y_BOTTOM);

    const actualDx = newX - game.cpu.x;
    const actualDy = newY - game.cpu.y;
    const barelyMoved = Math.abs(actualDx) < AI_MOVEMENT.BARELY_MOVED_THRESHOLD && Math.abs(actualDy) < AI_MOVEMENT.BARELY_MOVED_THRESHOLD;

    let cpuStuckTimer = game.cpuStuckTimer;
    if (barelyMoved) {
      if (cpuStuckTimer === 0) {
        cpuStuckTimer = now;
      } else if (now - cpuStuckTimer > AI_TIMING.STUCK_TIMEOUT_MS) {
        newX = W / 2;
        newY = AI_POSITION.DEFAULT_Y;
        cpuTarget = { x: W / 2, y: AI_POSITION.DEFAULT_Y };
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
