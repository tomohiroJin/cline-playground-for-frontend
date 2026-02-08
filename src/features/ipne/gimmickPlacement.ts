/**
 * ギミック配置モジュール
 * 罠と特殊壁をマップに配置する
 */
import { createTrap } from './trap';
import { createWall } from './wall';
import { Position, Room, Trap, TrapTypeValue, Wall, WallType, GameMap } from './types';
import {
  detectTrapCandidateTiles,
  detectWallPlacementCandidates,
} from './domain/services/gimmickPlacement/candidateDetection';
import {
  findCorridorBlockWalls,
  findSecretPassageWalls,
  findShortcutBlockingWalls,
  findTrickWalls,
  getDistanceFromPath,
  calculateShortcutValue,
  hasAlternativeRoute,
} from './domain/services/gimmickPlacement/scoring';
import {
  assertGimmickPlacementPostconditions,
  calculateWallTypeCounts,
  placeMultiWallCandidate,
  selectTrapType,
  validateGimmickPlacementConfig,
} from './domain/services/gimmickPlacement/placementDecision';

/** 戦略的配置パターンの制限数 */
export interface StrategicPatternLimits {
  shortcutBlock: number;
  trickWall: number;
  secretPassage: number;
  corridorBlock: number;
}

/** ギミック配置設定 */
export interface GimmickPlacementConfig {
  trapCount: number;
  trapRatio: {
    damage: number;
    slow: number;
    teleport: number;
  };
  wallCount: number;
  wallRatio: {
    breakable: number;
    passable: number;
    invisible: number;
  };
  patternLimits?: StrategicPatternLimits;
}

/** デフォルト戦略的配置パターン制限 */
export const DEFAULT_PATTERN_LIMITS: StrategicPatternLimits = {
  shortcutBlock: 2,
  trickWall: 1,
  secretPassage: 2,
  corridorBlock: 1,
};

/** デフォルト設定 */
export const DEFAULT_GIMMICK_CONFIG: GimmickPlacementConfig = {
  trapCount: 10,
  trapRatio: {
    damage: 0.4,
    slow: 0.3,
    teleport: 0.3,
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

export const placeTrap = (
  rooms: Room[],
  grid: GameMap,
  excluded: Position[],
  config: GimmickPlacementConfig = DEFAULT_GIMMICK_CONFIG
): Trap[] => {
  validateGimmickPlacementConfig(config);

  const traps: Trap[] = [];
  const usedPositions = new Set<string>(excluded.map(p => `${p.x},${p.y}`));
  const candidateTiles = detectTrapCandidateTiles(rooms, grid);

  for (const tile of candidateTiles) {
    if (traps.length >= config.trapCount) break;

    const key = `${tile.x},${tile.y}`;
    if (usedPositions.has(key)) continue;

    const trapType: TrapTypeValue = selectTrapType(config.trapRatio);
    traps.push(createTrap(trapType, tile.x, tile.y));
    usedPositions.add(key);
  }

  return traps;
};

export const placeWalls = (
  grid: GameMap,
  excluded: Position[],
  config: GimmickPlacementConfig = DEFAULT_GIMMICK_CONFIG
): Wall[] => {
  validateGimmickPlacementConfig(config);

  const walls: Wall[] = [];
  const usedPositions = new Set<string>(excluded.map(p => `${p.x},${p.y}`));
  const { segments, shortcutPositions, adjacentPositions } = detectWallPlacementCandidates(grid);
  const { breakableCount, passableCount, invisibleCount } = calculateWallTypeCounts(
    config.wallCount,
    config.wallRatio
  );

  let placedBreakable = 0;
  let placedPassable = 0;

  for (const segment of segments) {
    if (placedBreakable >= breakableCount) break;
    const allAvailable = segment.tiles.every(t => !usedPositions.has(`${t.x},${t.y}`));
    if (!allAvailable) continue;
    for (const tile of segment.tiles) {
      const key = `${tile.x},${tile.y}`;
      walls.push(createWall(WallType.BREAKABLE, tile.x, tile.y));
      usedPositions.add(key);
    }
    placedBreakable++;
  }

  for (const pos of shortcutPositions) {
    if (placedBreakable >= breakableCount) break;
    const key = `${pos.x},${pos.y}`;
    if (usedPositions.has(key)) continue;
    walls.push(createWall(WallType.BREAKABLE, pos.x, pos.y));
    usedPositions.add(key);
    placedBreakable++;
  }

  for (const pos of shortcutPositions) {
    if (placedPassable >= passableCount) break;
    const key = `${pos.x},${pos.y}`;
    if (usedPositions.has(key)) continue;
    walls.push(createWall(WallType.PASSABLE, pos.x, pos.y));
    usedPositions.add(key);
    placedPassable++;
  }

  let placedInvisible = 0;
  for (const pos of adjacentPositions) {
    if (placedInvisible >= invisibleCount) break;
    const key = `${pos.x},${pos.y}`;
    if (usedPositions.has(key)) continue;
    walls.push(createWall(WallType.INVISIBLE, pos.x, pos.y));
    usedPositions.add(key);
    placedInvisible++;
  }

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

export const placeStrategicWalls = (
  grid: GameMap,
  excluded: Position[],
  start: Position,
  goal: Position,
  config: GimmickPlacementConfig = DEFAULT_GIMMICK_CONFIG
): Wall[] => {
  validateGimmickPlacementConfig(config);

  const walls: Wall[] = [];
  const usedPositions = new Set<string>(excluded.map(p => `${p.x},${p.y}`));
  const limits = config.patternLimits || DEFAULT_PATTERN_LIMITS;

  const shortcutBlockCandidates = findShortcutBlockingWalls(grid, start, goal, usedPositions);
  let placedShortcutBlock = 0;
  for (const candidate of shortcutBlockCandidates) {
    if (placedShortcutBlock >= limits.shortcutBlock) break;
    const tilesToCheck = candidate.wallTiles || [candidate.position];
    if (tilesToCheck.some(t => usedPositions.has(`${t.x},${t.y}`))) continue;
    placeMultiWallCandidate(candidate, WallType.BREAKABLE, walls, usedPositions);
    placedShortcutBlock++;
  }

  const secretPassageCandidates = findSecretPassageWalls(grid, start, goal, usedPositions);
  let placedSecretPassage = 0;
  for (const candidate of secretPassageCandidates) {
    if (placedSecretPassage >= limits.secretPassage) break;
    const tilesToCheck = candidate.wallTiles || [candidate.position];
    if (tilesToCheck.some(t => usedPositions.has(`${t.x},${t.y}`))) continue;
    placeMultiWallCandidate(candidate, WallType.PASSABLE, walls, usedPositions);
    placedSecretPassage++;
  }

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

  if (walls.length < config.wallCount) {
    const remainingCount = config.wallCount - walls.length;
    const fallbackWalls = placeWalls(
      grid,
      [...excluded, ...walls.map(w => ({ x: w.x, y: w.y }))],
      { ...config, wallCount: remainingCount }
    );
    walls.push(...fallbackWalls);
  }

  return walls;
};

export const placeGimmicks = (
  rooms: Room[],
  grid: GameMap,
  excluded: Position[],
  config: GimmickPlacementConfig = DEFAULT_GIMMICK_CONFIG,
  start?: Position,
  goal?: Position
): GimmickPlacementResult => {
  validateGimmickPlacementConfig(config);

  const traps = placeTrap(rooms, grid, excluded, config);
  const trapPositions = traps.map(t => ({ x: t.x, y: t.y }));
  const walls =
    start && goal
      ? placeStrategicWalls(grid, [...excluded, ...trapPositions], start, goal, config)
      : placeWalls(grid, [...excluded, ...trapPositions], config);

  assertGimmickPlacementPostconditions(traps, walls, config);
  return { traps, walls };
};

export {
  getDistanceFromPath,
  calculateShortcutValue,
  hasAlternativeRoute,
  findShortcutBlockingWalls,
  findTrickWalls,
  findSecretPassageWalls,
  findCorridorBlockWalls,
};
