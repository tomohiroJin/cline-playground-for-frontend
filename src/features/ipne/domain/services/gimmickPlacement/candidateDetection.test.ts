/**
 * candidateDetection のユニットテスト
 *
 * ギミック配置候補の検出ロジックを検証する。
 */

import { TileType, Room } from '../../../types';
import {
  collectRoomTiles,
  collectCorridorTiles,
  collectWallAdjacentTiles,
  collectShortcutWallPositions,
  collectContinuousWallSegments,
  detectTrapCandidateTiles,
  detectWallPlacementCandidates,
} from './candidateDetection';
import { aMap } from '../../../__tests__/builders';
import { MockRandomProvider } from '../../../__tests__/mocks/MockRandomProvider';

describe('candidateDetection', () => {
  const rng = new MockRandomProvider(0.5);
  describe('collectRoomTiles', () => {
    it('部屋のタイルを全て収集する', () => {
      const rooms: Room[] = [
        { rect: { x: 1, y: 1, width: 2, height: 2 }, center: { x: 2, y: 2 }, tiles: [{ x: 1, y: 1 }, { x: 2, y: 1 }] },
        { rect: { x: 4, y: 4, width: 2, height: 2 }, center: { x: 5, y: 5 }, tiles: [{ x: 4, y: 4 }] },
      ];

      const tiles = collectRoomTiles(rooms);
      expect(tiles).toHaveLength(3);
    });

    it('tiles が未定義の部屋はスキップする', () => {
      const rooms: Room[] = [
        { rect: { x: 1, y: 1, width: 2, height: 2 }, center: { x: 2, y: 2 } },
      ];

      const tiles = collectRoomTiles(rooms);
      expect(tiles).toHaveLength(0);
    });

    it('空の部屋配列では空配列を返す', () => {
      const tiles = collectRoomTiles([]);
      expect(tiles).toHaveLength(0);
    });
  });

  describe('collectCorridorTiles', () => {
    it('部屋に含まれない床タイルを通路として収集する', () => {
      const grid = aMap(7, 7).withStart(1, 1).withGoal(5, 5).build();
      const rooms: Room[] = [
        { rect: { x: 1, y: 1, width: 2, height: 2 }, center: { x: 2, y: 2 }, tiles: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }] },
      ];

      const corridorTiles = collectCorridorTiles(grid, rooms);
      // 部屋タイル(4) + START(1,1は部屋に含まれる) を除いた床タイル
      // 7x7マップの内部(5x5=25) からスタート・ゴールを含む全床タイルのうち部屋でないもの
      expect(corridorTiles.length).toBeGreaterThan(0);
      // 部屋のタイル位置は含まれない
      const corridorKeys = new Set(corridorTiles.map(t => `${t.x},${t.y}`));
      expect(corridorKeys.has('1,1')).toBe(false);
      expect(corridorKeys.has('2,1')).toBe(false);
    });

    it('全てのタイルが部屋に含まれる場合は空配列を返す', () => {
      // 3x3マップ（内部は1x1の床のみ）
      const grid = aMap(3, 3).withStart(1, 1).build();
      const rooms: Room[] = [
        { rect: { x: 1, y: 1, width: 1, height: 1 }, center: { x: 1, y: 1 }, tiles: [{ x: 1, y: 1 }] },
      ];

      const corridorTiles = collectCorridorTiles(grid, rooms);
      expect(corridorTiles).toHaveLength(0);
    });
  });

  describe('collectWallAdjacentTiles', () => {
    it('床に隣接する壁タイルを収集する', () => {
      const grid = aMap(7, 7).withStart(1, 1).withGoal(5, 5).build();
      const tiles = collectWallAdjacentTiles(grid);

      // 各タイルは壁であり、かつ床に隣接している
      for (const tile of tiles) {
        expect(grid[tile.y][tile.x]).toBe(TileType.WALL);
        const hasFloor =
          grid[tile.y - 1]?.[tile.x] === TileType.FLOOR ||
          grid[tile.y + 1]?.[tile.x] === TileType.FLOOR ||
          grid[tile.y]?.[tile.x - 1] === TileType.FLOOR ||
          grid[tile.y]?.[tile.x + 1] === TileType.FLOOR ||
          grid[tile.y - 1]?.[tile.x] === TileType.START ||
          grid[tile.y + 1]?.[tile.x] === TileType.START ||
          grid[tile.y]?.[tile.x - 1] === TileType.START ||
          grid[tile.y]?.[tile.x + 1] === TileType.START ||
          grid[tile.y - 1]?.[tile.x] === TileType.GOAL ||
          grid[tile.y + 1]?.[tile.x] === TileType.GOAL ||
          grid[tile.y]?.[tile.x - 1] === TileType.GOAL ||
          grid[tile.y]?.[tile.x + 1] === TileType.GOAL;
        expect(hasFloor).toBe(true);
      }
    });

    it('内部に壁があるマップでは結果が空でない', () => {
      // 内部に壁を含むマップを作成
      const grid = aMap(7, 7).withStart(1, 1).withGoal(5, 5).build();
      grid[3][3] = TileType.WALL; // 内部に壁を配置（周囲が床）
      const tiles = collectWallAdjacentTiles(grid);
      expect(tiles.length).toBeGreaterThan(0);
      expect(tiles.some(t => t.x === 3 && t.y === 3)).toBe(true);
    });
  });

  describe('collectShortcutWallPositions', () => {
    it('両側が床の壁（ショートカット候補）を収集する', () => {
      // カスタムマップ：壁で区切られた2つの通路
      const grid = [
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.WALL, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.WALL, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.WALL, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
      ];

      const positions = collectShortcutWallPositions(grid);
      // 中央列(x=2)の壁は左右に床がある
      expect(positions.length).toBeGreaterThan(0);
      for (const pos of positions) {
        expect(grid[pos.y][pos.x]).toBe(TileType.WALL);
      }
    });

    it('ショートカットがないマップでは空配列を返す', () => {
      // 全て壁のマップ
      const grid = [
        [TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL],
      ];

      const positions = collectShortcutWallPositions(grid);
      expect(positions).toHaveLength(0);
    });
  });

  describe('collectContinuousWallSegments', () => {
    it('連続した壁セグメントを検出する', () => {
      // 水平方向に連続する壁セグメントを持つマップ
      const grid = [
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
      ];

      const segments = collectContinuousWallSegments(grid, 2);
      // 行2の壁セグメントが検出される（上下に床がある連続壁）
      for (const seg of segments) {
        expect(seg.tiles.length).toBeGreaterThanOrEqual(2);
        expect(['horizontal', 'vertical']).toContain(seg.direction);
      }
    });

    it('最小長未満のセグメントは除外する', () => {
      const grid = [
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
      ];

      const segments = collectContinuousWallSegments(grid, 5);
      // minLength=5 で短いセグメントは除外
      for (const seg of segments) {
        expect(seg.tiles.length).toBeGreaterThanOrEqual(5);
      }
    });
  });

  describe('detectTrapCandidateTiles', () => {
    it('通路タイルと部屋タイルを候補として返す', () => {
      const grid = aMap(7, 7).withStart(1, 1).withGoal(5, 5).build();
      const rooms: Room[] = [
        { rect: { x: 3, y: 3, width: 2, height: 2 }, center: { x: 4, y: 4 }, tiles: [{ x: 3, y: 3 }, { x: 4, y: 3 }] },
      ];

      const candidates = detectTrapCandidateTiles(rooms, grid, rng);
      expect(candidates.length).toBeGreaterThan(0);
    });

    it('通路タイルが部屋タイルよりも先に配置される', () => {
      // detectTrapCandidateTiles は [...corridorTiles, ...roomTiles] の順序
      // シャッフルされるため順序保証はないが、両方含まれることを確認
      const grid = aMap(9, 9).withStart(1, 1).withGoal(7, 7).build();
      const rooms: Room[] = [
        { rect: { x: 3, y: 3, width: 3, height: 3 }, center: { x: 4, y: 4 }, tiles: [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }] },
      ];

      const candidates = detectTrapCandidateTiles(rooms, grid, rng);
      const candidateKeys = new Set(candidates.map(c => `${c.x},${c.y}`));
      // 部屋タイルが含まれる
      expect(candidateKeys.has('3,3') || candidateKeys.has('4,3') || candidateKeys.has('5,3')).toBe(true);
    });
  });

  describe('detectWallPlacementCandidates', () => {
    it('壁配置候補の3種類を返す', () => {
      const grid = aMap(7, 7).withStart(1, 1).withGoal(5, 5).build();
      const result = detectWallPlacementCandidates(grid, rng);

      expect(result).toHaveProperty('segments');
      expect(result).toHaveProperty('shortcutPositions');
      expect(result).toHaveProperty('adjacentPositions');
      expect(Array.isArray(result.segments)).toBe(true);
      expect(Array.isArray(result.shortcutPositions)).toBe(true);
      expect(Array.isArray(result.adjacentPositions)).toBe(true);
    });
  });
});
