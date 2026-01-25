import { CONSTANTS } from './constants';
import { GameState, Difficulty, Vector } from './types';
import { clamp, randomRange, distance } from '../../../utils/math-utils';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;

/**
 * CpuAI.update の戻り値型
 */
export type CpuUpdateResult = Pick<GameState, 'cpu' | 'cpuTarget' | 'cpuTargetTime'>;

export const CpuAI = {
  calculateTarget(game: GameState, difficulty: Difficulty, now: number): Vector {
    const { cpu, pucks, cpuTarget, cpuTargetTime } = game;
    const puck = pucks[0];
    if (cpu.x < 50 || cpu.x > W - 50) return { x: W / 2, y: 80 };
    if (puck && puck.vy < 0 && puck.y < H / 2 + 50) {
      const predictionFactor = difficulty === 'hard' ? 8 : difficulty === 'normal' ? 4 : 1;
      return { x: puck.x + puck.vx * predictionFactor, y: Math.min(puck.y - 10, H / 2 - 60) };
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
  update(game: GameState, difficulty: Difficulty, now: number): CpuUpdateResult | null {
    let cpuTarget = game.cpuTarget;
    let cpuTargetTime = game.cpuTargetTime;

    // ターゲット状態の同期ロジック
    if (!cpuTarget || now - cpuTargetTime > 2000) {
      const target = this.calculateTarget(game, difficulty, now);
      if (target !== cpuTarget) {
        cpuTarget = target;
        cpuTargetTime = now;
      }
    }

    let target = cpuTarget!;
    // インターセプトロジックの再検証
    const immediateTarget = this.calculateTarget(game, difficulty, now);
    if (!cpuTarget || (immediateTarget.y !== cpuTarget.y && immediateTarget.x !== cpuTarget.x)) {
      target = immediateTarget;
    }

    if (difficulty === 'easy') {
      target = {
        x: target.x * 0.3 + (W / 2) * 0.7,
        y: target.y,
      };
      if (Math.random() < 0.03) return null; // スキップ
    }

    const clampedTargetX = clamp(target.x, 60, W - 60);
    const clampedTargetY = clamp(target.y, 50, H / 2 - 50);
    const dx = clampedTargetX - game.cpu.x;
    const dy = clampedTargetY - game.cpu.y;
    const dist = distance(0, 0, dx, dy);

    let newVx: number;
    let newVy: number;
    if (dist > 3) {
      const speed = Math.min(dist * 0.08, CONSTANTS.CPU[difficulty]);
      newVx = (dx / dist) * speed;
      newVy = (dy / dist) * speed;
    } else {
      newVx = 0;
      newVy = 0;
    }

    const newX = clamp(game.cpu.x + newVx, 50, W - 50);
    const newY = clamp(game.cpu.y + newVy, 40, H / 2 - 40);

    return {
      cpu: { ...game.cpu, x: newX, y: newY, vx: newVx, vy: newVy },
      cpuTarget,
      cpuTargetTime,
    };
  },
};
