// Grid 値オブジェクトのテスト

import { GridModel } from '../../domain/models/grid';

describe('GridModel', () => {
  describe('create', () => {
    test('指定サイズの空グリッドを作成すること', () => {
      // Arrange & Act
      const grid = GridModel.create(3, 4);

      // Assert
      expect(grid.width).toBe(3);
      expect(grid.height).toBe(4);
      expect(grid.cells.length).toBe(4);
      expect(grid.cells[0].length).toBe(3);
      expect(grid.cells.every(row => row.every(c => c === null))).toBe(true);
    });
  });

  describe('getCell', () => {
    test('指定座標のセル値を返すこと', () => {
      // Arrange
      const grid = GridModel.create(3, 3).setCell(1, 1, 'red');

      // Act & Assert
      expect(grid.getCell(1, 1)).toBe('red');
      expect(grid.getCell(0, 0)).toBeNull();
    });

    test('範囲外の座標でundefinedを返すこと', () => {
      // Arrange
      const grid = GridModel.create(3, 3);

      // Act & Assert
      expect(grid.getCell(-1, 0)).toBeUndefined();
      expect(grid.getCell(3, 0)).toBeUndefined();
      expect(grid.getCell(0, -1)).toBeUndefined();
      expect(grid.getCell(0, 3)).toBeUndefined();
    });
  });

  describe('setCell', () => {
    test('指定位置にセルを設定し新しいインスタンスを返すこと', () => {
      // Arrange
      const grid = GridModel.create(3, 3);

      // Act
      const newGrid = grid.setCell(1, 1, 'red');

      // Assert
      expect(newGrid.getCell(1, 1)).toBe('red');
      // 元のインスタンスは変更されない（不変性）
      expect(grid.getCell(1, 1)).toBeNull();
    });

    test('範囲外の場合は同じインスタンスを返すこと', () => {
      // Arrange
      const grid = GridModel.create(3, 3);

      // Act
      const result = grid.setCell(-1, 0, 'red');

      // Assert
      expect(result).toBe(grid);
    });
  });

  describe('isRowFull', () => {
    test('全セルが埋まった行でtrueを返すこと', () => {
      // Arrange
      let grid = GridModel.create(3, 3);
      grid = grid.setCell(0, 2, 'red').setCell(1, 2, 'blue').setCell(2, 2, 'green');

      // Act & Assert
      expect(grid.isRowFull(2)).toBe(true);
    });

    test('空セルがある行でfalseを返すこと', () => {
      // Arrange
      let grid = GridModel.create(3, 3);
      grid = grid.setCell(0, 2, 'red');

      // Act & Assert
      expect(grid.isRowFull(2)).toBe(false);
    });
  });

  describe('findHighestRow', () => {
    test('空グリッドではグリッドの高さを返すこと', () => {
      // Arrange
      const grid = GridModel.create(3, 5);

      // Act & Assert
      expect(grid.findHighestRow()).toBe(5);
    });

    test('セルがある行のインデックスを返すこと', () => {
      // Arrange
      const grid = GridModel.create(3, 5).setCell(1, 3, 'red');

      // Act & Assert
      expect(grid.findHighestRow()).toBe(3);
    });
  });

  describe('isEmpty', () => {
    test('空グリッドでtrueを返すこと', () => {
      expect(GridModel.create(3, 3).isEmpty()).toBe(true);
    });

    test('セルがある場合falseを返すこと', () => {
      const grid = GridModel.create(3, 3).setCell(0, 0, 'red');
      expect(grid.isEmpty()).toBe(false);
    });
  });

  describe('clearRow', () => {
    test('指定行を消去して上に空行を追加すること', () => {
      // Arrange
      let grid = GridModel.create(3, 3);
      grid = grid.setCell(0, 2, 'red').setCell(1, 2, 'blue').setCell(2, 2, 'green');

      // Act
      const result = grid.clearRow(2);

      // Assert
      expect(result.cells[0].every(c => c === null)).toBe(true);
      expect(result.cells[2].every(c => c === null)).toBe(true);
    });
  });

  describe('clearFullLines', () => {
    test('埋まった行を消去して消去数を返すこと', () => {
      // Arrange
      let grid = GridModel.create(3, 4);
      grid = grid.setCell(0, 3, 'red').setCell(1, 3, 'red').setCell(2, 3, 'red');

      // Act
      const result = grid.clearFullLines();

      // Assert
      expect(result.clearedCount).toBe(1);
      expect(result.grid.cells[3].every(c => c === null)).toBe(true);
    });

    test('埋まった行がなければ0を返すこと', () => {
      // Arrange
      const grid = GridModel.create(3, 3).setCell(0, 2, 'red');

      // Act
      const result = grid.clearFullLines();

      // Assert
      expect(result.clearedCount).toBe(0);
    });
  });

  describe('clearColumn', () => {
    test('指定列のセルを消去して消去数を返すこと', () => {
      // Arrange
      let grid = GridModel.create(3, 3);
      grid = grid.setCell(1, 0, 'red').setCell(1, 1, 'blue').setCell(1, 2, 'green');

      // Act
      const result = grid.clearColumn(1);

      // Assert
      expect(result.grid.getCell(1, 0)).toBeNull();
      expect(result.grid.getCell(1, 1)).toBeNull();
      expect(result.grid.getCell(1, 2)).toBeNull();
      expect(result.clearedCount).toBe(3);
    });
  });

  describe('toRawGrid', () => {
    test('2次元配列に変換できること', () => {
      // Arrange
      const grid = GridModel.create(2, 2).setCell(0, 0, 'red');

      // Act
      const raw = grid.toRawGrid();

      // Assert
      expect(raw[0][0]).toBe('red');
      expect(raw[0][1]).toBeNull();
      // ミュータブルであること（旧コードとの互換性）
      raw[0][0] = 'blue';
      expect(grid.getCell(0, 0)).toBe('red'); // 元は変わらない
    });
  });

  describe('fromRawGrid', () => {
    test('2次元配列からGridModelを生成できること', () => {
      // Arrange
      const raw: (string | null)[][] = [
        ['red', null],
        [null, 'blue'],
      ];

      // Act
      const grid = GridModel.fromRawGrid(raw);

      // Assert
      expect(grid.width).toBe(2);
      expect(grid.height).toBe(2);
      expect(grid.getCell(0, 0)).toBe('red');
      expect(grid.getCell(1, 1)).toBe('blue');
    });
  });
});
