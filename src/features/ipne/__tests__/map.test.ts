import { createMap } from '../domain/services/mapService';
import { TileType } from '../types';
import { MockRandomProvider } from './mocks/MockRandomProvider';

describe('map', () => {
  const rng = new MockRandomProvider(0.5);

  describe('createMap', () => {
    test('固定マップが正しく生成されること', () => {
      rng.reset();
      const map = createMap(undefined, rng);
      expect(map).toBeDefined();
      expect(map.length).toBeGreaterThan(0);
      expect(map[0].length).toBeGreaterThan(0);
    });

    test('マップにスタート地点が1つ含まれること', () => {
      rng.reset();
      const map = createMap(undefined, rng);
      let startCount = 0;
      for (const row of map) {
        for (const tile of row) {
          if (tile === TileType.START) startCount++;
        }
      }
      expect(startCount).toBe(1);
    });

    test('マップにゴール地点が1つ含まれること', () => {
      rng.reset();
      const map = createMap(undefined, rng);
      let goalCount = 0;
      for (const row of map) {
        for (const tile of row) {
          if (tile === TileType.GOAL) goalCount++;
        }
      }
      expect(goalCount).toBe(1);
    });

    test('マップの外周が壁で囲まれていること', () => {
      rng.reset();
      const map = createMap(undefined, rng);
      const height = map.length;
      const width = map[0].length;

      // 上下の辺
      for (let x = 0; x < width; x++) {
        expect(map[0][x]).toBe(TileType.WALL);
        expect(map[height - 1][x]).toBe(TileType.WALL);
      }

      // 左右の辺
      for (let y = 0; y < height; y++) {
        expect(map[y][0]).toBe(TileType.WALL);
        expect(map[y][width - 1]).toBe(TileType.WALL);
      }
    });
  });
});
