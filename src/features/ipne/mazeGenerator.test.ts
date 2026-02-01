/**
 * 迷路生成機能のテスト
 */
import { describe, test, expect } from '@jest/globals';
import { generateMaze } from './mazeGenerator';
import { MazeConfig, TileType } from './types';

const testConfig: MazeConfig = {
  width: 40,
  height: 40,
  minRoomSize: 6,
  maxRoomSize: 10,
  corridorWidth: 3,
  maxDepth: 3,
  loopCount: 1,
};

describe('mazeGenerator', () => {
  describe('generateMaze', () => {
    test('指定サイズの迷路を生成する', () => {
      const maze = generateMaze(testConfig);

      expect(maze.length).toBe(testConfig.height);
      expect(maze[0].length).toBe(testConfig.width);
    });

    test('外周が壁で囲まれている', () => {
      const maze = generateMaze(testConfig);

      // 上下の外周チェック
      for (let x = 0; x < testConfig.width; x++) {
        expect(maze[0][x]).toBe(TileType.WALL);
        expect(maze[testConfig.height - 1][x]).toBe(TileType.WALL);
      }

      // 左右の外周チェック
      for (let y = 0; y < testConfig.height; y++) {
        expect(maze[y][0]).toBe(TileType.WALL);
        expect(maze[y][testConfig.width - 1]).toBe(TileType.WALL);
      }
    });

    test('床タイルが存在する', () => {
      const maze = generateMaze(testConfig);
      let floorCount = 0;

      for (let y = 0; y < testConfig.height; y++) {
        for (let x = 0; x < testConfig.width; x++) {
          if (maze[y][x] === TileType.FLOOR) {
            floorCount++;
          }
        }
      }

      // 最低でも100タイルは床があることを期待
      expect(floorCount).toBeGreaterThan(100);
    });

    test('毎回異なる迷路が生成される', () => {
      const maze1 = generateMaze(testConfig);
      const maze2 = generateMaze(testConfig);

      // 配列の文字列表現を比較
      const str1 = JSON.stringify(maze1);
      const str2 = JSON.stringify(maze2);

      // 異なる迷路が生成されていることを確認
      // （ランダム性により、稀に同じになる可能性もあるが、確率的に低い）
      expect(str1).not.toBe(str2);
    });
  });
});
