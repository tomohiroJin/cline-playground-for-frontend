import { getConstants, GameConstants } from './constants';
import { GameState, Difficulty, Vector } from './types';
import { clamp, randomRange, distance } from '../../../utils/math-utils';

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
  calculateTarget(
    game: GameState,
    difficulty: Difficulty,
    now: number,
    consts: GameConstants = getConstants()
  ): Vector {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const { cpu, pucks, cpuTarget, cpuTargetTime } = game;
    const puck = pucks[0];

    if (cpu.x < 50 || cpu.x > W - 50) return { x: W / 2, y: 80 };

    if (puck && puck.vy < 0 && puck.y < H / 2 + 50) {
      if (difficulty === 'hard') {
        // Hard: 高精度予測 + 壁バウンス予測
        const predictionFactor = 12;
        const predictedX = predictWithWallBounce(puck.x + puck.vx * predictionFactor, W);
        return { x: predictedX, y: Math.min(puck.y - 10, H / 2 - 60) };
      } else if (difficulty === 'normal') {
        // Normal: 中程度の予測 + パックが近い時にアグレッシブ
        const predictionFactor = 6;
        const yDist = puck.y - cpu.y;
        const aggressiveY = yDist < 100 ? Math.min(puck.y + 20, H / 2 - 60) : Math.min(puck.y - 10, H / 2 - 60);
        return { x: puck.x + puck.vx * predictionFactor, y: aggressiveY };
      } else {
        // Easy: 低精度予測 + ウォブル
        const predictionFactor = 1;
        const wobble = randomRange(-30, 30);
        return { x: puck.x + puck.vx * predictionFactor + wobble, y: Math.min(puck.y - 10, H / 2 - 60) };
      }
    }

    // Hard: パックが来ていない時はゴール中央に戻る
    if (difficulty === 'hard') {
      return { x: W / 2, y: 60 };
    }

    if (!cpuTarget || now - cpuTargetTime > 2000) {
      const target = { x: randomRange(80, W - 80), y: randomRange(50, 130) };
      return target;
    }
    return game.cpuTarget!;
  },

  /**
   * CPUの状態を更新（不変更新）
   * @returns 更新された状態を含むPartial<GameState>、またはスキップ時はnull
   */
  update(
    game: GameState,
    difficulty: Difficulty,
    now: number,
    consts: GameConstants = getConstants()
  ): CpuUpdateResult | null {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    let cpuTarget = game.cpuTarget;
    let cpuTargetTime = game.cpuTargetTime;

    // ターゲット状態の同期ロジック
    if (!cpuTarget || now - cpuTargetTime > 2000) {
      const target = this.calculateTarget(game, difficulty, now, consts);
      if (target !== cpuTarget) {
        cpuTarget = target;
        cpuTargetTime = now;
      }
    }

    let target = cpuTarget!;
    // インターセプトロジックの再検証
    const immediateTarget = this.calculateTarget(game, difficulty, now, consts);
    if (!cpuTarget || (immediateTarget.y !== cpuTarget.y && immediateTarget.x !== cpuTarget.x)) {
      target = immediateTarget;
    }

    if (difficulty === 'easy') {
      target = {
        x: target.x * 0.3 + (W / 2) * 0.7,
        y: target.y,
      };
      // Easy: スキップ率 5%
      if (Math.random() < 0.05) return null;
    }

    const clampedTargetX = clamp(target.x, 60, W - 60);
    const clampedTargetY = clamp(target.y, 50, H / 2 - 50);
    const dx = clampedTargetX - game.cpu.x;
    const dy = clampedTargetY - game.cpu.y;
    const dist = distance(0, 0, dx, dy);

    let newVx: number;
    let newVy: number;
    if (dist > 3) {
      const speed = Math.min(dist * 0.08, consts.CPU[difficulty]);
      newVx = (dx / dist) * speed;
      newVy = (dy / dist) * speed;
    } else {
      newVx = 0;
      newVy = 0;
    }

    let newX = clamp(game.cpu.x + newVx, 50, W - 50);
    let newY = clamp(game.cpu.y + newVy, 40, H / 2 - 40);

    // スタック検出: 実際の移動量が極小なら停滞とみなす
    const actualDx = newX - game.cpu.x;
    const actualDy = newY - game.cpu.y;
    const barelyMoved = Math.abs(actualDx) < 0.5 && Math.abs(actualDy) < 0.5;

    let cpuStuckTimer = game.cpuStuckTimer;
    if (barelyMoved) {
      // スタック開始/継続
      if (cpuStuckTimer === 0) {
        cpuStuckTimer = now;
      } else if (now - cpuStuckTimer > 2000) {
        // 2秒以上スタック → 中央にリセット
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
