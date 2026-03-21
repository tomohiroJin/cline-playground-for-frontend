// processBullets のテスト

import { GameLogic } from '../game-logic';
import { CONFIG } from '../constants';
import { createBlock, createBullet, createGrid } from './helpers/factories';

describe('GameLogic.processBullets', () => {
  const WIDTH = 12;
  const HEIGHT = 18;
  const noop = () => {};

  describe('弾丸の移動', () => {
    test('弾丸が正常に移動すること', () => {
      // Arrange
      const bullet = createBullet({ x: 5, y: 10, dx: 0, dy: -1 });
      const grid = createGrid(WIDTH, HEIGHT);

      // Act
      const result = GameLogic.processBullets([bullet], [], grid, WIDTH, HEIGHT, noop);

      // Assert
      expect(result.bullets.length).toBe(1);
      expect(result.bullets[0].y).toBe(9);
    });

    test('範囲外の弾丸が除去されること', () => {
      // Arrange: y=0 で上方向に移動する弾丸 → 移動後 y=-1 で範囲外
      const bullet = createBullet({ x: 5, y: 0, dx: 0, dy: -1 });
      const grid = createGrid(WIDTH, HEIGHT);

      // Act
      const result = GameLogic.processBullets([bullet], [], grid, WIDTH, HEIGHT, noop);

      // Assert
      expect(result.bullets.length).toBe(0);
    });

    test('左端を超えた弾丸が除去されること', () => {
      // Arrange: x=0 で左方向に移動する弾丸 → 移動後 x=-1 で範囲外
      const bullet = createBullet({ x: 0, y: 10, dx: -1, dy: -1 });
      const grid = createGrid(WIDTH, HEIGHT);

      // Act
      const result = GameLogic.processBullets([bullet], [], grid, WIDTH, HEIGHT, noop);

      // Assert
      expect(result.bullets.length).toBe(0);
    });
  });

  describe('グリッドセルとの衝突', () => {
    test('グリッドセルとの衝突でスコアが加算されること', () => {
      // Arrange: 弾丸の移動先にグリッドセルを配置
      const bullet = createBullet({ x: 5, y: 10, dx: 0, dy: -1 });
      const grid = createGrid(WIDTH, HEIGHT);
      grid[9][5] = 'red'; // 移動先 (5, 9) にセル

      // Act
      const result = GameLogic.processBullets([bullet], [], grid, WIDTH, HEIGHT, noop);

      // Assert
      expect(result.score).toBe(CONFIG.score.block);
      expect(result.hitCount).toBe(1);
      expect(result.grid[9][5]).toBeNull(); // セルが消去される
      expect(result.bullets.length).toBe(0); // 弾丸は消える
    });

    test('弾丸の現在位置にあるグリッドセルとも衝突すること', () => {
      // Arrange: 弾丸の現在位置にグリッドセルを配置
      const bullet = createBullet({ x: 5, y: 10, dx: 0, dy: -1 });
      const grid = createGrid(WIDTH, HEIGHT);
      grid[10][5] = 'red'; // 現在位置 (5, 10) にセル

      // Act
      const result = GameLogic.processBullets([bullet], [], grid, WIDTH, HEIGHT, noop);

      // Assert
      expect(result.score).toBe(CONFIG.score.block);
      expect(result.hitCount).toBe(1);
    });
  });

  describe('ブロックとの衝突', () => {
    test('ブロックとの衝突でブロックが分割されること', () => {
      // Arrange: 2セルのブロックの左端に弾丸を当てる
      const block = createBlock({
        id: 'b1',
        x: 5,
        y: 9,
        shape: [[1, 1]],
        color: '#FF0000',
      });
      const bullet = createBullet({ x: 5, y: 10, dx: 0, dy: -1 });
      const grid = createGrid(WIDTH, HEIGHT);

      // Act
      const result = GameLogic.processBullets([bullet], [block], grid, WIDTH, HEIGHT, noop);

      // Assert
      expect(result.score).toBe(CONFIG.score.block);
      expect(result.hitCount).toBe(1);
      // 元ブロックが分割され、当たった (5,9) セルが除去される
      // 残りは (6,9) の1セルブロック
      expect(result.blocks.length).toBe(1);
      expect(result.blocks[0].x).toBe(6);
      expect(result.blocks[0].y).toBe(9);
    });
  });

  describe('貫通弾', () => {
    test('貫通弾が複数ターゲットを貫通すること', () => {
      // Arrange: 弾丸の現在位置と移動先の両方にグリッドセル
      const bullet = createBullet({ x: 5, y: 10, dx: 0, dy: -1, pierce: true });
      const grid = createGrid(WIDTH, HEIGHT);
      grid[10][5] = 'red'; // 現在位置
      grid[9][5] = 'blue'; // 移動先

      // Act
      const result = GameLogic.processBullets([bullet], [], grid, WIDTH, HEIGHT, noop);

      // Assert
      expect(result.score).toBe(CONFIG.score.block * 2);
      expect(result.hitCount).toBe(2);
      expect(result.grid[10][5]).toBeNull();
      expect(result.grid[9][5]).toBeNull();
    });

    test('非貫通弾は最初のヒットで停止すること', () => {
      // Arrange
      const bullet = createBullet({ x: 5, y: 10, dx: 0, dy: -1, pierce: false });
      const grid = createGrid(WIDTH, HEIGHT);
      grid[10][5] = 'red'; // 現在位置
      grid[9][5] = 'blue'; // 移動先

      // Act
      const result = GameLogic.processBullets([bullet], [], grid, WIDTH, HEIGHT, noop);

      // Assert
      expect(result.score).toBe(CONFIG.score.block);
      expect(result.hitCount).toBe(1);
      expect(result.grid[10][5]).toBeNull();
      expect(result.grid[9][5]).toBe('blue'); // 移動先は残る
    });
  });

  describe('パワーアップ', () => {
    test('パワーアップ付きブロック破壊でコールバックが呼ばれること', () => {
      // Arrange
      const onPowerUp = jest.fn();
      const block = createBlock({
        id: 'b1',
        x: 5,
        y: 9,
        shape: [[1]],
        power: 'triple',
      });
      const bullet = createBullet({ x: 5, y: 10, dx: 0, dy: -1 });
      const grid = createGrid(WIDTH, HEIGHT);

      // Act
      GameLogic.processBullets([bullet], [block], grid, WIDTH, HEIGHT, onPowerUp);

      // Assert
      expect(onPowerUp).toHaveBeenCalledWith('triple', 5, 9);
    });

    test('爆弾パワーアップで pendingBombs に追加されること', () => {
      // Arrange
      const block = createBlock({
        id: 'b1',
        x: 5,
        y: 9,
        shape: [[1]],
        power: 'bomb',
      });
      const bullet = createBullet({ x: 5, y: 10, dx: 0, dy: -1 });
      const grid = createGrid(WIDTH, HEIGHT);

      // Act
      const result = GameLogic.processBullets([bullet], [block], grid, WIDTH, HEIGHT, noop);

      // Assert
      expect(result.pendingBombs).toEqual([{ x: 5, y: 9 }]);
    });
  });

  describe('複数弾丸の処理', () => {
    test('複数の弾丸が同時に処理されること', () => {
      // Arrange
      const bullet1 = createBullet({ id: 'b1', x: 3, y: 10, dx: 0, dy: -1 });
      const bullet2 = createBullet({ id: 'b2', x: 7, y: 10, dx: 0, dy: -1 });
      const grid = createGrid(WIDTH, HEIGHT);

      // Act
      const result = GameLogic.processBullets([bullet1, bullet2], [], grid, WIDTH, HEIGHT, noop);

      // Assert
      expect(result.bullets.length).toBe(2);
    });
  });
});
