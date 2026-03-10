import { CpuAI } from './ai';
import { EntityFactory } from './entities';
import { CONSTANTS } from './constants';

const { WIDTH: W } = CONSTANTS.CANVAS;

describe('CpuAI Module', () => {
  it('should target puck when threatening goal', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;
    game.pucks[0].x = 100;
    game.pucks[0].vx = 0;

    const diff = 'normal';
    const now = 1000;

    const result = CpuAI.update(game, diff, now);

    expect(result).not.toBeNull();
    expect(result?.cpuTarget).not.toBeNull();
    expect(result?.cpuTarget?.x).toBe(100);
  });

  it('should return to home position if out of bounds', () => {
    const game = EntityFactory.createGameState();
    game.cpu.x = 10;

    const result = CpuAI.update(game, 'normal', 1000);

    expect(result).not.toBeNull();
    const target = CpuAI.calculateTarget(game, 'normal', 1000);
    expect(target.x).toBe(W / 2);
    expect(target.y).toBe(80);
  });

  describe('スタック検出', () => {
    it('移動量が極小だとcpuStuckTimerが記録される', () => {
      const game = EntityFactory.createGameState();
      game.cpu.x = 120;
      game.cpu.y = 90;
      game.cpu.vx = 0;
      game.cpu.vy = 0;
      game.cpuTarget = { x: 120, y: 90 };
      game.cpuTargetTime = 950;
      game.cpuStuckTimer = 0;
      game.pucks[0].x = 150;
      game.pucks[0].y = 400;
      game.pucks[0].vy = 2;
      game.pucks[0].vx = 0;

      const result = CpuAI.update(game, 'normal', 1000);
      expect(result).not.toBeNull();
      expect(result!.cpuStuckTimer).toBe(1000);
    });

    it('2秒以上スタック後に中央にリセットされる', () => {
      const game = EntityFactory.createGameState();
      game.cpu.x = 120;
      game.cpu.y = 90;
      game.cpu.vx = 0;
      game.cpu.vy = 0;
      game.cpuTarget = { x: 120, y: 90 };
      game.cpuTargetTime = 3050;
      game.cpuStuckTimer = 1000;
      game.pucks[0].x = 150;
      game.pucks[0].y = 400;
      game.pucks[0].vy = 2;
      game.pucks[0].vx = 0;

      const result = CpuAI.update(game, 'normal', 3100);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.cpu.x).toBe(W / 2);
        expect(result.cpu.y).toBe(80);
        expect(result.cpuStuckTimer).toBe(0);
      }
    });

    it('移動中はスタックタイマーがリセットされる', () => {
      const game = EntityFactory.createGameState();
      game.cpu.x = 100;
      game.cpu.y = 80;
      game.cpu.vx = 0;
      game.cpu.vy = 0;
      game.cpuStuckTimer = 1000;
      game.pucks[0].x = 200;
      game.pucks[0].y = 200;
      game.pucks[0].vy = -5;
      game.pucks[0].vx = 0;

      const result = CpuAI.update(game, 'normal', 2000);
      expect(result).not.toBeNull();
      expect(result!.cpuStuckTimer).toBe(0);
    });
  });
});
