/**
 * ギミック配置のテスト
 */
import {
  placeTrap,
  placeWalls,
  placeGimmicks,
  DEFAULT_GIMMICK_CONFIG,
} from '../gimmickPlacement';
import { TileType, Room, TrapType, WallType } from '../types';
import { resetTrapIdCounter } from '../trap';

/**
 * テスト用のマップとルームを作成
 */
const createTestMazeResult = () => {
  // 10x10のグリッドを作成
  const grid = Array.from({ length: 10 }, () =>
    Array(10).fill(TileType.WALL)
  );

  // 部屋を2つ作成
  const room1: Room = {
    rect: { x: 1, y: 1, width: 3, height: 3 },
    center: { x: 2, y: 2 },
    tiles: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
      { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 },
    ],
  };

  const room2: Room = {
    rect: { x: 6, y: 6, width: 3, height: 3 },
    center: { x: 7, y: 7 },
    tiles: [
      { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 },
      { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 },
      { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 },
    ],
  };

  // 部屋を描画
  for (const tile of room1.tiles!) {
    grid[tile.y][tile.x] = TileType.FLOOR;
  }
  for (const tile of room2.tiles!) {
    grid[tile.y][tile.x] = TileType.FLOOR;
  }

  // 通路を追加（部屋1と部屋2を接続）
  for (let x = 4; x <= 5; x++) {
    grid[2][x] = TileType.FLOOR;
  }
  for (let y = 2; y <= 7; y++) {
    grid[y][5] = TileType.FLOOR;
  }

  return { grid, rooms: [room1, room2] };
};

describe('gimmickPlacement', () => {
  beforeEach(() => {
    resetTrapIdCounter();
  });

  describe('placeTrap', () => {
    test('指定数の罠が配置されること', () => {
      const { grid, rooms } = createTestMazeResult();
      const config = { ...DEFAULT_GIMMICK_CONFIG, trapCount: 5 };
      const traps = placeTrap(rooms, grid, [], config);
      expect(traps.length).toBe(5);
    });

    test('除外位置には罠が配置されないこと', () => {
      const { grid, rooms } = createTestMazeResult();
      const excluded = [{ x: 2, y: 2 }, { x: 5, y: 5 }];
      const traps = placeTrap(rooms, grid, excluded, DEFAULT_GIMMICK_CONFIG);

      for (const trap of traps) {
        expect(excluded.some(e => e.x === trap.x && e.y === trap.y)).toBe(false);
      }
    });

    test('罠IDが一意であること', () => {
      const { grid, rooms } = createTestMazeResult();
      const config = { ...DEFAULT_GIMMICK_CONFIG, trapCount: 3 };
      const traps = placeTrap(rooms, grid, [], config);

      const ids = new Set(traps.map(t => t.id));
      expect(ids.size).toBe(traps.length);
    });

    test('罠種類が比率に従って配置されること', () => {
      const { grid, rooms } = createTestMazeResult();
      const config = {
        ...DEFAULT_GIMMICK_CONFIG,
        trapCount: 100,
        trapRatio: { damage: 1.0, slow: 0, alert: 0 },
      };
      const traps = placeTrap(rooms, grid, [], config);

      // 全てダメージ罠であること
      for (const trap of traps) {
        expect(trap.type).toBe(TrapType.DAMAGE);
      }
    });
  });

  describe('placeWalls', () => {
    test('指定数の特殊壁が配置されること', () => {
      const { grid } = createTestMazeResult();
      const config = { ...DEFAULT_GIMMICK_CONFIG, wallCount: 3 };
      const walls = placeWalls(grid, [], config);
      expect(walls.length).toBeLessThanOrEqual(3);
    });

    test('除外位置には壁が配置されないこと', () => {
      const { grid } = createTestMazeResult();
      const excluded = [{ x: 4, y: 2 }, { x: 5, y: 3 }];
      const walls = placeWalls(grid, excluded, DEFAULT_GIMMICK_CONFIG);

      for (const wall of walls) {
        expect(excluded.some(e => e.x === wall.x && e.y === wall.y)).toBe(false);
      }
    });

    test('壁種類が比率に従って配置されること', () => {
      const { grid } = createTestMazeResult();
      const config = {
        ...DEFAULT_GIMMICK_CONFIG,
        wallCount: 50,
        wallRatio: { breakable: 1.0, passable: 0, invisible: 0 },
      };
      const walls = placeWalls(grid, [], config);

      // 配置された壁は全て破壊可能壁であること
      for (const wall of walls) {
        expect(wall.type).toBe(WallType.BREAKABLE);
      }
    });
  });

  describe('placeGimmicks', () => {
    test('罠と壁が両方配置されること', () => {
      const { grid, rooms } = createTestMazeResult();
      const config = {
        ...DEFAULT_GIMMICK_CONFIG,
        trapCount: 3,
        wallCount: 2,
      };
      const result = placeGimmicks(rooms, grid, [], config);

      expect(result.traps.length).toBe(3);
      expect(result.walls.length).toBeLessThanOrEqual(2);
    });

    test('罠と壁が同じ位置に配置されないこと', () => {
      const { grid, rooms } = createTestMazeResult();
      const result = placeGimmicks(rooms, grid, [], DEFAULT_GIMMICK_CONFIG);

      const trapPositions = new Set(result.traps.map(t => `${t.x},${t.y}`));
      for (const wall of result.walls) {
        expect(trapPositions.has(`${wall.x},${wall.y}`)).toBe(false);
      }
    });

    test('除外位置には何も配置されないこと', () => {
      const { grid, rooms } = createTestMazeResult();
      const excluded = [{ x: 2, y: 2 }, { x: 7, y: 7 }];
      const result = placeGimmicks(rooms, grid, excluded, DEFAULT_GIMMICK_CONFIG);

      for (const trap of result.traps) {
        expect(excluded.some(e => e.x === trap.x && e.y === trap.y)).toBe(false);
      }
      for (const wall of result.walls) {
        expect(excluded.some(e => e.x === wall.x && e.y === wall.y)).toBe(false);
      }
    });
  });
});
