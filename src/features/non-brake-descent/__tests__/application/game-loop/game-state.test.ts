/**
 * GameState 型定義とファクトリ関数のテスト
 */
import { createInitialGameWorld, createInitialUIState } from '../../../application/game-loop/game-state';
import { buildPlayer } from '../../helpers/test-factories';

describe('game-state', () => {
  describe('createInitialGameWorld', () => {
    it('デフォルト値で GameWorld を生成する', () => {
      // Arrange
      const player = buildPlayer();
      const ramps = [{ dir: 1 as const, obs: [], type: 'normal' as const, isGoal: false }];

      // Act
      const world = createInitialGameWorld(player, ramps);

      // Assert
      expect(world.player).toEqual(player);
      expect(world.ramps).toEqual(ramps);
      expect(world.speed).toBe(0);
      expect(world.camY).toBe(0);
      expect(world.score).toBe(0);
      expect(world.speedBonus).toBe(0);
      expect(world.combo).toEqual({ count: 0, timer: 0 });
      expect(world.effect).toEqual({ type: undefined, timer: 0 });
      expect(world.lastRamp).toBe(0);
      expect(world.nearMissCount).toBe(0);
      expect(world.dangerLevel).toBe(0);
    });
  });

  describe('createInitialUIState', () => {
    it('空の UI 状態を生成する', () => {
      // Act
      const ui = createInitialUIState();

      // Assert
      expect(ui.particles).toEqual([]);
      expect(ui.jetParticles).toEqual([]);
      expect(ui.scorePopups).toEqual([]);
      expect(ui.nearMissEffects).toEqual([]);
      expect(ui.clouds).toEqual([]);
      expect(ui.shake).toBe(0);
      expect(ui.transitionEffect).toBe(0);
    });

    it('初期雲を指定して UI 状態を生成する', () => {
      // Arrange
      const clouds = [
        { x: 100, y: 50, size: 40, speed: 0.5, opacity: 0.2 },
      ];

      // Act
      const ui = createInitialUIState(clouds);

      // Assert
      expect(ui.clouds).toEqual(clouds);
    });
  });
});
