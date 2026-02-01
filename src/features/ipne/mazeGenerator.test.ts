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
      const { grid: maze } = generateMaze(testConfig);

      expect(maze.length).toBe(testConfig.height);
      expect(maze[0].length).toBe(testConfig.width);
    });

    test('外周が壁で囲まれている', () => {
      const { grid: maze } = generateMaze(testConfig);

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
      const { grid: maze } = generateMaze(testConfig);
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

    test('BSP生成された部屋情報が返される', () => {
      const { rooms } = generateMaze(testConfig);

      // 部屋が生成されている
      expect(rooms.length).toBeGreaterThan(0);

      // 各部屋にはrect, center, tilesがある
      for (const room of rooms) {
        expect(room.rect).toBeDefined();
        expect(room.center).toBeDefined();
        expect(room.tiles).toBeDefined();
        expect(room.tiles!.length).toBeGreaterThan(0);

        // tilesはrect内に収まっている
        for (const tile of room.tiles!) {
          expect(tile.x).toBeGreaterThanOrEqual(room.rect.x);
          expect(tile.x).toBeLessThan(room.rect.x + room.rect.width);
          expect(tile.y).toBeGreaterThanOrEqual(room.rect.y);
          expect(tile.y).toBeLessThan(room.rect.y + room.rect.height);
        }
      }
    });

    test('部屋タイルは通路ではなく実際の部屋内座標である', () => {
      const { grid: maze, rooms } = generateMaze(testConfig);

      // 各部屋のtilesは実際に床タイルになっている
      for (const room of rooms) {
        for (const tile of room.tiles!) {
          expect(maze[tile.y][tile.x]).toBe(TileType.FLOOR);
        }

        // 部屋は最小サイズ以上
        expect(room.rect.width).toBeGreaterThanOrEqual(testConfig.minRoomSize - 2);
        expect(room.rect.height).toBeGreaterThanOrEqual(testConfig.minRoomSize - 2);
      }
    });
  });
});
