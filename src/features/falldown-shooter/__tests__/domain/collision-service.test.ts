// CollisionService のテスト

import { CollisionService } from '../../domain/services/collision-service';
import { GridModel } from '../../domain/models/grid';
import { BlockModel } from '../../domain/models/block';

describe('CollisionService', () => {
  describe('buildCollisionMap', () => {
    test('グリッドセルをマップに登録すること', () => {
      // Arrange
      const grid = GridModel.create(3, 3).setCell(1, 1, 'red');

      // Act
      const map = CollisionService.buildCollisionMap([], grid);

      // Assert
      expect(map.has('1,1')).toBe(true);
      expect(map.get('1,1')?.type).toBe('grid');
    });

    test('ブロックをマップに登録すること', () => {
      // Arrange
      const grid = GridModel.create(3, 3);
      const block = BlockModel.create({
        id: 'b1',
        x: 0,
        y: 1,
        shape: [[1, 1]],
        color: 'red',
        power: 'triple',
      });

      // Act
      const map = CollisionService.buildCollisionMap([block], grid);

      // Assert
      expect(map.has('0,1')).toBe(true);
      const target = map.get('0,1');
      expect(target?.type).toBe('block');
      expect(target?.blockId).toBe('b1');
      expect(target?.power).toBe('triple');
    });

    test('y < 0 のブロックセルは登録しないこと', () => {
      // Arrange
      const grid = GridModel.create(3, 3);
      const block = BlockModel.create({
        id: 'b1',
        x: 0,
        y: -1,
        shape: [[1]],
        color: 'red',
        power: null,
      });

      // Act
      const map = CollisionService.buildCollisionMap([block], grid);

      // Assert
      expect(map.has('0,-1')).toBe(false);
    });
  });

  describe('detectCollision', () => {
    test('衝突がある場合 CollisionResult を返すこと', () => {
      // Arrange
      const map = new Map([
        ['5,9', { type: 'grid' as const, x: 5, y: 9 }],
      ]);

      // Act
      const result = CollisionService.detectCollision(5, 9, map);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.target.type).toBe('grid');
    });

    test('衝突がない場合 null を返すこと', () => {
      // Arrange
      const map = new Map<string, { type: 'grid'; x: number; y: number }>();

      // Act
      const result = CollisionService.detectCollision(5, 9, map);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getExplosionArea', () => {
    test('中央で 3x3 の 9 セルを返すこと', () => {
      // Act
      const cells = CollisionService.getExplosionArea(5, 5, 12, 18);

      // Assert
      expect(cells.length).toBe(9);
    });

    test('角で範囲内のセルのみ返すこと', () => {
      // Act
      const cells = CollisionService.getExplosionArea(0, 0, 12, 18);

      // Assert
      expect(cells.length).toBe(4);
      expect(cells).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]);
    });
  });
});
