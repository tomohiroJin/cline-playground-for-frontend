import { RecursiveBacktrackGenerator, PrimGenerator } from '../services/maze-generator';
import { isWalkable } from '../models/maze';

describe('domain/services/maze-generator', () => {
  describe('RecursiveBacktrackGenerator', () => {
    const generator = new RecursiveBacktrackGenerator();

    test('指定サイズの迷路を生成する', () => {
      const maze = generator.generate(9);
      expect(maze.length).toBe(9);
      expect(maze[0].length).toBe(9);
    });

    test('外壁は全て壁である', () => {
      const maze = generator.generate(9);
      for (let x = 0; x < 9; x++) {
        expect(maze[0][x]).toBe(1);
        expect(maze[8][x]).toBe(1);
      }
      for (let y = 0; y < 9; y++) {
        expect(maze[y][0]).toBe(1);
        expect(maze[y][8]).toBe(1);
      }
    });

    test('開始地点(1,1)は通路である', () => {
      const maze = generator.generate(9);
      expect(maze[1][1]).toBe(0);
    });

    test('固定乱数で再現可能な迷路を生成する', () => {
      let seed = 42;
      const seededRandom = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      seed = 42;
      const maze1 = generator.generate(9, seededRandom);
      seed = 42;
      const maze2 = generator.generate(9, seededRandom);
      expect(maze1).toEqual(maze2);
    });
  });

  describe('PrimGenerator', () => {
    const generator = new PrimGenerator();

    test('指定サイズの迷路を生成する', () => {
      const maze = generator.generate(11);
      expect(maze.length).toBe(11);
      expect(maze[0].length).toBe(11);
    });

    test('外壁は全て壁である', () => {
      const maze = generator.generate(11);
      for (let x = 0; x < 11; x++) {
        expect(maze[0][x]).toBe(1);
        expect(maze[10][x]).toBe(1);
      }
      for (let y = 0; y < 11; y++) {
        expect(maze[y][0]).toBe(1);
        expect(maze[y][10]).toBe(1);
      }
    });

    test('開始地点(1,1)は通路である', () => {
      const maze = generator.generate(9);
      expect(maze[1][1]).toBe(0);
    });

    test('生成された迷路に通路が存在する', () => {
      const maze = generator.generate(9);
      let hasPath = false;
      for (let y = 1; y < 8; y++) {
        for (let x = 1; x < 8; x++) {
          if (isWalkable(maze, x, y)) {
            hasPath = true;
            break;
          }
        }
        if (hasPath) break;
      }
      expect(hasPath).toBe(true);
    });

    test('固定乱数で再現可能な迷路を生成する', () => {
      let seed = 42;
      const seededRandom = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      seed = 42;
      const maze1 = generator.generate(9, seededRandom);
      seed = 42;
      const maze2 = generator.generate(9, seededRandom);
      expect(maze1).toEqual(maze2);
    });
  });
});
