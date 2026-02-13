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
});
