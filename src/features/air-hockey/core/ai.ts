import { CONSTANTS } from './constants';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const distance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export const CpuAI = {
  calculateTarget(game: any, difficulty: string, now: number) {
    const { cpu, pucks, cpuTarget, cpuTargetTime } = game;
    const puck = pucks[0];
    if (cpu.x < 50 || cpu.x > W - 50) return { x: W / 2, y: 80 };
    if (puck && puck.vy < 0 && puck.y < H / 2 + 50) {
      // @ts-ignore
      const predictionFactor = difficulty === 'hard' ? 8 : difficulty === 'normal' ? 4 : 1;
      return { x: puck.x + puck.vx * predictionFactor, y: Math.min(puck.y - 10, H / 2 - 60) };
    }
    if (!cpuTarget || now - cpuTargetTime > 2000) {
      const target = { x: randomRange(80, W - 80), y: randomRange(50, 130) };
      // Note: We don't mutate game state here directly in pure calc,
      // but the original code did. We'll return target and let called handle update.
      return target;
    }
    return game.cpuTarget;
  },
  update(game: any, difficulty: string, now: number) {
    // Sync target state logic
    if (!game.cpuTarget || now - game.cpuTargetTime > 2000) {
      const target = this.calculateTarget(game, difficulty, now);
      // Ideally calculateTarget should be pure and we assign result.
      // Original logic had implicit mutation via side effect in 'calculateTarget' when it generated random.
      // Here we explicitly manage it.
      if (target !== game.cpuTarget) {
        game.cpuTarget = target;
        game.cpuTargetTime = now;
      }
    }

    let target = game.cpuTarget;
    // Re-verify intercept logic or others that override random patrol
    const immediateTarget = this.calculateTarget(game, difficulty, now);
    if (immediateTarget.y !== game.cpuTarget.y && immediateTarget.x !== game.cpuTarget.x) {
      // Must be intercepting or returning home
      target = immediateTarget;
    }

    if (difficulty === 'easy') {
      target = { ...target };
      target.x = target.x * 0.3 + (W / 2) * 0.7;
      if (Math.random() < 0.03) return;
    }
    target.x = clamp(target.x, 60, W - 60);
    target.y = clamp(target.y, 50, H / 2 - 50);
    const dx = target.x - game.cpu.x;
    const dy = target.y - game.cpu.y;
    const dist = distance(0, 0, dx, dy);
    if (dist > 3) {
      // @ts-ignore
      const speed = Math.min(dist * 0.08, CONSTANTS.CPU[difficulty]);
      game.cpu.vx = (dx / dist) * speed;
      game.cpu.vy = (dy / dist) * speed;
    } else {
      game.cpu.vx = game.cpu.vy = 0;
    }
    game.cpu.x = clamp(game.cpu.x + game.cpu.vx, 50, W - 50);
    game.cpu.y = clamp(game.cpu.y + game.cpu.vy, 40, H / 2 - 40);
  },
};
