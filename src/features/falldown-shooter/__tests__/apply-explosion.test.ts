// applyExplosion のテスト

import { GameLogic } from '../game-logic';
import { CONFIG } from '../constants';
import { createBlock, createGrid } from './helpers/factories';

describe('GameLogic.applyExplosion', () => {
  const WIDTH = 12;
  const HEIGHT = 18;

  describe('グリッドセルの爆破', () => {
    test('3x3 範囲のグリッドセルが消去されること', () => {
      // Arrange
      const grid = createGrid(WIDTH, HEIGHT);
      // 中心 (5, 10) の周囲 3x3 にセルを配置
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          grid[10 + dy][5 + dx] = 'red';
        }
      }

      // Act
      const result = GameLogic.applyExplosion(5, 10, [], grid, WIDTH, HEIGHT);

      // Assert
      // 全9セルが消去される
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          expect(result.grid[10 + dy][5 + dx]).toBeNull();
        }
      }
      expect(result.score).toBe(CONFIG.score.block * 9);
    });
  });

  describe('ブロックの爆破', () => {
    test('3x3 範囲内のブロックが破壊されること', () => {
      // Arrange
      const grid = createGrid(WIDTH, HEIGHT);
      const block = createBlock({
        id: 'b1',
        x: 5,
        y: 10,
        shape: [[1]],
        color: '#FF0000',
      });

      // Act
      const result = GameLogic.applyExplosion(5, 10, [block], grid, WIDTH, HEIGHT);

      // Assert
      expect(result.blocks.length).toBe(0);
      expect(result.score).toBe(CONFIG.score.block);
    });

    test('3x3 範囲外のブロックは破壊されないこと', () => {
      // Arrange
      const grid = createGrid(WIDTH, HEIGHT);
      const block = createBlock({
        id: 'b1',
        x: 0,
        y: 0,
        shape: [[1]],
        color: '#FF0000',
      });

      // Act: 中心 (5, 10) から離れた場所のブロック
      const result = GameLogic.applyExplosion(5, 10, [block], grid, WIDTH, HEIGHT);

      // Assert
      expect(result.blocks.length).toBe(1);
      expect(result.score).toBe(0);
    });
  });

  describe('端部での爆発', () => {
    test('グリッド左上角での爆発が正常に処理されること', () => {
      // Arrange
      const grid = createGrid(WIDTH, HEIGHT);
      grid[0][0] = 'red';
      grid[0][1] = 'red';
      grid[1][0] = 'red';
      grid[1][1] = 'red';

      // Act: 角 (0, 0) での爆発
      const result = GameLogic.applyExplosion(0, 0, [], grid, WIDTH, HEIGHT);

      // Assert: 範囲内のセルのみ消去（左上角は 2x2 のみ有効）
      expect(result.grid[0][0]).toBeNull();
      expect(result.grid[0][1]).toBeNull();
      expect(result.grid[1][0]).toBeNull();
      expect(result.grid[1][1]).toBeNull();
      expect(result.score).toBe(CONFIG.score.block * 4);
    });

    test('グリッド右下角での爆発が正常に処理されること', () => {
      // Arrange
      const grid = createGrid(WIDTH, HEIGHT);
      const lastX = WIDTH - 1;
      const lastY = HEIGHT - 1;
      grid[lastY][lastX] = 'red';
      grid[lastY - 1][lastX] = 'red';
      grid[lastY][lastX - 1] = 'red';
      grid[lastY - 1][lastX - 1] = 'red';

      // Act
      const result = GameLogic.applyExplosion(lastX, lastY, [], grid, WIDTH, HEIGHT);

      // Assert
      expect(result.grid[lastY][lastX]).toBeNull();
      expect(result.grid[lastY - 1][lastX]).toBeNull();
      expect(result.grid[lastY][lastX - 1]).toBeNull();
      expect(result.grid[lastY - 1][lastX - 1]).toBeNull();
      expect(result.score).toBe(CONFIG.score.block * 4);
    });
  });

  describe('グリッドとブロックの混在', () => {
    test('グリッドとブロックが混在する場合のスコア計算が正しいこと', () => {
      // Arrange
      const grid = createGrid(WIDTH, HEIGHT);
      grid[9][5] = 'red'; // グリッドセル
      grid[10][4] = 'blue'; // グリッドセル
      const block = createBlock({
        id: 'b1',
        x: 5,
        y: 10,
        shape: [[1]],
        color: '#FF0000',
      });

      // Act: 中心 (5, 10) で爆発
      const result = GameLogic.applyExplosion(5, 10, [block], grid, WIDTH, HEIGHT);

      // Assert
      expect(result.grid[9][5]).toBeNull();
      expect(result.grid[10][4]).toBeNull();
      // グリッド2セル + ブロック1セル = 3セル分のスコア
      expect(result.score).toBe(CONFIG.score.block * 3);
    });
  });
});
