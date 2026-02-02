/**
 * ギミック配置モジュール
 * 罠と特殊壁をマップに配置する
 */
import { Position, Room, Trap, Wall, TrapTypeValue, TrapType, WallType, GameMap, TileType } from './types';
import { createTrap } from './trap';
import { createWall } from './wall';

/** ギミック配置設定 */
export interface GimmickPlacementConfig {
  /** 配置する罠の数 */
  trapCount: number;
  /** 罠種類の比率 */
  trapRatio: {
    damage: number;
    slow: number;
    alert: number;
  };
  /** 配置する特殊壁の数 */
  wallCount: number;
  /** 壁種類の比率 */
  wallRatio: {
    breakable: number;
    passable: number;
    invisible: number;
  };
}

/** デフォルト設定 */
export const DEFAULT_GIMMICK_CONFIG: GimmickPlacementConfig = {
  trapCount: 10,
  trapRatio: {
    damage: 0.4,
    slow: 0.3,
    alert: 0.3,
  },
  wallCount: 6,
  wallRatio: {
    breakable: 0.5,
    passable: 0.3,
    invisible: 0.2,
  },
};

/** ギミック配置結果 */
export interface GimmickPlacementResult {
  traps: Trap[];
  walls: Wall[];
}

/**
 * 配列をシャッフル
 */
const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 部屋からタイル座標を収集
 */
const collectRoomTiles = (rooms: Room[]): Position[] => {
  const tiles: Position[] = [];
  for (const room of rooms) {
    if (room.tiles) {
      tiles.push(...room.tiles);
    }
  }
  return tiles;
};

/**
 * 通路のタイル座標を収集（部屋以外の床タイル）
 */
const collectCorridorTiles = (grid: GameMap, rooms: Room[]): Position[] => {
  const roomTileSet = new Set<string>();
  for (const room of rooms) {
    if (room.tiles) {
      for (const tile of room.tiles) {
        roomTileSet.add(`${tile.x},${tile.y}`);
      }
    }
  }

  const corridorTiles: Position[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] === TileType.FLOOR && !roomTileSet.has(`${x},${y}`)) {
        corridorTiles.push({ x, y });
      }
    }
  }
  return corridorTiles;
};

/**
 * 壁に隣接しているタイルを収集
 */
const collectWallAdjacentTiles = (grid: GameMap): Position[] => {
  const tiles: Position[] = [];
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[y][x] === TileType.WALL) {
        // 上下左右に床があるか確認
        const hasFloorAdjacent =
          grid[y - 1]?.[x] === TileType.FLOOR ||
          grid[y + 1]?.[x] === TileType.FLOOR ||
          grid[y]?.[x - 1] === TileType.FLOOR ||
          grid[y]?.[x + 1] === TileType.FLOOR;
        if (hasFloorAdjacent) {
          tiles.push({ x, y });
        }
      }
    }
  }
  return tiles;
};

/**
 * 比率に基づいて罠種類を選択
 */
const selectTrapType = (ratio: GimmickPlacementConfig['trapRatio']): TrapTypeValue => {
  const rand = Math.random();
  if (rand < ratio.damage) {
    return TrapType.DAMAGE;
  } else if (rand < ratio.damage + ratio.slow) {
    return TrapType.SLOW;
  } else {
    return TrapType.ALERT;
  }
};

/**
 * 比率に基づいて壁種類を選択
 */
const selectWallType = (ratio: GimmickPlacementConfig['wallRatio']) => {
  const rand = Math.random();
  if (rand < ratio.breakable) {
    return WallType.BREAKABLE;
  } else if (rand < ratio.breakable + ratio.passable) {
    return WallType.PASSABLE;
  } else {
    return WallType.INVISIBLE;
  }
};

/**
 * 罠を配置
 */
export const placeTrap = (
  rooms: Room[],
  grid: GameMap,
  excluded: Position[],
  config: GimmickPlacementConfig = DEFAULT_GIMMICK_CONFIG
): Trap[] => {
  const traps: Trap[] = [];
  const usedPositions = new Set<string>(excluded.map(p => `${p.x},${p.y}`));

  // 通路タイルを優先（通路に罠を仕掛ける）
  const corridorTiles = shuffle(collectCorridorTiles(grid, rooms));
  const roomTiles = shuffle(collectRoomTiles(rooms));
  const candidateTiles = [...corridorTiles, ...roomTiles];

  for (const tile of candidateTiles) {
    if (traps.length >= config.trapCount) break;

    const key = `${tile.x},${tile.y}`;
    if (usedPositions.has(key)) continue;

    const trapType = selectTrapType(config.trapRatio);
    const trap = createTrap(trapType, tile.x, tile.y);
    traps.push(trap);
    usedPositions.add(key);
  }

  return traps;
};

/**
 * 特殊壁を配置
 */
export const placeWalls = (
  grid: GameMap,
  excluded: Position[],
  config: GimmickPlacementConfig = DEFAULT_GIMMICK_CONFIG
): Wall[] => {
  const walls: Wall[] = [];
  const usedPositions = new Set<string>(excluded.map(p => `${p.x},${p.y}`));

  // 壁に隣接しているタイルを候補とする
  const wallAdjacentTiles = shuffle(collectWallAdjacentTiles(grid));

  for (const tile of wallAdjacentTiles) {
    if (walls.length >= config.wallCount) break;

    const key = `${tile.x},${tile.y}`;
    if (usedPositions.has(key)) continue;

    const wallType = selectWallType(config.wallRatio);
    const wall = createWall(wallType, tile.x, tile.y);
    walls.push(wall);
    usedPositions.add(key);
  }

  return walls;
};

/**
 * ギミック（罠・特殊壁）を配置
 */
export const placeGimmicks = (
  rooms: Room[],
  grid: GameMap,
  excluded: Position[],
  config: GimmickPlacementConfig = DEFAULT_GIMMICK_CONFIG
): GimmickPlacementResult => {
  const traps = placeTrap(rooms, grid, excluded, config);
  const trapPositions = traps.map(t => ({ x: t.x, y: t.y }));
  const walls = placeWalls(grid, [...excluded, ...trapPositions], config);

  return { traps, walls };
};
