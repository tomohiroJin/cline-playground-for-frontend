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
 * 壁に隣接しているタイルを収集（片側以上に床がある壁タイル）
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
 * ショートカット候補位置を収集（両側に床がある壁タイル）
 * 壊した時に両側の通路が繋がる位置
 */
const collectShortcutWallPositions = (grid: GameMap): Position[] => {
  const tiles: Position[] = [];
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[y][x] === TileType.WALL) {
        // 上下両方に床がある（縦のショートカット候補）
        const verticalShortcut =
          grid[y - 1]?.[x] === TileType.FLOOR &&
          grid[y + 1]?.[x] === TileType.FLOOR;
        // 左右両方に床がある（横のショートカット候補）
        const horizontalShortcut =
          grid[y]?.[x - 1] === TileType.FLOOR &&
          grid[y]?.[x + 1] === TileType.FLOOR;

        if (verticalShortcut || horizontalShortcut) {
          tiles.push({ x, y });
        }
      }
    }
  }
  return tiles;
};

/** 連続した壁セグメント */
interface WallSegment {
  tiles: Position[];
  direction: 'horizontal' | 'vertical';
}

/**
 * 連続した壁セグメントを検出
 * 複数タイルにわたる壁をグループ化して長いショートカットを作成可能にする
 */
const collectContinuousWallSegments = (grid: GameMap, minLength: number = 2): WallSegment[] => {
  const segments: WallSegment[] = [];
  const visited = new Set<string>();

  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (visited.has(`${x},${y}`) || grid[y][x] !== TileType.WALL) continue;

      // 横方向に連続する壁セグメントを検出（上下に床がある場合）
      const hTiles: Position[] = [];
      let hx = x;
      while (
        hx < grid[0].length - 1 &&
        grid[y][hx] === TileType.WALL &&
        grid[y - 1]?.[hx] === TileType.FLOOR &&
        grid[y + 1]?.[hx] === TileType.FLOOR
      ) {
        hTiles.push({ x: hx, y });
        hx++;
      }
      if (hTiles.length >= minLength) {
        segments.push({ tiles: hTiles, direction: 'horizontal' });
        hTiles.forEach(t => visited.add(`${t.x},${t.y}`));
        continue;
      }

      // 縦方向に連続する壁セグメントを検出（左右に床がある場合）
      const vTiles: Position[] = [];
      let vy = y;
      while (
        vy < grid.length - 1 &&
        grid[vy][x] === TileType.WALL &&
        grid[vy]?.[x - 1] === TileType.FLOOR &&
        grid[vy]?.[x + 1] === TileType.FLOOR
      ) {
        vTiles.push({ x, y: vy });
        vy++;
      }
      if (vTiles.length >= minLength) {
        segments.push({ tiles: vTiles, direction: 'vertical' });
        vTiles.forEach(t => visited.add(`${t.x},${t.y}`));
      }
    }
  }

  return segments;
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
 * - 破壊可能壁は連続壁セグメント（長いショートカット）を優先配置
 * - すり抜け壁はショートカット位置に配置
 * - 透明壁は通常の壁隣接位置（障害物として機能）に配置
 */
export const placeWalls = (
  grid: GameMap,
  excluded: Position[],
  config: GimmickPlacementConfig = DEFAULT_GIMMICK_CONFIG
): Wall[] => {
  const walls: Wall[] = [];
  const usedPositions = new Set<string>(excluded.map(p => `${p.x},${p.y}`));

  // 連続壁セグメントを優先的に収集（長いショートカット用）
  const segments = shuffle(collectContinuousWallSegments(grid, 2));
  // ショートカット位置を収集（両側に床がある壁）
  const shortcutPositions = shuffle(collectShortcutWallPositions(grid));
  // 通常の壁隣接位置（フォールバック用）
  const adjacentPositions = shuffle(collectWallAdjacentTiles(grid));

  // 各タイプの目標数を計算（連続配置により実効的な壁数が増えるため調整）
  const breakableCount = Math.ceil(config.wallCount * config.wallRatio.breakable);
  const passableCount = Math.ceil(config.wallCount * config.wallRatio.passable);
  const invisibleCount = Math.max(0, config.wallCount - breakableCount - passableCount);

  // 配置済み数をカウント
  let placedBreakable = 0;
  let placedPassable = 0;

  // 1. BREAKABLE壁を連続セグメントに優先配置（長いショートカット）
  for (const segment of segments) {
    if (placedBreakable >= breakableCount) break;

    // セグメント全体が使用可能かチェック
    const allAvailable = segment.tiles.every(t => !usedPositions.has(`${t.x},${t.y}`));
    if (!allAvailable) continue;

    // セグメント内のすべてのタイルにBREAKABLE壁を配置
    for (const tile of segment.tiles) {
      const key = `${tile.x},${tile.y}`;
      walls.push(createWall(WallType.BREAKABLE, tile.x, tile.y));
      usedPositions.add(key);
    }
    placedBreakable++;
  }

  // 2. 残りのBREAKABLE壁を単一ショートカット位置に配置
  for (const pos of shortcutPositions) {
    if (placedBreakable >= breakableCount) break;
    const key = `${pos.x},${pos.y}`;
    if (usedPositions.has(key)) continue;
    walls.push(createWall(WallType.BREAKABLE, pos.x, pos.y));
    usedPositions.add(key);
    placedBreakable++;
  }

  // 3. PASSABLE壁をショートカット位置に配置
  for (const pos of shortcutPositions) {
    if (placedPassable >= passableCount) break;
    const key = `${pos.x},${pos.y}`;
    if (usedPositions.has(key)) continue;
    walls.push(createWall(WallType.PASSABLE, pos.x, pos.y));
    usedPositions.add(key);
    placedPassable++;
  }

  // 4. INVISIBLE壁を通常位置に配置（行き止まりや障害物用）
  let placedInvisible = 0;
  for (const pos of adjacentPositions) {
    if (placedInvisible >= invisibleCount) break;
    const key = `${pos.x},${pos.y}`;
    if (usedPositions.has(key)) continue;
    walls.push(createWall(WallType.INVISIBLE, pos.x, pos.y));
    usedPositions.add(key);
    placedInvisible++;
  }

  // フォールバック: ショートカット位置が不足した場合、通常位置に配置
  for (const pos of adjacentPositions) {
    if (placedBreakable >= breakableCount) break;
    const key = `${pos.x},${pos.y}`;
    if (usedPositions.has(key)) continue;
    walls.push(createWall(WallType.BREAKABLE, pos.x, pos.y));
    usedPositions.add(key);
    placedBreakable++;
  }

  for (const pos of adjacentPositions) {
    if (placedPassable >= passableCount) break;
    const key = `${pos.x},${pos.y}`;
    if (usedPositions.has(key)) continue;
    walls.push(createWall(WallType.PASSABLE, pos.x, pos.y));
    usedPositions.add(key);
    placedPassable++;
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
