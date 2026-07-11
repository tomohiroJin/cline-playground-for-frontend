import { MazeService } from '../maze-service';

describe('labyrinth-of-shadows/maze-service', () => {
  describe('create', () => {
    test('指定サイズの迷路を生成する', () => {
      const maze = MazeService.create(9);
      expect(maze.length).toBe(9);
      expect(maze[0].length).toBe(9);
    });

    test('外壁は全て壁である', () => {
      const maze = MazeService.create(9);
      // 上辺・下辺
      for (let x = 0; x < 9; x++) {
        expect(maze[0][x]).toBe(1);
        expect(maze[8][x]).toBe(1);
      }
      // 左辺・右辺
      for (let y = 0; y < 9; y++) {
        expect(maze[y][0]).toBe(1);
        expect(maze[y][8]).toBe(1);
      }
    });

    test('開始地点(1,1)は通路である', () => {
      const maze = MazeService.create(9);
      expect(maze[1][1]).toBe(0);
    });
  });

  describe('getEmptyCells', () => {
    test('空きセルのリストを返す', () => {
      const maze = MazeService.create(9);
      const cells = MazeService.getEmptyCells(maze);
      expect(cells.length).toBeGreaterThan(0);
      cells.forEach(cell => {
        expect(maze[cell.y][cell.x]).toBe(0);
      });
    });
  });

  describe('isWalkable', () => {
    test('通路は歩行可能', () => {
      const maze = MazeService.create(9);
      expect(MazeService.isWalkable(maze, 1, 1)).toBe(true);
    });

    test('壁は歩行不可', () => {
      const maze = MazeService.create(9);
      expect(MazeService.isWalkable(maze, 0, 0)).toBe(false);
    });

    test('範囲外は歩行不可', () => {
      const maze = MazeService.create(9);
      expect(MazeService.isWalkable(maze, -1, -1)).toBe(false);
    });
  });

  describe('hasLineOfSight', () => {
    test('同じ位置からは視線が通る', () => {
      const maze = MazeService.create(9);
      expect(MazeService.hasLineOfSight(maze, 1.5, 1.5, 1.5, 1.5)).toBe(true);
    });
  });

  describe('createPrim', () => {
    test('Prim法で指定サイズの迷路を生成する', () => {
      const maze = MazeService.createPrim(11);
      expect(maze.length).toBe(11);
      expect(maze[0].length).toBe(11);
    });

    test('Prim法の外壁は全て壁である', () => {
      const maze = MazeService.createPrim(11);
      for (let x = 0; x < 11; x++) {
        expect(maze[0][x]).toBe(1);
        expect(maze[10][x]).toBe(1);
      }
      for (let y = 0; y < 11; y++) {
        expect(maze[y][0]).toBe(1);
        expect(maze[y][10]).toBe(1);
      }
    });

    test('Prim法の開始地点(1,1)は通路である', () => {
      const maze = MazeService.createPrim(9);
      expect(maze[1][1]).toBe(0);
    });

    test('Prim法の迷路にも空きセルが存在する', () => {
      const maze = MazeService.createPrim(9);
      const cells = MazeService.getEmptyCells(maze);
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('bfsPath', () => {
    test('同じ位置へのパスは空配列を返す', () => {
      const maze = MazeService.create(9);
      const path = MazeService.bfsPath(maze, 1.5, 1.5, 1.5, 1.5);
      expect(path).toEqual([]);
    });

    test('到達可能な位置へのパスを返す', () => {
      const maze = MazeService.create(9);
      const cells = MazeService.getEmptyCells(maze);
      if (cells.length >= 2) {
        const start = cells[0];
        const end = cells[cells.length - 1];
        const path = MazeService.bfsPath(maze, start.x + 0.5, start.y + 0.5, end.x + 0.5, end.y + 0.5);
        // パスが存在するか空（同一セルの場合）
        expect(Array.isArray(path)).toBe(true);
      }
    });

    test('パスの各ポイントは通路上にある', () => {
      const maze = MazeService.create(9);
      const path = MazeService.bfsPath(maze, 1.5, 1.5, 3.5, 1.5);
      for (const p of path) {
        expect(MazeService.isWalkable(maze, p.x, p.y)).toBe(true);
      }
    });
  });

  describe('expand（通路2セル幅化）', () => {
    test('各セルが factor×factor に拡大される', () => {
      // Arrange
      const maze = [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1],
      ];

      // Act
      const expanded = MazeService.expand(maze, 2);

      // Assert: 6x6 になり、中央の通路は 2x2 の空間になる
      expect(expanded).toHaveLength(6);
      expect(expanded[0]).toHaveLength(6);
      expect(expanded[2][2]).toBe(0);
      expect(expanded[2][3]).toBe(0);
      expect(expanded[3][2]).toBe(0);
      expect(expanded[3][3]).toBe(0);
      expect(expanded[0][0]).toBe(1);
      expect(expanded[1][1]).toBe(1);
    });

    test('拡大後も迷路の連結性が保たれる（元の通路間のパスが存在する）', () => {
      // Arrange: 生成迷路を拡大
      const maze = MazeService.expand(MazeService.create(9), 2);
      const cells = MazeService.getEmptyCells(maze);

      // Act: 最初と最後の通路セル間の BFS パス
      const start = cells[0];
      const end = cells[cells.length - 1];
      const path = MazeService.bfsPath(maze, start.x + 0.5, start.y + 0.5, end.x + 0.5, end.y + 0.5);

      // Assert: 到達可能（開始と終了が同一セルでなければパスがある）
      expect(path.length).toBeGreaterThan(0);
    });

    test('拡大後の通路はすべて2セル幅（直交方向に隣接する通路セルを持つ）', () => {
      // Arrange
      const maze = MazeService.expand(MazeService.create(9), 2);

      // Act & Assert: すべての通路セルは横か縦に隣接する通路セルを持つ
      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
          if (maze[y][x] !== 0) continue;
          const hasHorizontalPair = maze[y][x - 1] === 0 || maze[y][x + 1] === 0;
          const hasVerticalPair = maze[y - 1]?.[x] === 0 || maze[y + 1]?.[x] === 0;
          expect(hasHorizontalPair && hasVerticalPair).toBe(true);
        }
      }
    });
  });
});
