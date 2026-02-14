import { Block } from '../block';
import { Grid } from '../grid';
import type { BlockData } from '../types';

describe('Block', () => {
  const makeBlock = (overrides: Partial<BlockData> = {}): BlockData => ({
    id: 'test-block',
    x: 0,
    y: 0,
    shape: [[1, 1]],
    color: '#FF0000',
    power: null,
    ...overrides,
  });

  describe('getCells', () => {
    test('ブロックのセル座標を返すこと', () => {
      const block = makeBlock({ x: 2, y: 3, shape: [[1, 1]] });
      const cells = Block.getCells(block);
      expect(cells).toEqual([
        { x: 2, y: 3 },
        { x: 3, y: 3 },
      ]);
    });

    test('L字型ブロックのセル座標を返すこと', () => {
      const block = makeBlock({
        x: 0,
        y: 0,
        shape: [
          [1, 0],
          [1, 1],
        ],
      });
      const cells = Block.getCells(block);
      expect(cells).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]);
    });
  });

  describe('toSingleCells', () => {
    test('ブロックを単一セルに分解すること', () => {
      const block = makeBlock({ x: 1, y: 2, shape: [[1, 1]], power: 'triple' });
      const singles = Block.toSingleCells(block);
      expect(singles.length).toBe(2);
      expect(singles[0].shape).toEqual([[1]]);
      expect(singles[0].power).toBe('triple');
      expect(singles[1].power).toBeNull();
    });
  });

  describe('create', () => {
    test('有効なブロックを生成すること', () => {
      const block = Block.create(12);
      expect(block.x).toBeGreaterThanOrEqual(0);
      expect(block.y).toBeLessThan(0);
      expect(block.shape.length).toBeGreaterThan(0);
      expect(block.color).toBeTruthy();
      expect(block.id).toBeTruthy();
    });
  });

  describe('canMoveTo', () => {
    test('空きスペースに移動できること', () => {
      const grid = Grid.create(5, 5);
      const block = makeBlock({ x: 0, y: 0, shape: [[1, 1]] });
      expect(Block.canMoveTo(block, 1, grid, 5, [])).toBe(true);
    });

    test('グリッドのセルがある位置に移動できないこと', () => {
      const grid = Grid.create(5, 5);
      grid[2][0] = 'red';
      const block = makeBlock({ x: 0, y: 0, shape: [[1]] });
      expect(Block.canMoveTo(block, 2, grid, 5, [])).toBe(false);
    });

    test('グリッドの底を超えて移動できないこと', () => {
      const grid = Grid.create(5, 5);
      const block = makeBlock({ x: 0, y: 4, shape: [[1]] });
      expect(Block.canMoveTo(block, 5, grid, 5, [])).toBe(false);
    });
  });

  describe('placeOnGrid', () => {
    test('ブロックをグリッドに配置すること', () => {
      const grid = Grid.create(5, 5);
      const block = makeBlock({ x: 1, y: 3, shape: [[1, 1]], color: '#FF0000' });
      const result = Block.placeOnGrid([block], grid);
      expect(result[3][1]).toBe('#FF0000');
      expect(result[3][2]).toBe('#FF0000');
    });
  });
});
