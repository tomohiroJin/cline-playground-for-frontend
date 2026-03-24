import { CONSTANTS, GameConstants } from './constants';
import { GameState, Difficulty, Vector } from './types';
import { clamp, randomRange, distance } from '../../../utils/math-utils';
import { AI_BEHAVIOR_PRESETS, AiBehaviorConfig } from './story-balance';
import { DEFAULT_PLAY_STYLE } from './character-ai-profiles';

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

/**
 * スコア差に応じて AI のパラメータを強化する
 * scoreDiff: CPU が負けている点差（0 以上）
 */
const applyAdaptability = (config: AiBehaviorConfig, scoreDiff: number): AiBehaviorConfig => {
  const playStyle = config.playStyle ?? DEFAULT_PLAY_STYLE;
  if (playStyle.adaptability <= 0 || scoreDiff <= 0) return config;

  // boost: 0（差なし）〜 adaptability（3点差以上）
  const boost = playStyle.adaptability * Math.min(scoreDiff, 3) / 3;
  return {
    ...config,
    maxSpeed: config.maxSpeed * (1 + boost * 0.2),                          // 最大 +20%
    predictionFactor: config.predictionFactor * (1 + boost * 0.3),          // 最大 +30%
    wobble: config.wobble * Math.max(0.5, 1 - boost * 0.5),                 // 最大 -50%
  };
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
    const playStyle = config.playStyle ?? DEFAULT_PLAY_STYLE;

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

      // 揺さぶり: lateralOscillation > 0 の場合に正弦波オフセットを加算
      if (playStyle.lateralOscillation > 0 && playStyle.lateralPeriod > 0) {
        const oscillation = Math.sin(now * Math.PI * 2 / playStyle.lateralPeriod)
                            * playStyle.lateralOscillation;
        predictedX += oscillation;
      }

      // aggressiveness によるY座標制御（守備的〜攻撃的ポジション）
      const DEFENSIVE_Y = 80;
      const AGGRESSIVE_Y = H / 2 - 100;
      const baseY = DEFENSIVE_Y + (AGGRESSIVE_Y - DEFENSIVE_Y) * playStyle.aggressiveness;
      const targetY = Math.min(puck.y + 20, baseY);

      return { x: predictedX, y: targetY };
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
   * scoreDiff: CPU が負けている点差（オプショナル・後方互換）
   */
  updateWithBehavior(
    game: GameState,
    config: AiBehaviorConfig,
    now: number,
    consts: GameConstants = CONSTANTS,
    scoreDiff?: number
  ): CpuUpdateResult | null {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    // 適応度に基づいてパラメータを動的に調整
    const effectiveConfig = applyAdaptability(config, scoreDiff ?? 0);
    let cpuTarget = game.cpuTarget;
    let cpuTargetTime = game.cpuTargetTime;

    // ターゲット状態の同期ロジック
    if (!cpuTarget || now - cpuTargetTime > 2000) {
      const target = this.calculateTargetWithBehavior(game, effectiveConfig, now, consts);
      if (target !== cpuTarget) {
        cpuTarget = target;
        cpuTargetTime = now;
      }
    }

    let target = cpuTarget!;
    // インターセプトロジックの再検証
    const immediateTarget = this.calculateTargetWithBehavior(game, effectiveConfig, now, consts);
    if (!cpuTarget || (immediateTarget.y !== cpuTarget.y && immediateTarget.x !== cpuTarget.x)) {
      target = immediateTarget;
    }

    // スキップ率
    if (effectiveConfig.skipRate > 0 && Math.random() < effectiveConfig.skipRate) {
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
      const speed = Math.min(dist * 0.08, effectiveConfig.maxSpeed);
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
