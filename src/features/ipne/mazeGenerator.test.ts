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

    test('迷路がランダムに生成される（複数回生成で少なくとも1回は異なる）', () => {
      const mazes = [];
      const attempts = 5;

      // 複数回生成して、少なくとも1つは異なる迷路が生成されることを確認
      for (let i = 0; i < attempts; i++) {
        mazes.push(generateMaze(testConfig));
      }

      // 文字列化して比較
      const stringified = mazes.map(m => JSON.stringify(m));

      // 少なくとも1つは異なる迷路が生成されていることを確認
      const allSame = stringified.every(str => str === stringified[0]);
      expect(allSame).toBe(false);
    });
  });
});
