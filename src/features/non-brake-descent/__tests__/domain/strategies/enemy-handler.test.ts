import { enemyHandler } from '../../../domain/strategies/collision/enemy-handler';
import { CollisionContext } from '../../../domain/strategies/collision/collision-handler';
import { Config } from '../../../config';
import { ObstacleType, SpeedRank } from '../../../constants';
import { Obstacle } from '../../../types';

/** テスト用のデフォルトコンテキストを生成する */
const createContext = (overrides: Partial<CollisionContext> = {}): CollisionContext => ({
  collision: { ground: false, air: false, hit: false, nearMiss: false, dist: 100 },
  obstacle: { t: 'enemy', pos: 0.5, passed: false } as Obstacle,
  obstacleX: 200,
  playerX: 100,
  speedRank: SpeedRank.MID,
  isGodMode: false,
  ...overrides,
});

describe('enemyHandler', () => {
  describe('正常系', () => {
    it('衝突していない場合に何も起こらない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: false, air: false, hit: false, nearMiss: false, dist: 100 },
      });

      // Act
      const result = enemyHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.slowDown).toBe(false);
      expect(result.events).toHaveLength(0);
    });
  });

  describe('速度ランク別の挙動', () => {
    it('HIGH ランクで衝突した場合に死亡する', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.HIGH,
      });

      // Act
      const result = enemyHandler.handle(context);

      // Assert
      expect(result.dead).toBe(true);
      expect(result.events).toContainEqual({ type: 'PLAYER_DIED', deathType: 'enemy' });
    });

    it('MID ランクで衝突した場合に敵を倒して減速する', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.MID,
      });

      // Act
      const result = enemyHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.slowDown).toBe(true);
      expect(result.obstacleUpdate).toBe(ObstacleType.DEAD);
      expect(result.events).toContainEqual({
        type: 'ENEMY_KILLED',
        position: { x: 200, y: 0 },
      });
    });

    it('LOW ランクで衝突した場合にバウンドする（プレイヤーが左側）', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.LOW,
        playerX: 100,
        obstacleX: 200,
      });

      // Act
      const result = enemyHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.slowDown).toBe(false);
      expect(result.events).toContainEqual({
        type: 'PLAYER_BOUNCED',
        velocity: -Config.combat.bounceSpeed,
      });
    });

    it('LOW ランクで衝突した場合にバウンドする（プレイヤーが右側）', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.LOW,
        playerX: 200,
        obstacleX: 100,
      });

      // Act
      const result = enemyHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.events).toContainEqual({
        type: 'PLAYER_BOUNCED',
        velocity: Config.combat.bounceSpeed,
      });
    });
  });

  describe('神モード', () => {
    it('HIGH ランクでも神モードでは死亡しない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.HIGH,
        isGodMode: true,
      });

      // Act
      const result = enemyHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
    });

    it('MID ランクでは神モードでも敵を倒せる（減速する）', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.MID,
        isGodMode: true,
      });

      // Act
      const result = enemyHandler.handle(context);

      // Assert
      expect(result.slowDown).toBe(true);
      expect(result.obstacleUpdate).toBe(ObstacleType.DEAD);
    });

    it('LOW ランクでは神モードではバウンドしない', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        speedRank: SpeedRank.LOW,
        isGodMode: true,
      });

      // Act
      const result = enemyHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.events).toHaveLength(0);
    });
  });
});
