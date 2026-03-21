// Block 値オブジェクトのテスト

import { BlockModel } from '../../domain/models/block';
import { GridModel } from '../../domain/models/grid';

describe('BlockModel', () => {
  const makeBlock = (overrides: Partial<ConstructorParameters<typeof BlockModel['create']>[0]> = {}) =>
    BlockModel.create({
      id: 'test-block',
      x: 0,
      y: 0,
      shape: [[1, 1]],
      color: '#FF0000',
      power: null,
      ...overrides,
    });

  describe('create', () => {
    test('ブロックを生成すること', () => {
      // Arrange & Act
      const block = makeBlock();

      // Assert
      expect(block.id).toBe('test-block');
      expect(block.position).toEqual({ x: 0, y: 0 });
      expect(block.color).toBe('#FF0000');
      expect(block.power).toBeNull();
    });
  });

  describe('getCells', () => {
    test('ブロックのセル座標を返すこと', () => {
      // Arrange
      const block = makeBlock({ x: 2, y: 3, shape: [[1, 1]] });

      // Act
      const cells = block.getCells();

      // Assert
      expect(cells).toEqual([
        { x: 2, y: 3 },
        { x: 3, y: 3 },
      ]);
    });

    test('L字型ブロックのセル座標を返すこと', () => {
      // Arrange
      const block = makeBlock({
        x: 0,
        y: 0,
        shape: [
          [1, 0],
          [1, 1],
        ],
      });

      // Act
      const cells = block.getCells();

      // Assert
      expect(cells).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]);
    });
  });

  describe('getFutureCells', () => {
    test('未来のセル座標を含めて返すこと', () => {
      // Arrange
      const block = makeBlock({ x: 0, y: 0, shape: [[1]] });

      // Act
      const cells = block.getFutureCells(2);

      // Assert
      // y=0,1,2 の3行分のセルが返る
      expect(cells.length).toBe(3);
      expect(cells).toContainEqual({ x: 0, y: 0 });
      expect(cells).toContainEqual({ x: 0, y: 1 });
      expect(cells).toContainEqual({ x: 0, y: 2 });
    });
  });

  describe('moveTo', () => {
    test('新しい y 位置のブロックを返すこと', () => {
      // Arrange
      const block = makeBlock({ y: 5 });

      // Act
      const moved = block.moveTo(6);

      // Assert
      expect(moved.position.y).toBe(6);
      // 元のブロックは変更されない
      expect(block.position.y).toBe(5);
    });
  });

  describe('canMoveTo', () => {
    test('空きスペースに移動できること', () => {
      // Arrange
      const grid = GridModel.create(5, 5);
      const block = makeBlock({ x: 0, y: 0, shape: [[1, 1]] });

      // Act & Assert
      expect(block.canMoveTo(1, grid, [])).toBe(true);
    });

    test('グリッドのセルがある位置に移動できないこと', () => {
      // Arrange
      const grid = GridModel.create(5, 5).setCell(0, 2, 'red');
      const block = makeBlock({ x: 0, y: 0, shape: [[1]] });

      // Act & Assert
      expect(block.canMoveTo(2, grid, [])).toBe(false);
    });

    test('グリッドの底を超えて移動できないこと', () => {
      // Arrange
      const grid = GridModel.create(5, 5);
      const block = makeBlock({ x: 0, y: 4, shape: [[1]] });

      // Act & Assert
      expect(block.canMoveTo(5, grid, [])).toBe(false);
    });

    test('他のブロックがある位置に移動できないこと', () => {
      // Arrange
      const grid = GridModel.create(5, 5);
      const block = makeBlock({ id: 'a', x: 0, y: 0, shape: [[1]] });
      const other = makeBlock({ id: 'b', x: 0, y: 2, shape: [[1]] });

      // Act & Assert
      expect(block.canMoveTo(2, grid, [other])).toBe(false);
    });
  });

  describe('toSingleCells', () => {
    test('ブロックを単一セルに分解すること', () => {
      // Arrange
      const block = makeBlock({ x: 1, y: 2, shape: [[1, 1]], power: 'triple' });

      // Act
      const singles = block.toSingleCells();

      // Assert
      expect(singles.length).toBe(2);
      expect(singles[0].shape).toEqual([[1]]);
      expect(singles[0].power).toBe('triple');
      expect(singles[1].power).toBeNull();
    });
  });

  describe('toBlockData', () => {
    test('旧 BlockData 形式に変換できること', () => {
      // Arrange
      const block = makeBlock({ x: 3, y: 5 });

      // Act
      const data = block.toBlockData();

      // Assert
      expect(data.id).toBe('test-block');
      expect(data.x).toBe(3);
      expect(data.y).toBe(5);
      expect(data.shape).toEqual([[1, 1]]);
      expect(data.color).toBe('#FF0000');
      expect(data.power).toBeNull();
    });
  });
});
