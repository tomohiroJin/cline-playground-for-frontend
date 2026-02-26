import { GameLogic } from '../game-logic';
import { Grid } from '../grid';
import { Block } from '../block';
import type { BlockData, BulletData } from '../types';
import { CONFIG } from '../constants';

describe('GameLogic', () => {
  const makeBlock = (overrides: Partial<BlockData> = {}): BlockData => ({
    id: 'test-block',
    x: 0,
    y: 0,
    shape: [[1]],
    color: '#FF0000',
    power: null,
    ...overrides,
  });

  describe('calculatePlayerY', () => {
    test('空グリッドではdangerLineを返すこと', () => {
      const grid = Grid.create(12, 18);
      expect(GameLogic.calculatePlayerY(grid)).toBe(17);
    });

    test('ブロックがある場合はその上の位置を返すこと', () => {
      const grid = Grid.create(12, 18);
      grid[10][5] = 'red';
      expect(GameLogic.calculatePlayerY(grid)).toBe(9);
    });
  });

  describe('isGameOver', () => {
    test('空グリッドではfalseを返すこと', () => {
      const grid = Grid.create(12, 18);
      expect(GameLogic.isGameOver(grid)).toBe(false);
    });

    test('dangerLine以下にブロックがある場合trueを返すこと', () => {
      const grid = Grid.create(12, 18);
      grid[1][5] = 'red';
      expect(GameLogic.isGameOver(grid)).toBe(true);
    });
  });

  describe('canSpawnBlock', () => {
    test('ブロックが少ない場合trueを返すこと', () => {
      expect(GameLogic.canSpawnBlock([])).toBe(true);
    });

    test('上部に3つ以上のブロックがある場合falseを返すこと', () => {
      const blocks = [
        makeBlock({ id: 'b1', x: 0, y: 0 }),
        makeBlock({ id: 'b2', x: 2, y: 1 }),
        makeBlock({ id: 'b3', x: 4, y: 0 }),
      ];
      expect(GameLogic.canSpawnBlock(blocks)).toBe(false);
    });
  });

  describe('applyBlastAll', () => {
    test('全ブロックを消去してスコアを返すこと', () => {
      const blocks = [
        makeBlock({ id: 'b1', shape: [[1, 1]] }),
        makeBlock({ id: 'b2', shape: [[1]] }),
      ];
      const result = GameLogic.applyBlastAll(blocks);
      expect(result.blocks).toEqual([]);
      expect(result.score).toBe(30); // 3 cells * 10 points
    });
  });

  describe('applyClearBottom', () => {
    test('最下行にブロックがある場合消去すること', () => {
      const grid = Grid.create(3, 3);
      grid[2][0] = 'red';
      grid[2][1] = 'red';
      const result = GameLogic.applyClearBottom(grid);
      expect(result.cleared).toBe(true);
      expect(result.score).toBe(20); // 2 cells * 10
    });

    test('最下行が空の場合何もしないこと', () => {
      const grid = Grid.create(3, 3);
      const result = GameLogic.applyClearBottom(grid);
      expect(result.cleared).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('processBlockFalling', () => {
    test('ブロックを1行下に移動させること', () => {
      const grid = Grid.create(5, 10);
      const block = makeBlock({ x: 1, y: 3 });
      const { falling, landing } = GameLogic.processBlockFalling([block], grid, 10);
      expect(falling.length).toBe(1);
      expect(falling[0].y).toBe(4);
      expect(landing.length).toBe(0);
    });

    test('底に到達したブロックはlandingに入ること', () => {
      const grid = Grid.create(5, 5);
      const block = makeBlock({ x: 0, y: 4 });
      const { falling, landing } = GameLogic.processBlockFalling([block], grid, 5);
      expect(landing.length).toBe(1);
      expect(falling.length).toBe(0);
    });
  });

  describe('getSpawnInterval / getFallSpeed', () => {
    test('初期値を返すこと', () => {
      expect(GameLogic.getSpawnInterval(0, 0)).toBe(CONFIG.timing.spawn.base);
      expect(GameLogic.getFallSpeed(0, 0, false)).toBe(CONFIG.timing.fall.base);
    });

    test('slowモードで倍速になること', () => {
      const normal = GameLogic.getFallSpeed(0, 0, false);
      const slow = GameLogic.getFallSpeed(0, 0, true);
      expect(slow).toBe(normal * 2);
    });

    test('spawnMultiplierでスポーン間隔が変化すること', () => {
      const base = GameLogic.getSpawnInterval(0, 0);
      expect(GameLogic.getSpawnInterval(0, 0, 1.5)).toBe(base * 1.5);
      expect(GameLogic.getSpawnInterval(0, 0, 0.7)).toBeCloseTo(base * 0.7);
    });

    test('fallMultiplierで落下速度が変化すること', () => {
      const base = GameLogic.getFallSpeed(0, 0, false);
      expect(GameLogic.getFallSpeed(0, 0, false, 1.3)).toBeCloseTo(base * 1.3);
      expect(GameLogic.getFallSpeed(0, 0, false, 0.8)).toBeCloseTo(base * 0.8);
    });

    test('slowモードとfallMultiplierが同時に適用されること', () => {
      const base = GameLogic.getFallSpeed(0, 0, false);
      const multiplier = 1.3;
      expect(GameLogic.getFallSpeed(0, 0, true, multiplier)).toBeCloseTo(base * 2 * multiplier);
    });

    test('倍率省略時はデフォルト値1.0が適用されること', () => {
      const withDefault = GameLogic.getSpawnInterval(5, 1);
      const withExplicit = GameLogic.getSpawnInterval(5, 1, 1.0);
      expect(withDefault).toBe(withExplicit);

      const fallDefault = GameLogic.getFallSpeed(5, 1, false);
      const fallExplicit = GameLogic.getFallSpeed(5, 1, false, 1.0);
      expect(fallDefault).toBe(fallExplicit);
    });
  });

  describe('applyLaserColumn', () => {
    test('指定列のグリッドとブロックを消去すること', () => {
      const grid = Grid.create(5, 5);
      grid[3][2] = 'red';
      grid[4][2] = 'blue';
      const block = makeBlock({ id: 'b1', x: 2, y: 1, shape: [[1]] });
      const result = GameLogic.applyLaserColumn(2, [block], grid);
      expect(result.grid[3][2]).toBeNull();
      expect(result.grid[4][2]).toBeNull();
      expect(result.score).toBeGreaterThan(0);
    });
  });
});
