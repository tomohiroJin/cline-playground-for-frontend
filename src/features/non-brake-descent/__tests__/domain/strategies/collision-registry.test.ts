import { CollisionRegistry } from '../../../domain/strategies/collision/collision-registry';
import { ObstacleType } from '../../../constants';

describe('CollisionRegistry', () => {
  describe('getHandler', () => {
    it('HOLE_S に対してハンドラが登録されている', () => {
      // Arrange & Act
      const handler = CollisionRegistry.getHandler(ObstacleType.HOLE_S);

      // Assert
      expect(handler).toBeDefined();
    });

    it('HOLE_L に対してハンドラが登録されている', () => {
      // Arrange & Act
      const handler = CollisionRegistry.getHandler(ObstacleType.HOLE_L);

      // Assert
      expect(handler).toBeDefined();
    });

    it('ROCK に対してハンドラが登録されている', () => {
      // Arrange & Act
      const handler = CollisionRegistry.getHandler(ObstacleType.ROCK);

      // Assert
      expect(handler).toBeDefined();
    });

    it('ENEMY に対してハンドラが登録されている', () => {
      // Arrange & Act
      const handler = CollisionRegistry.getHandler(ObstacleType.ENEMY);

      // Assert
      expect(handler).toBeDefined();
    });

    it('ENEMY_V に対してハンドラが登録されている', () => {
      // Arrange & Act
      const handler = CollisionRegistry.getHandler(ObstacleType.ENEMY_V);

      // Assert
      expect(handler).toBeDefined();
    });

    it('SCORE に対してハンドラが登録されている', () => {
      // Arrange & Act
      const handler = CollisionRegistry.getHandler(ObstacleType.SCORE);

      // Assert
      expect(handler).toBeDefined();
    });

    it('REVERSE に対してハンドラが登録されている', () => {
      // Arrange & Act
      const handler = CollisionRegistry.getHandler(ObstacleType.REVERSE);

      // Assert
      expect(handler).toBeDefined();
    });

    it('FORCE_JUMP に対してハンドラが登録されている', () => {
      // Arrange & Act
      const handler = CollisionRegistry.getHandler(ObstacleType.FORCE_JUMP);

      // Assert
      expect(handler).toBeDefined();
    });

    it('TAKEN に対してハンドラが登録されていない', () => {
      // Arrange & Act
      const handler = CollisionRegistry.getHandler(ObstacleType.TAKEN);

      // Assert
      expect(handler).toBeUndefined();
    });

    it('DEAD に対してハンドラが登録されていない', () => {
      // Arrange & Act
      const handler = CollisionRegistry.getHandler(ObstacleType.DEAD);

      // Assert
      expect(handler).toBeUndefined();
    });
  });

  describe('getRegisteredTypes', () => {
    it('8種類の障害物タイプが登録されている', () => {
      // Arrange & Act
      const types = CollisionRegistry.getRegisteredTypes();

      // Assert
      expect(types).toHaveLength(8);
      expect(types).toContain(ObstacleType.HOLE_S);
      expect(types).toContain(ObstacleType.HOLE_L);
      expect(types).toContain(ObstacleType.ROCK);
      expect(types).toContain(ObstacleType.ENEMY);
      expect(types).toContain(ObstacleType.ENEMY_V);
      expect(types).toContain(ObstacleType.SCORE);
      expect(types).toContain(ObstacleType.REVERSE);
      expect(types).toContain(ObstacleType.FORCE_JUMP);
    });
  });
});
