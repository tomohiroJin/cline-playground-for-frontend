import { createMap } from '../map';
import { TileType } from '../types';

describe('map', () => {
  describe('createMap', () => {
    test('固定マップが正しく生成されること', () => {
      const map = createMap();
      expect(map).toBeDefined();
      expect(map.length).toBeGreaterThan(0);
      expect(map[0].length).toBeGreaterThan(0);
    });

    test('マップにスタート地点が1つ含まれること', () => {
      const map = createMap();
      let startCount = 0;
      for (const row of map) {
        for (const tile of row) {
          if (tile === TileType.START) startCount++;
        }
      }
      expect(startCount).toBe(1);
    });

    test('マップにゴール地点が1つ含まれること', () => {
      const map = createMap();
      let goalCount = 0;
      for (const row of map) {
        for (const tile of row) {
          if (tile === TileType.GOAL) goalCount++;
        }
      }
      expect(goalCount).toBe(1);
    });

    test('マップの外周が壁で囲まれていること', () => {
      const map = createMap();
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
