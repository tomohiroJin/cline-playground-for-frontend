import { Collision } from '../collision';
import { Grid } from '../grid';
import type { BlockData } from '../types';

describe('Collision', () => {
  describe('buildMap', () => {
    test('グリッドセルをマップに登録すること', () => {
      const grid = Grid.create(3, 3);
      grid[1][1] = 'red';
      const map = Collision.buildMap([], grid);
      expect(map.has('1,1')).toBe(true);
      const target = map.get('1,1');
      expect(target?.type).toBe('grid');
    });

    test('ブロックをマップに登録すること', () => {
      const grid = Grid.create(3, 3);
      const block: BlockData = {
        id: 'b1',
        x: 0,
        y: 1,
        shape: [[1, 1]],
        color: 'red',
        power: 'triple',
      };
      const map = Collision.buildMap([block], grid);
      expect(map.has('0,1')).toBe(true);
      const target = map.get('0,1');
      expect(target?.type).toBe('block');
      expect(target?.blockId).toBe('b1');
      expect(target?.power).toBe('triple');
    });

    test('y < 0 のブロックセルは登録しないこと', () => {
      const grid = Grid.create(3, 3);
      const block: BlockData = {
        id: 'b1',
        x: 0,
        y: -1,
        shape: [[1]],
        color: 'red',
        power: null,
      };
      const map = Collision.buildMap([block], grid);
      expect(map.has('0,-1')).toBe(false);
    });
  });

  describe('getArea3x3', () => {
    test('中央で3x3の9セルを返すこと', () => {
      const cells = Collision.getArea3x3(5, 5, 12, 18);
      expect(cells.length).toBe(9);
    });

    test('角で範囲内のセルのみ返すこと', () => {
      const cells = Collision.getArea3x3(0, 0, 12, 18);
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
