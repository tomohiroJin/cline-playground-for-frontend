import { holeSmallHandler, holeLargeHandler } from '../../../domain/strategies/collision/hole-handler';
import { CollisionContext } from '../../../domain/strategies/collision/collision-handler';
import { SpeedRank } from '../../../constants';
import { Obstacle } from '../../../types';

/** テスト用のデフォルトコンテキストを生成する */
const createContext = (overrides: Partial<CollisionContext> = {}): CollisionContext => ({
  collision: { ground: false, air: false, hit: false, nearMiss: false, dist: 100 },
  obstacle: { t: 'holeS', pos: 0.5, passed: false } as Obstacle,
  obstacleX: 200,
  playerX: 100,
  speedRank: SpeedRank.LOW,
  isGodMode: false,
  ...overrides,
});

describe('holeSmallHandler', () => {
  describe('正常系', () => {
    it('LOW ランクで地上衝突の場合に死亡する', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.LOW,
      });

      // Act
      const result = holeSmallHandler.handle(context);

      // Assert
      expect(result.dead).toBe(true);
      expect(result.events).toContainEqual({ type: 'PLAYER_DIED', deathType: 'fall' });
    });

    it('MID ランクで地上衝突の場合に死亡しない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.MID,
      });

      // Act
      const result = holeSmallHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.events).toHaveLength(0);
    });

    it('HIGH ランクで地上衝突の場合に死亡しない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.HIGH,
      });

      // Act
      const result = holeSmallHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
    });

    it('ジャンプ中（地上でない）の場合に死亡しない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: false, air: true, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.LOW,
      });

      // Act
      const result = holeSmallHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
    });
  });

  describe('神モード', () => {
    it('神モードでは LOW ランクで地上衝突でも死亡しない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.LOW,
        isGodMode: true,
      });

      // Act
      const result = holeSmallHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
    });
  });
});

describe('holeLargeHandler', () => {
  describe('正常系', () => {
    it('地上衝突の場合にランクに関係なく死亡する', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.HIGH,
      });

      // Act
      const result = holeLargeHandler.handle(context);

      // Assert
      expect(result.dead).toBe(true);
      expect(result.events).toContainEqual({ type: 'PLAYER_DIED', deathType: 'fall' });
    });

    it('ジャンプ中の場合に死亡しない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: false, air: true, hit: true, nearMiss: false, dist: 10 },
      });

      // Act
      const result = holeLargeHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
    });
  });

  describe('神モード', () => {
    it('神モードでは地上衝突でも死亡しない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        isGodMode: true,
      });

      // Act
      const result = holeLargeHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
    });
  });
});
