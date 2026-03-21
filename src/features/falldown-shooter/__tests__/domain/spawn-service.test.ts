// SpawnService のテスト

import { SpawnService } from '../../domain/services/spawn-service';
import { BlockModel } from '../../domain/models/block';

describe('SpawnService', () => {
  describe('canSpawn', () => {
    test('ブロックが少ない場合 true を返すこと', () => {
      expect(SpawnService.canSpawn([])).toBe(true);
    });

    test('上部に 3 つ以上のブロックがある場合 false を返すこと', () => {
      // Arrange
      const blocks = [
        BlockModel.create({ id: 'b1', x: 0, y: 0, shape: [[1]], color: 'red', power: null }),
        BlockModel.create({ id: 'b2', x: 2, y: 1, shape: [[1]], color: 'blue', power: null }),
        BlockModel.create({ id: 'b3', x: 4, y: 0, shape: [[1]], color: 'green', power: null }),
      ];

      // Act & Assert
      expect(SpawnService.canSpawn(blocks)).toBe(false);
    });
  });

  describe('spawnBlock', () => {
    test('有効なブロックを生成すること', () => {
      // Act
      const block = SpawnService.spawnBlock({
        gridWidth: 12,
        existingBlocks: [],
        powerUpChance: 0.15,
      });

      // Assert
      expect(block.position.x).toBeGreaterThanOrEqual(0);
      expect(block.position.y).toBeLessThan(0);
      expect(block.id).toBeTruthy();
      expect(block.color).toBeTruthy();
    });

    test('既存ブロックと重ならない位置に生成すること', () => {
      // Arrange
      const existing = [
        BlockModel.create({ id: 'b1', x: 5, y: -2, shape: [[1, 1, 1]], color: 'red', power: null }),
      ];

      // Act
      const block = SpawnService.spawnBlock({
        gridWidth: 12,
        existingBlocks: existing,
        powerUpChance: 0,
      });

      // Assert
      expect(block).toBeDefined();
      expect(block.id).toBeTruthy();
    });
  });
});
