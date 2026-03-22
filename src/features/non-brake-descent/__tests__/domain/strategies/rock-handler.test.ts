import { rockHandler } from '../../../domain/strategies/collision/rock-handler';
import { CollisionContext } from '../../../domain/strategies/collision/collision-handler';
import { SpeedRank } from '../../../constants';
import { Obstacle } from '../../../types';

/** テスト用のデフォルトコンテキストを生成する */
const createContext = (overrides: Partial<CollisionContext> = {}): CollisionContext => ({
  collision: { ground: false, air: false, hit: false, nearMiss: false, dist: 100 },
  obstacle: { t: 'rock', pos: 0.5, passed: false } as Obstacle,
  obstacleX: 200,
  playerX: 100,
  speedRank: SpeedRank.MID,
  isGodMode: false,
  ...overrides,
});

describe('rockHandler', () => {
  describe('正常系', () => {
    it('衝突した場合に死亡する', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
      });

      // Act
      const result = rockHandler.handle(context);

      // Assert
      expect(result.dead).toBe(true);
      expect(result.events).toContainEqual({ type: 'PLAYER_DIED', deathType: 'rock' });
    });

    it('衝突していない場合に何も起こらない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: false, air: false, hit: false, nearMiss: false, dist: 100 },
      });

      // Act
      const result = rockHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.events).toHaveLength(0);
    });

    it('空中で衝突した場合も死亡する', () => {
      // Arrange
      const context = createContext({
        collision: { ground: false, air: true, hit: true, nearMiss: false, dist: 10 },
      });

      // Act
      const result = rockHandler.handle(context);

      // Assert
      expect(result.dead).toBe(true);
    });
  });

  describe('神モード', () => {
    it('神モードでは衝突しても死亡しない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        isGodMode: true,
      });

      // Act
      const result = rockHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
    });
  });
});
