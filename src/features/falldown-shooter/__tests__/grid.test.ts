import { Grid } from '../grid';

describe('Grid', () => {
  describe('create', () => {
    test('指定サイズの空グリッドを作成すること', () => {
      const grid = Grid.create(3, 4);
      expect(grid.length).toBe(4);
      expect(grid[0].length).toBe(3);
      expect(grid.every(row => row.every(c => c === null))).toBe(true);
    });
  });

  describe('clone', () => {
    test('元のグリッドと同じ内容のコピーを返すこと', () => {
      const grid = Grid.create(3, 3);
      grid[1][1] = 'red';
      const cloned = Grid.clone(grid);
      expect(cloned[1][1]).toBe('red');
      // 変更がコピーに影響しないことを確認
      cloned[1][1] = 'blue';
      expect(grid[1][1]).toBe('red');
    });
  });

  describe('findHighestRow', () => {
    test('空グリッドではグリッドの高さを返すこと', () => {
      const grid = Grid.create(3, 5);
      expect(Grid.findHighestRow(grid)).toBe(5);
    });

    test('セルがある行のインデックスを返すこと', () => {
      const grid = Grid.create(3, 5);
      grid[3][1] = 'red';
      expect(Grid.findHighestRow(grid)).toBe(3);
    });
  });

  describe('clearRow', () => {
    test('指定行を消去して上に空行を追加すること', () => {
      const grid = Grid.create(3, 3);
      grid[2][0] = 'red';
      grid[2][1] = 'blue';
      grid[2][2] = 'green';
      const result = Grid.clearRow(grid, 2);
      expect(result[0].every(c => c === null)).toBe(true);
      expect(result[2].every(c => c === null)).toBe(true);
    });
  });

  describe('clearFullLines', () => {
    test('埋まった行を消去して消去数を返すこと', () => {
      const grid = Grid.create(3, 4);
      // 最下行を埋める
      grid[3][0] = 'red';
      grid[3][1] = 'red';
      grid[3][2] = 'red';
      const result = Grid.clearFullLines(grid);
      expect(result.cleared).toBe(1);
      expect(result.grid[3].every(c => c === null)).toBe(true);
    });

    test('埋まった行がなければ0を返すこと', () => {
      const grid = Grid.create(3, 3);
      grid[2][0] = 'red';
      const result = Grid.clearFullLines(grid);
      expect(result.cleared).toBe(0);
    });
  });

  describe('setCell', () => {
    test('指定位置にセルを設定すること', () => {
      const grid = Grid.create(3, 3);
      const result = Grid.setCell(grid, 1, 1, 'red');
      expect(result[1][1]).toBe('red');
      // 元のグリッドは変更されないこと
      expect(grid[1][1]).toBeNull();
    });

    test('範囲外の場合は元のグリッドを返すこと', () => {
      const grid = Grid.create(3, 3);
      const result = Grid.setCell(grid, -1, 0, 'red');
      expect(result).toBe(grid);
    });
  });

  describe('clearColumn', () => {
    test('指定列のセルを消去してスコアを返すこと', () => {
      const grid = Grid.create(3, 3);
      grid[0][1] = 'red';
      grid[1][1] = 'blue';
      grid[2][1] = 'green';
      const result = Grid.clearColumn(grid, 1);
      expect(result.grid[0][1]).toBeNull();
      expect(result.grid[1][1]).toBeNull();
      expect(result.grid[2][1]).toBeNull();
      expect(result.score).toBe(30); // 3 * CONFIG.score.block(10)
    });
  });
});
