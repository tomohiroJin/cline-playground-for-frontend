import { CpuAI } from './ai';
import { EntityFactory } from './entities';

describe('CpuAI Module', () => {
  it('should target puck when threatening goal', () => {
    const game = EntityFactory.createGameState();
    // Move puck to threatening position
    game.pucks[0].y = 200; // Upper half
    game.pucks[0].vy = -5; // Moving up
    game.pucks[0].x = 100;
    game.pucks[0].vx = 0;

    const diff = 'normal';
    const now = 1000;

    // Calculate once to set target
    CpuAI.update(game, diff, now);

    // Expect target to be predicted puck position
    expect(game.cpuTarget).not.toBeNull();
    // Prediction logic: x + vx * factor. Factor is 4 for normal.
    // 100 + 0 * 4 = 100.
    expect(game.cpuTarget?.x).toBe(100);
  });

  it('should return to home position if out of bounds', () => {
    const game = EntityFactory.createGameState();
    game.cpu.x = 10; // Out of bounds (< 50)

    CpuAI.update(game, 'normal', 1000);

    // Logic forces return to center-ish
    // If calculateTarget returns center, update will move towards it.
    // We can't check specific position easily after one frame, but we can verify calculateTarget logic.
    const target = CpuAI.calculateTarget(game, 'normal', 1000);
    expect(target.x).toBe(150); // W/2
    expect(target.y).toBe(80);
  });
});
