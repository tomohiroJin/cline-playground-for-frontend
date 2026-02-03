/**
 * ギミック配置モジュール
 * 罠と特殊壁をマップに配置する
 */
import { Position, Room, Trap, Wall, TrapTypeValue, TrapType, WallType, GameMap, TileType } from './types';
import { createTrap } from './trap';
import { createWall } from './wall';
import { calculateDistances, findPath, isConnected } from './pathfinder';

/** 戦略的配置パターンの制限数 */
export interface StrategicPatternLimits {
  /** パターン1: 最短経路ブロック（BREAKABLE壁） */
  shortcutBlock: number;
  /** パターン2: 見えない障害物（INVISIBLE壁） */
  trickWall: number;
  /** パターン3: 秘密の近道（PASSABLE壁） */
  secretPassage: number;
  /** パターン4: 通路塞ぎ（INVISIBLE壁） */
  corridorBlock: number;
}

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
  /** 戦略的配置パターンの制限数（オプション） */
  patternLimits?: StrategicPatternLimits;
}

/** デフォルト戦略的配置パターン制限 */
export const DEFAULT_PATTERN_LIMITS: StrategicPatternLimits = {
  shortcutBlock: 2,    // パターン1: 最短経路ブロック
  trickWall: 1,        // パターン2: 見えない障害物
  secretPassage: 2,    // パターン3: 秘密の近道
  corridorBlock: 1,    // パターン4: 通路塞ぎ
};

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
  patternLimits: DEFAULT_PATTERN_LIMITS,
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

/** 貫通ショートカット候補 */
interface PenetrationCandidate {
  wallTiles: Position[];     // 貫通する壁タイル群
  nearFloor: Position;       // 壁の手前の床
  farFloor: Position;        // 壁の奥の床
  thickness: number;         // 壁の厚さ
  saving: number;            // 距離短縮効果
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
 * 床タイルから指定方向に壁を貫通し、反対側の床を探す
 * @param grid マップデータ
 * @param floorPos 開始床タイルの位置
 * @param dx 探索方向のX成分（-1, 0, or 1）
 * @param dy 探索方向のY成分（-1, 0, or 1）
 * @param maxThickness 探索する最大壁厚（デフォルト10）
 * @returns 壁タイル群と反対側の床、見つからなければnull
 */
const findFloorThroughWall = (
  grid: GameMap,
  floorPos: Position,
  dx: number,
  dy: number,
  maxThickness: number = 10
): { wallTiles: Position[]; farFloor: Position } | null => {
  const wallTiles: Position[] = [];
  let currentX = floorPos.x + dx;
  let currentY = floorPos.y + dy;

  // 壁を通過しながら収集
  while (wallTiles.length < maxThickness) {
    // 範囲外チェック
    if (currentY < 0 || currentY >= grid.length || currentX < 0 || currentX >= grid[0].length) {
      return null;
    }

    const tile = grid[currentY][currentX];

    if (tile === TileType.WALL) {
      wallTiles.push({ x: currentX, y: currentY });
      currentX += dx;
      currentY += dy;
    } else if (tile === TileType.FLOOR || tile === TileType.START || tile === TileType.GOAL) {
      // 壁を貫通して床に到達
      if (wallTiles.length > 0) {
        return {
          wallTiles,
          farFloor: { x: currentX, y: currentY },
        };
      }
      // 最初から床だった場合は無効
      return null;
    } else {
      // その他のタイプは壁扱い
      return null;
    }
  }

  // 最大厚さを超えた
  return null;
};

/**
 * 距離マップを使用して貫通ショートカット候補を検出
 * 厚い壁（複数マス幅）でも機能するショートカット検出
 * @param grid マップデータ
 * @param start スタート位置
 * @param goal ゴール位置
 * @param distFromStart スタートからの距離マップ
 * @param distFromGoal ゴールからの距離マップ
 * @param minSaving 最小距離短縮効果（デフォルト3）
 * @returns 貫通ショートカット候補のリスト
 */
const findPenetrationShortcuts = (
  grid: GameMap,
  start: Position,
  goal: Position,
  distFromStart: Map<string, number>,
  distFromGoal: Map<string, number>,
  minSaving: number = 3
): PenetrationCandidate[] => {
  const candidates: PenetrationCandidate[] = [];
  const processedWalls = new Set<string>(); // 重複検出用

  // 4方向の探索
  const directions: Array<{ dx: number; dy: number; dir: 'horizontal' | 'vertical' }> = [
    { dx: 1, dy: 0, dir: 'horizontal' },  // 右
    { dx: -1, dy: 0, dir: 'horizontal' }, // 左
    { dx: 0, dy: 1, dir: 'vertical' },    // 下
    { dx: 0, dy: -1, dir: 'vertical' },   // 上
  ];

  // 全床タイルを走査
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      const tile = grid[y][x];
      // 床タイル（START/GOALも含む）のみ対象
      if (tile !== TileType.FLOOR && tile !== TileType.START && tile !== TileType.GOAL) continue;

      const nearFloor: Position = { x, y };
      const nearKey = `${x},${y}`;
      const nearDistFromStart = distFromStart.get(nearKey);
      const nearDistFromGoal = distFromGoal.get(nearKey);

      // 距離マップにない場合はスキップ（到達不可能）
      if (nearDistFromStart === undefined || nearDistFromGoal === undefined) continue;

      // 4方向に壁貫通を試行
      for (const { dx, dy, dir } of directions) {
        const result = findFloorThroughWall(grid, nearFloor, dx, dy);
        if (!result) continue;

        const { wallTiles, farFloor } = result;

        // 重複チェック（壁タイル群をソートしてキーにする）
        const wallKey = wallTiles
          .map(w => `${w.x},${w.y}`)
          .sort()
          .join('|');
        if (processedWalls.has(wallKey)) continue;
        processedWalls.add(wallKey);

        const farKey = `${farFloor.x},${farFloor.y}`;
        const farDistFromStart = distFromStart.get(farKey);
        const farDistFromGoal = distFromGoal.get(farKey);

        // 反対側の床が到達可能でない場合はスキップ
        if (farDistFromStart === undefined || farDistFromGoal === undefined) continue;

        // 距離短縮効果を計算
        // 現在の最短経路距離（スタート→nearFloor→（迂回）→farFloor→ゴール）
        // vs 貫通後の距離（スタート→nearFloor→壁通過→farFloor→ゴール）
        const thickness = wallTiles.length;

        // nearFloorからfarFloorへ壁を通る場合の距離
        const directPathFromNear = nearDistFromStart + thickness + farDistFromGoal;
        // farFloorからnearFloorへ壁を通る場合の距離
        const directPathFromFar = farDistFromStart + thickness + nearDistFromGoal;

        // 現在の経路距離（迂回経路）
        const currentPathFromNear = nearDistFromStart + nearDistFromGoal;
        const currentPathFromFar = farDistFromStart + farDistFromGoal;

        // 最大の短縮効果を計算
        const saving1 = currentPathFromNear - directPathFromNear;
        const saving2 = currentPathFromFar - directPathFromFar;
        const saving = Math.max(saving1, saving2);

        if (saving >= minSaving) {
          candidates.push({
            wallTiles,
            nearFloor,
            farFloor,
            thickness,
            saving,
            direction: dir,
          });
        }
      }
    }
  }

  // savingが大きい順にソート
  return candidates.sort((a, b) => b.saving - a.saving);
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
 * start/goalが指定された場合は戦略的配置を行う
 */
export const placeGimmicks = (
  rooms: Room[],
  grid: GameMap,
  excluded: Position[],
  config: GimmickPlacementConfig = DEFAULT_GIMMICK_CONFIG,
  start?: Position,
  goal?: Position
): GimmickPlacementResult => {
  const traps = placeTrap(rooms, grid, excluded, config);
  const trapPositions = traps.map(t => ({ x: t.x, y: t.y }));

  // start/goalが指定されている場合は戦略的配置を試みる
  let walls: Wall[];
  if (start && goal) {
    walls = placeStrategicWalls(grid, [...excluded, ...trapPositions], start, goal, config);
  } else {
    walls = placeWalls(grid, [...excluded, ...trapPositions], config);
  }

  return { traps, walls };
};

// ========================
// 戦略的配置のヘルパー関数
// ========================

/** 壁候補とそのスコア */
interface ScoredWallCandidate {
  position: Position;
  score: number;
  type: 'shortcutBlock' | 'trickWall' | 'secretPassage' | 'corridorBlock';
}

/**
 * 経路上に位置するか判定
 */
const isOnPath = (path: Position[], pos: Position): boolean => {
  return path.some(p => p.x === pos.x && p.y === pos.y);
};

/**
 * 経路からの最短距離を計算
 */
export const getDistanceFromPath = (path: Position[], pos: Position): number => {
  if (path.length === 0) return Infinity;
  let minDist = Infinity;
  for (const p of path) {
    const dist = Math.abs(p.x - pos.x) + Math.abs(p.y - pos.y);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  return minDist;
};

/**
 * 壁を壊した時のショートカット効果を計算
 * 壁の両側の距離差が大きいほど高評価
 */
export const calculateShortcutValue = (
  grid: GameMap,
  wallPos: Position,
  start: Position,
  goal: Position
): number => {
  const distancesFromStart = calculateDistances(grid, start);
  const distancesFromGoal = calculateDistances(grid, goal);

  // 壁の上下左右の隣接タイルを取得
  const directions = [
    { x: 0, y: -1 }, // 上
    { x: 0, y: 1 },  // 下
    { x: -1, y: 0 }, // 左
    { x: 1, y: 0 },  // 右
  ];

  const adjacentFloors: { pos: Position; distFromStart: number; distFromGoal: number }[] = [];

  for (const dir of directions) {
    const adjX = wallPos.x + dir.x;
    const adjY = wallPos.y + dir.y;

    // 範囲チェック
    if (adjY < 0 || adjY >= grid.length || adjX < 0 || adjX >= grid[0].length) continue;

    // 床タイルのみ対象
    if (grid[adjY][adjX] !== TileType.FLOOR && grid[adjY][adjX] !== TileType.START && grid[adjY][adjX] !== TileType.GOAL) continue;

    const key = `${adjX},${adjY}`;
    const distFromStart = distancesFromStart.get(key);
    const distFromGoal = distancesFromGoal.get(key);

    if (distFromStart !== undefined && distFromGoal !== undefined) {
      adjacentFloors.push({ pos: { x: adjX, y: adjY }, distFromStart, distFromGoal });
    }
  }

  // 隣接床タイルが2つ以上ない場合はショートカット効果なし
  if (adjacentFloors.length < 2) return 0;

  // 両側の距離差の最大値を計算
  let maxDistanceSaving = 0;

  for (let i = 0; i < adjacentFloors.length; i++) {
    for (let j = i + 1; j < adjacentFloors.length; j++) {
      const a = adjacentFloors[i];
      const b = adjacentFloors[j];

      // 壁を通過した場合の経路短縮効果を計算
      // 例: スタート→A→壁→B→ゴール vs スタート→A→（迂回）→B→ゴール
      const directPath = a.distFromStart + 1 + b.distFromGoal;
      const currentPath = a.distFromStart + a.distFromGoal;

      // 逆方向も考慮
      const directPath2 = b.distFromStart + 1 + a.distFromGoal;
      const currentPath2 = b.distFromStart + b.distFromGoal;

      const saving1 = currentPath - directPath;
      const saving2 = currentPath2 - directPath2;

      maxDistanceSaving = Math.max(maxDistanceSaving, saving1, saving2);
    }
  }

  return maxDistanceSaving;
};

/**
 * 代替経路が存在するか確認
 * 指定した壁位置をブロックしても、スタートからゴールに到達可能か
 */
export const hasAlternativeRoute = (
  grid: GameMap,
  wallPos: Position,
  start: Position,
  goal: Position
): boolean => {
  // 一時的に壁をブロックしたマップを作成
  // ただし、実際にマップを変更せずに計算する

  // 現状の到達可能性を確認
  const currentConnected = isConnected(grid, start, goal);
  if (!currentConnected) return false;

  // 壁位置が床でない場合（通常の壁）、その位置に透明壁を配置しても
  // 到達可能性は変わらない（もともと通れないため）
  if (grid[wallPos.y][wallPos.x] === TileType.WALL) {
    // 通常の壁タイルの両側に床がある場合、壁をブロックした状態で到達確認
    // ただし、これは通常の壁なので基本的に通過不可
    return true;
  }

  // 床タイルの場合（既存の床をブロックする場合）
  // 一時マップを作成
  const tempGrid: GameMap = grid.map(row => [...row]);
  tempGrid[wallPos.y][wallPos.x] = TileType.WALL;

  return isConnected(tempGrid, start, goal);
};

/** 複数壁候補（厚い壁対応） */
interface MultiWallCandidate extends ScoredWallCandidate {
  wallTiles?: Position[];  // 貫通する壁タイル群（厚い壁の場合）
}

/**
 * パターン1: 最短経路ブロック候補を検出（BREAKABLE壁向け）
 * 最短経路に隣接する壁で、壊すとショートカットになる位置
 * 厚い壁（複数マス幅）にも対応
 */
export const findShortcutBlockingWalls = (
  grid: GameMap,
  start: Position,
  goal: Position,
  usedPositions: Set<string>
): MultiWallCandidate[] => {
  const path = findPath(grid, start, goal);
  if (path.length === 0) return [];

  const candidates: MultiWallCandidate[] = [];
  const pathSet = new Set(path.map(p => `${p.x},${p.y}`));

  // 距離マップを事前計算
  const distFromStart = calculateDistances(grid, start);
  const distFromGoal = calculateDistances(grid, goal);

  // 1. 従来の1マス壁検出（最短経路に隣接する壁）
  for (const pathTile of path) {
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    for (const dir of directions) {
      const wallX = pathTile.x + dir.x;
      const wallY = pathTile.y + dir.y;
      const key = `${wallX},${wallY}`;

      // 範囲外・既使用・経路上はスキップ
      if (wallY < 1 || wallY >= grid.length - 1 || wallX < 1 || wallX >= grid[0].length - 1) continue;
      if (usedPositions.has(key)) continue;
      if (pathSet.has(key)) continue;
      if (grid[wallY][wallX] !== TileType.WALL) continue;

      // ショートカット効果を計算
      const shortcutValue = calculateShortcutValue(grid, { x: wallX, y: wallY }, start, goal);
      if (shortcutValue > 0) {
        candidates.push({
          position: { x: wallX, y: wallY },
          score: shortcutValue,
          type: 'shortcutBlock',
          wallTiles: [{ x: wallX, y: wallY }],
        });
      }
    }
  }

  // 2. 貫通ショートカット検出（厚い壁対応）
  // 最短経路近く（距離3以内）の床タイルから貫通検出
  const penetrationCandidates = findPenetrationShortcuts(grid, start, goal, distFromStart, distFromGoal, 3);

  for (const pc of penetrationCandidates) {
    // 経路からの距離をチェック
    const distFromPath = getDistanceFromPath(path, pc.nearFloor);
    if (distFromPath > 3) continue;

    // 壁タイルのいずれかが既に使用されていないかチェック
    const anyUsed = pc.wallTiles.some(wt => usedPositions.has(`${wt.x},${wt.y}`));
    if (anyUsed) continue;

    // 最初の壁タイルを代表位置として使用
    const firstWall = pc.wallTiles[0];
    candidates.push({
      position: firstWall,
      score: pc.saving,
      type: 'shortcutBlock',
      wallTiles: pc.wallTiles,
    });
  }

  // スコア降順でソート（重複除去）
  const uniqueCandidates = new Map<string, MultiWallCandidate>();
  for (const c of candidates) {
    // 壁タイル群のキーを生成
    const wallKey = c.wallTiles
      ? c.wallTiles.map(w => `${w.x},${w.y}`).sort().join('|')
      : `${c.position.x},${c.position.y}`;
    const existing = uniqueCandidates.get(wallKey);
    if (!existing || existing.score < c.score) {
      uniqueCandidates.set(wallKey, c);
    }
  }

  return Array.from(uniqueCandidates.values()).sort((a, b) => b.score - a.score);
};

/**
 * パターン2: トリック壁候補を検出（INVISIBLE壁向け）
 * ゴール近くで通路を塞ぐ位置（見えているけど行けない）
 */
export const findTrickWalls = (
  grid: GameMap,
  start: Position,
  goal: Position,
  usedPositions: Set<string>
): ScoredWallCandidate[] => {
  const distancesFromGoal = calculateDistances(grid, goal);
  const candidates: ScoredWallCandidate[] = [];

  // ゴールから距離3-10の床タイルを候補に
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      const key = `${x},${y}`;
      if (usedPositions.has(key)) continue;

      // 床タイルのみ対象（通路塞ぎ用）
      if (grid[y][x] !== TileType.FLOOR) continue;

      const distFromGoal = distancesFromGoal.get(key);
      if (distFromGoal === undefined) continue;

      // ゴールから3-10タイルの距離
      if (distFromGoal < 3 || distFromGoal > 10) continue;

      // チョークポイント（通路幅1-2）かチェック
      const isChokePoint = isNarrowPassage(grid, { x, y });
      if (!isChokePoint) continue;

      // 代替経路が存在するか確認
      if (!hasAlternativeRoute(grid, { x, y }, start, goal)) continue;

      // スコアはゴールに近いほど高い
      const score = 11 - distFromGoal;
      candidates.push({
        position: { x, y },
        score,
        type: 'trickWall',
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
};

/**
 * パターン3: 秘密の近道候補を検出（PASSABLE壁向け）
 * 最短経路から少し離れた位置で、通過すると近道になる
 * 厚い壁（複数マス幅）にも対応
 */
export const findSecretPassageWalls = (
  grid: GameMap,
  start: Position,
  goal: Position,
  usedPositions: Set<string>
): MultiWallCandidate[] => {
  const path = findPath(grid, start, goal);
  if (path.length === 0) return [];

  const candidates: MultiWallCandidate[] = [];

  // 距離マップを事前計算
  const distFromStart = calculateDistances(grid, start);
  const distFromGoal = calculateDistances(grid, goal);

  // 1. 従来の1マス壁検出
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      const key = `${x},${y}`;
      if (usedPositions.has(key)) continue;
      if (grid[y][x] !== TileType.WALL) continue;

      // 経路からの距離が2-8タイルの範囲
      const distFromPath = getDistanceFromPath(path, { x, y });
      if (distFromPath < 2 || distFromPath > 8) continue;

      // 両側に床があるか確認（ショートカット可能な位置）
      const verticalShortcut =
        grid[y - 1]?.[x] === TileType.FLOOR &&
        grid[y + 1]?.[x] === TileType.FLOOR;
      const horizontalShortcut =
        grid[y]?.[x - 1] === TileType.FLOOR &&
        grid[y]?.[x + 1] === TileType.FLOOR;

      if (!verticalShortcut && !horizontalShortcut) continue;

      // ショートカット効果を計算
      const shortcutValue = calculateShortcutValue(grid, { x, y }, start, goal);
      if (shortcutValue <= 0) continue;

      // スコア = ショートカット効果 + 経路からの距離（隠れている方が価値あり）
      const score = shortcutValue + Math.min(distFromPath, 5);
      candidates.push({
        position: { x, y },
        score,
        type: 'secretPassage',
        wallTiles: [{ x, y }],
      });
    }
  }

  // 2. 貫通ショートカット検出（厚い壁対応）
  // 経路から離れた位置（距離2-8）の貫通候補を追加
  const penetrationCandidates = findPenetrationShortcuts(grid, start, goal, distFromStart, distFromGoal, 2);

  for (const pc of penetrationCandidates) {
    // 経路からの距離をチェック
    const distFromPath = getDistanceFromPath(path, pc.nearFloor);
    if (distFromPath < 2 || distFromPath > 8) continue;

    // 壁タイルのいずれかが既に使用されていないかチェック
    const anyUsed = pc.wallTiles.some(wt => usedPositions.has(`${wt.x},${wt.y}`));
    if (anyUsed) continue;

    // スコア = ショートカット効果 + 経路からの距離（隠れている方が価値あり）
    const score = pc.saving + Math.min(distFromPath, 5);
    const firstWall = pc.wallTiles[0];
    candidates.push({
      position: firstWall,
      score,
      type: 'secretPassage',
      wallTiles: pc.wallTiles,
    });
  }

  // 重複除去してスコア降順ソート
  const uniqueCandidates = new Map<string, MultiWallCandidate>();
  for (const c of candidates) {
    const wallKey = c.wallTiles
      ? c.wallTiles.map(w => `${w.x},${w.y}`).sort().join('|')
      : `${c.position.x},${c.position.y}`;
    const existing = uniqueCandidates.get(wallKey);
    if (!existing || existing.score < c.score) {
      uniqueCandidates.set(wallKey, c);
    }
  }

  return Array.from(uniqueCandidates.values()).sort((a, b) => b.score - a.score);
};

/**
 * パターン4: 通路塞ぎ候補を検出（INVISIBLE壁向け）
 * 通路のボトルネックで回り込みを強制
 */
export const findCorridorBlockWalls = (
  grid: GameMap,
  start: Position,
  goal: Position,
  usedPositions: Set<string>
): ScoredWallCandidate[] => {
  const path = findPath(grid, start, goal);
  if (path.length === 0) return [];

  const candidates: ScoredWallCandidate[] = [];
  const pathSet = new Set(path.map(p => `${p.x},${p.y}`));

  // 最短経路上の床タイルで、チョークポイントを探す
  for (const pathTile of path) {
    const key = `${pathTile.x},${pathTile.y}`;
    if (usedPositions.has(key)) continue;

    // スタート/ゴールは除外
    if ((pathTile.x === start.x && pathTile.y === start.y) ||
        (pathTile.x === goal.x && pathTile.y === goal.y)) continue;

    // チョークポイントかチェック
    if (!isNarrowPassage(grid, pathTile)) continue;

    // 代替経路が存在するか確認
    if (!hasAlternativeRoute(grid, pathTile, start, goal)) continue;

    // スコアは経路の中央に近いほど高い（より効果的な妨害）
    const pathIndex = path.findIndex(p => p.x === pathTile.x && p.y === pathTile.y);
    const middleIndex = Math.floor(path.length / 2);
    const distanceFromMiddle = Math.abs(pathIndex - middleIndex);
    const score = path.length - distanceFromMiddle;

    candidates.push({
      position: pathTile,
      score,
      type: 'corridorBlock',
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
};

/**
 * 狭い通路（幅1-2）かチェック
 */
const isNarrowPassage = (grid: GameMap, pos: Position): boolean => {
  const { x, y } = pos;

  // 横方向の通路幅をチェック
  let horizontalWidth = 1;
  if (grid[y]?.[x - 1] === TileType.FLOOR) horizontalWidth++;
  if (grid[y]?.[x + 1] === TileType.FLOOR) horizontalWidth++;

  // 縦方向の通路幅をチェック
  let verticalWidth = 1;
  if (grid[y - 1]?.[x] === TileType.FLOOR) verticalWidth++;
  if (grid[y + 1]?.[x] === TileType.FLOOR) verticalWidth++;

  // 横方向または縦方向で狭い通路であれば true
  // 片方が壁で囲まれていて、もう片方が床で開いている = チョークポイント
  const isHorizontalCorridor =
    (grid[y - 1]?.[x] === TileType.WALL && grid[y + 1]?.[x] === TileType.WALL) ||
    (grid[y - 1]?.[x] === TileType.FLOOR && grid[y + 1]?.[x] === TileType.FLOOR);
  const isVerticalCorridor =
    (grid[y]?.[x - 1] === TileType.WALL && grid[y]?.[x + 1] === TileType.WALL) ||
    (grid[y]?.[x - 1] === TileType.FLOOR && grid[y]?.[x + 1] === TileType.FLOOR);

  // 狭い通路: 一方向のみ開いている
  return (horizontalWidth <= 2 && isVerticalCorridor) ||
         (verticalWidth <= 2 && isHorizontalCorridor);
};

/**
 * 複数壁候補を配置するヘルパー関数
 * wallTilesがある場合は全タイルを配置、なければ単一タイルを配置
 */
const placeMultiWallCandidate = (
  candidate: MultiWallCandidate,
  wallType: typeof WallType[keyof typeof WallType],
  walls: Wall[],
  usedPositions: Set<string>
): void => {
  const tilesToPlace = candidate.wallTiles || [candidate.position];

  for (const tile of tilesToPlace) {
    const key = `${tile.x},${tile.y}`;
    if (!usedPositions.has(key)) {
      walls.push(createWall(wallType, tile.x, tile.y));
      usedPositions.add(key);
    }
  }
};

/**
 * 戦略的に特殊壁を配置
 * 4つのパターンを優先度順に配置し、不足分は従来ロジックでフォールバック
 * 厚い壁（複数マス幅）にも対応
 */
export const placeStrategicWalls = (
  grid: GameMap,
  excluded: Position[],
  start: Position,
  goal: Position,
  config: GimmickPlacementConfig = DEFAULT_GIMMICK_CONFIG
): Wall[] => {
  const walls: Wall[] = [];
  const usedPositions = new Set<string>(excluded.map(p => `${p.x},${p.y}`));
  const limits = config.patternLimits || DEFAULT_PATTERN_LIMITS;

  // パターン1: 最短経路ブロック（BREAKABLE壁）
  const shortcutBlockCandidates = findShortcutBlockingWalls(grid, start, goal, usedPositions);
  let placedShortcutBlock = 0;
  for (const candidate of shortcutBlockCandidates) {
    if (placedShortcutBlock >= limits.shortcutBlock) break;

    // 壁タイルのいずれかが既に使用されていないかチェック
    const tilesToCheck = candidate.wallTiles || [candidate.position];
    const anyUsed = tilesToCheck.some(t => usedPositions.has(`${t.x},${t.y}`));
    if (anyUsed) continue;

    // 複数壁タイルを一括配置
    placeMultiWallCandidate(candidate, WallType.BREAKABLE, walls, usedPositions);
    placedShortcutBlock++;
  }

  // パターン3: 秘密の近道（PASSABLE壁）- INVISIBLE壁より先に配置
  const secretPassageCandidates = findSecretPassageWalls(grid, start, goal, usedPositions);
  let placedSecretPassage = 0;
  for (const candidate of secretPassageCandidates) {
    if (placedSecretPassage >= limits.secretPassage) break;

    // 壁タイルのいずれかが既に使用されていないかチェック
    const tilesToCheck = candidate.wallTiles || [candidate.position];
    const anyUsed = tilesToCheck.some(t => usedPositions.has(`${t.x},${t.y}`));
    if (anyUsed) continue;

    // 複数壁タイルを一括配置
    placeMultiWallCandidate(candidate, WallType.PASSABLE, walls, usedPositions);
    placedSecretPassage++;
  }

  // パターン2: トリック壁（INVISIBLE壁）
  const trickWallCandidates = findTrickWalls(grid, start, goal, usedPositions);
  let placedTrickWall = 0;
  for (const candidate of trickWallCandidates) {
    if (placedTrickWall >= limits.trickWall) break;
    const key = `${candidate.position.x},${candidate.position.y}`;
    if (usedPositions.has(key)) continue;

    walls.push(createWall(WallType.INVISIBLE, candidate.position.x, candidate.position.y));
    usedPositions.add(key);
    placedTrickWall++;
  }

  // パターン4: 通路塞ぎ（INVISIBLE壁）
  const corridorBlockCandidates = findCorridorBlockWalls(grid, start, goal, usedPositions);
  let placedCorridorBlock = 0;
  for (const candidate of corridorBlockCandidates) {
    if (placedCorridorBlock >= limits.corridorBlock) break;
    const key = `${candidate.position.x},${candidate.position.y}`;
    if (usedPositions.has(key)) continue;

    walls.push(createWall(WallType.INVISIBLE, candidate.position.x, candidate.position.y));
    usedPositions.add(key);
    placedCorridorBlock++;
  }

  // フォールバック: 戦略的配置で不足した場合は従来ロジックで補完
  const totalPlaced = walls.length;
  if (totalPlaced < config.wallCount) {
    const remainingCount = config.wallCount - totalPlaced;
    const fallbackConfig: GimmickPlacementConfig = {
      ...config,
      wallCount: remainingCount,
    };
    const fallbackWalls = placeWalls(grid, [...excluded, ...walls.map(w => ({ x: w.x, y: w.y }))], fallbackConfig);
    walls.push(...fallbackWalls);
  }

  return walls;
};
