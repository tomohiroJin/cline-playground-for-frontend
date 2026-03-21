// SkillService のテスト

import { SkillService } from '../../domain/services/skill-service';
import { GridModel } from '../../domain/models/grid';
import { BlockModel } from '../../domain/models/block';
import { CONFIG } from '../../constants';

describe('SkillService', () => {
  describe('laser（縦レーザー）', () => {
    test('指定列のグリッドセルを消去すること', () => {
      // Arrange
      let grid = GridModel.create(5, 5);
      grid = grid.setCell(2, 3, 'red').setCell(2, 4, 'blue');
      const blocks: BlockModel[] = [];

      // Act
      const result = SkillService.activate('laser', {
        blocks,
        grid,
        playerX: 2,
      });

      // Assert
      expect(result.grid.getCell(2, 3)).toBeNull();
      expect(result.grid.getCell(2, 4)).toBeNull();
      expect(result.score).toBe(CONFIG.score.block * 2);
    });

    test('指定列のブロックを消去すること', () => {
      // Arrange
      const grid = GridModel.create(5, 5);
      const block = BlockModel.create({
        id: 'b1',
        x: 2,
        y: 1,
        shape: [[1]],
        color: 'red',
        power: null,
      });

      // Act
      const result = SkillService.activate('laser', {
        blocks: [block],
        grid,
        playerX: 2,
      });

      // Assert
      expect(result.blocks.length).toBe(0);
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('blast（全画面爆破）', () => {
    test('全ブロックを消去してスコアを返すこと', () => {
      // Arrange
      const grid = GridModel.create(5, 5);
      const blocks = [
        BlockModel.create({ id: 'b1', x: 0, y: 0, shape: [[1, 1]], color: 'red', power: null }),
        BlockModel.create({ id: 'b2', x: 3, y: 3, shape: [[1]], color: 'blue', power: null }),
      ];

      // Act
      const result = SkillService.activate('blast', {
        blocks,
        grid,
        playerX: 2,
      });

      // Assert
      expect(result.blocks.length).toBe(0);
      expect(result.score).toBe(CONFIG.score.block * 3); // 3セル分
    });
  });

  describe('clear（ライン消去）', () => {
    test('最下行にブロックがある場合消去すること', () => {
      // Arrange
      let grid = GridModel.create(3, 3);
      grid = grid.setCell(0, 2, 'red').setCell(1, 2, 'red');

      // Act
      const result = SkillService.activate('clear', {
        blocks: [],
        grid,
        playerX: 1,
      });

      // Assert
      expect(result.grid.getCell(0, 2)).toBeNull();
      expect(result.grid.getCell(1, 2)).toBeNull();
      expect(result.score).toBe(CONFIG.score.block * 2);
    });

    test('最下行が空の場合スコア 0 を返すこと', () => {
      // Arrange
      const grid = GridModel.create(3, 3);

      // Act
      const result = SkillService.activate('clear', {
        blocks: [],
        grid,
        playerX: 1,
      });

      // Assert
      expect(result.score).toBe(0);
    });
  });
});
