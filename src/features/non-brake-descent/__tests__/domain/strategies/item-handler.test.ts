import {
  scoreItemHandler,
  reverseItemHandler,
  forceJumpItemHandler,
} from '../../../domain/strategies/collision/item-handler';
import { CollisionContext } from '../../../domain/strategies/collision/collision-handler';
import { ObstacleType, SpeedRank } from '../../../constants';
import { Obstacle } from '../../../types';

/** テスト用のデフォルトコンテキストを生成する */
const createContext = (overrides: Partial<CollisionContext> = {}): CollisionContext => ({
  collision: { ground: false, air: false, hit: false, nearMiss: false, dist: 100 },
  obstacle: { t: 'score', pos: 0.5, passed: false } as Obstacle,
  obstacleX: 200,
  playerX: 100,
  speedRank: SpeedRank.MID,
  isGodMode: false,
  ...overrides,
});

describe('scoreItemHandler', () => {
  describe('正常系', () => {
    it('衝突した場合にスコアアイテム取得イベントが発生する', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        obstacleX: 150,
      });

      // Act
      const result = scoreItemHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.obstacleUpdate).toBe(ObstacleType.TAKEN);
      expect(result.events).toContainEqual({
        type: 'ITEM_COLLECTED',
        itemType: 'score',
        position: { x: 150, y: 0 },
      });
    });

    it('衝突していない場合に何も起こらない', () => {
      // Arrange
      const context = createContext();

      // Act
      const result = scoreItemHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.obstacleUpdate).toBeUndefined();
      expect(result.events).toHaveLength(0);
    });
  });
});

describe('reverseItemHandler', () => {
  describe('正常系', () => {
    it('衝突した場合にリバースアイテム取得イベントが発生する', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        obstacleX: 250,
      });

      // Act
      const result = reverseItemHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.obstacleUpdate).toBe(ObstacleType.TAKEN);
      expect(result.events).toContainEqual({
        type: 'ITEM_COLLECTED',
        itemType: 'reverse',
        position: { x: 250, y: 0 },
      });
    });

    it('衝突していない場合に何も起こらない', () => {
      // Arrange
      const context = createContext();

      // Act
      const result = reverseItemHandler.handle(context);

      // Assert
      expect(result.events).toHaveLength(0);
    });
  });
});

describe('forceJumpItemHandler', () => {
  describe('正常系', () => {
    it('衝突した場合に強制ジャンプアイテム取得イベントが発生する', () => {
      // Arrange
      const context = createContext({
        collision: { ground: true, air: false, hit: true, nearMiss: false, dist: 10 },
        obstacleX: 300,
      });

      // Act
      const result = forceJumpItemHandler.handle(context);

      // Assert
      expect(result.dead).toBe(false);
      expect(result.obstacleUpdate).toBe(ObstacleType.TAKEN);
      expect(result.events).toContainEqual({
        type: 'ITEM_COLLECTED',
        itemType: 'forceJ',
        position: { x: 300, y: 0 },
      });
    });

    it('衝突していない場合に何も起こらない', () => {
      // Arrange
      const context = createContext();

      // Act
      const result = forceJumpItemHandler.handle(context);

      // Assert
      expect(result.events).toHaveLength(0);
    });
  });
});
