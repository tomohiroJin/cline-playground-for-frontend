import { createMap, createMapWithRooms, getMapWidth, getMapHeight } from '../domain/services/mapService';
import { GameMap, TileType } from '../types';
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

    test('カスタム設定でマップを生成できること', () => {
      // Arrange
      rng.reset();
      const config = {
        width: 20,
        height: 20,
        minRoomSize: 4,
        maxRoomSize: 6,
        corridorWidth: 2,
        maxDepth: 3,
        loopCount: 1,
      };

      // Act
      const map = createMap(config, rng);

      // Assert
      expect(map.length).toBe(20);
      expect(map[0].length).toBe(20);
    });
  });

  describe('createMapWithRooms', () => {
    test('マップと部屋の情報を返すこと', () => {
      // Arrange
      rng.reset();

      // Act
      const result = createMapWithRooms(undefined, rng);

      // Assert
      expect(result.map).toBeDefined();
      expect(result.rooms).toBeDefined();
      expect(result.rooms.length).toBeGreaterThan(0);
    });

    test('各部屋にcenterとtiles情報が含まれること', () => {
      // Arrange
      rng.reset();

      // Act
      const { rooms } = createMapWithRooms(undefined, rng);

      // Assert
      for (const room of rooms) {
        expect(room.center).toBeDefined();
        expect(room.center.x).toBeGreaterThanOrEqual(0);
        expect(room.center.y).toBeGreaterThanOrEqual(0);
        expect(room.tiles?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getMapWidth', () => {
    test('マップの幅を返すこと', () => {
      // Arrange
      rng.reset();
      const map = createMap(undefined, rng);

      // Act
      const width = getMapWidth(map);

      // Assert
      expect(width).toBe(map[0].length);
    });

    test('空のマップでは0を返すこと', () => {
      // Arrange
      const emptyMap: GameMap = [];

      // Act
      const width = getMapWidth(emptyMap);

      // Assert
      expect(width).toBe(0);
    });
  });

  describe('getMapHeight', () => {
    test('マップの高さを返すこと', () => {
      // Arrange
      rng.reset();
      const map = createMap(undefined, rng);

      // Act
      const height = getMapHeight(map);

      // Assert
      expect(height).toBe(map.length);
    });

    test('空のマップでは0を返すこと', () => {
      // Arrange
      const emptyMap: GameMap = [];

      // Act
      const height = getMapHeight(emptyMap);

      // Assert
      expect(height).toBe(0);
    });
  });
});
