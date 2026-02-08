import { calculateDistances, findPath, isConnected } from '../../../pathfinder';
import { GameMap, Position, TileType } from '../../../types';
import { findPenetrationShortcuts } from './candidateDetection';
import { MultiWallCandidate, ScoredWallCandidate } from './types';

export const getDistanceFromPath = (path: Position[], pos: Position): number => {
  if (path.length === 0) return Infinity;
  let minDist = Infinity;
  for (const p of path) {
    const dist = Math.abs(p.x - pos.x) + Math.abs(p.y - pos.y);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
};

export const calculateShortcutValue = (
  grid: GameMap,
  wallPos: Position,
  start: Position,
  goal: Position
): number => {
  const distancesFromStart = calculateDistances(grid, start);
  const distancesFromGoal = calculateDistances(grid, goal);
  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];
  const adjacentFloors: { pos: Position; distFromStart: number; distFromGoal: number }[] = [];

  for (const dir of directions) {
    const adjX = wallPos.x + dir.x;
    const adjY = wallPos.y + dir.y;
    if (adjY < 0 || adjY >= grid.length || adjX < 0 || adjX >= grid[0].length) continue;
    if (
      grid[adjY][adjX] !== TileType.FLOOR &&
      grid[adjY][adjX] !== TileType.START &&
      grid[adjY][adjX] !== TileType.GOAL
    ) {
      continue;
    }

    const key = `${adjX},${adjY}`;
    const distFromStart = distancesFromStart.get(key);
    const distFromGoal = distancesFromGoal.get(key);
    if (distFromStart !== undefined && distFromGoal !== undefined) {
      adjacentFloors.push({ pos: { x: adjX, y: adjY }, distFromStart, distFromGoal });
    }
  }

  if (adjacentFloors.length < 2) return 0;

  let maxDistanceSaving = 0;
  for (let i = 0; i < adjacentFloors.length; i++) {
    for (let j = i + 1; j < adjacentFloors.length; j++) {
      const a = adjacentFloors[i];
      const b = adjacentFloors[j];
      const directPath = a.distFromStart + 1 + b.distFromGoal;
      const currentPath = a.distFromStart + a.distFromGoal;
      const directPath2 = b.distFromStart + 1 + a.distFromGoal;
      const currentPath2 = b.distFromStart + b.distFromGoal;
      const saving1 = currentPath - directPath;
      const saving2 = currentPath2 - directPath2;
      maxDistanceSaving = Math.max(maxDistanceSaving, saving1, saving2);
    }
  }

  return maxDistanceSaving;
};

export const hasAlternativeRoute = (
  grid: GameMap,
  wallPos: Position,
  start: Position,
  goal: Position
): boolean => {
  const currentConnected = isConnected(grid, start, goal);
  if (!currentConnected) return false;

  if (grid[wallPos.y][wallPos.x] === TileType.WALL) {
    return true;
  }

  const tempGrid: GameMap = grid.map(row => [...row]);
  tempGrid[wallPos.y][wallPos.x] = TileType.WALL;
  return isConnected(tempGrid, start, goal);
};

const isNarrowPassage = (grid: GameMap, pos: Position): boolean => {
  const { x, y } = pos;
  let horizontalWidth = 1;
  if (grid[y]?.[x - 1] === TileType.FLOOR) horizontalWidth++;
  if (grid[y]?.[x + 1] === TileType.FLOOR) horizontalWidth++;

  let verticalWidth = 1;
  if (grid[y - 1]?.[x] === TileType.FLOOR) verticalWidth++;
  if (grid[y + 1]?.[x] === TileType.FLOOR) verticalWidth++;

  const isHorizontalCorridor =
    (grid[y - 1]?.[x] === TileType.WALL && grid[y + 1]?.[x] === TileType.WALL) ||
    (grid[y - 1]?.[x] === TileType.FLOOR && grid[y + 1]?.[x] === TileType.FLOOR);
  const isVerticalCorridor =
    (grid[y]?.[x - 1] === TileType.WALL && grid[y]?.[x + 1] === TileType.WALL) ||
    (grid[y]?.[x - 1] === TileType.FLOOR && grid[y]?.[x + 1] === TileType.FLOOR);

  return (horizontalWidth <= 2 && isVerticalCorridor) || (verticalWidth <= 2 && isHorizontalCorridor);
};

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
      if (wallY < 1 || wallY >= grid.length - 1 || wallX < 1 || wallX >= grid[0].length - 1) continue;
      if (usedPositions.has(key) || pathSet.has(key) || grid[wallY][wallX] !== TileType.WALL) continue;

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

  const penetrationCandidates = findPenetrationShortcuts(grid, start, goal, 3);
  for (const pc of penetrationCandidates) {
    const distFromPath = getDistanceFromPath(path, pc.nearFloor);
    if (distFromPath > 3) continue;
    const anyUsed = pc.wallTiles.some(wt => usedPositions.has(`${wt.x},${wt.y}`));
    if (anyUsed) continue;
    candidates.push({
      position: pc.wallTiles[0],
      score: pc.saving,
      type: 'shortcutBlock',
      wallTiles: pc.wallTiles,
    });
  }

  const uniqueCandidates = new Map<string, MultiWallCandidate>();
  for (const c of candidates) {
    const wallKey = c.wallTiles
      ? c.wallTiles.map(w => `${w.x},${w.y}`).sort().join('|')
      : `${c.position.x},${c.position.y}`;
    const existing = uniqueCandidates.get(wallKey);
    if (!existing || existing.score < c.score) uniqueCandidates.set(wallKey, c);
  }

  return Array.from(uniqueCandidates.values()).sort((a, b) => b.score - a.score);
};

export const findTrickWalls = (
  grid: GameMap,
  start: Position,
  goal: Position,
  usedPositions: Set<string>
): ScoredWallCandidate[] => {
  const distancesFromGoal = calculateDistances(grid, goal);
  const candidates: ScoredWallCandidate[] = [];

  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      const key = `${x},${y}`;
      if (usedPositions.has(key)) continue;
      if (grid[y][x] !== TileType.FLOOR) continue;
      const distFromGoal = distancesFromGoal.get(key);
      if (distFromGoal === undefined || distFromGoal < 3 || distFromGoal > 10) continue;
      if (!isNarrowPassage(grid, { x, y })) continue;
      if (!hasAlternativeRoute(grid, { x, y }, start, goal)) continue;

      candidates.push({
        position: { x, y },
        score: 11 - distFromGoal,
        type: 'trickWall',
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
};

export const findSecretPassageWalls = (
  grid: GameMap,
  start: Position,
  goal: Position,
  usedPositions: Set<string>
): MultiWallCandidate[] => {
  const path = findPath(grid, start, goal);
  if (path.length === 0) return [];

  const candidates: MultiWallCandidate[] = [];

  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      const key = `${x},${y}`;
      if (usedPositions.has(key) || grid[y][x] !== TileType.WALL) continue;

      const distFromPath = getDistanceFromPath(path, { x, y });
      if (distFromPath < 2 || distFromPath > 8) continue;

      const verticalShortcut = grid[y - 1]?.[x] === TileType.FLOOR && grid[y + 1]?.[x] === TileType.FLOOR;
      const horizontalShortcut = grid[y]?.[x - 1] === TileType.FLOOR && grid[y]?.[x + 1] === TileType.FLOOR;
      if (!verticalShortcut && !horizontalShortcut) continue;

      const shortcutValue = calculateShortcutValue(grid, { x, y }, start, goal);
      if (shortcutValue <= 0) continue;

      candidates.push({
        position: { x, y },
        score: shortcutValue + Math.min(distFromPath, 5),
        type: 'secretPassage',
        wallTiles: [{ x, y }],
      });
    }
  }

  const penetrationCandidates = findPenetrationShortcuts(grid, start, goal, 2);
  for (const pc of penetrationCandidates) {
    const distFromPath = getDistanceFromPath(path, pc.nearFloor);
    if (distFromPath < 2 || distFromPath > 8) continue;
    const anyUsed = pc.wallTiles.some(wt => usedPositions.has(`${wt.x},${wt.y}`));
    if (anyUsed) continue;
    candidates.push({
      position: pc.wallTiles[0],
      score: pc.saving + Math.min(distFromPath, 5),
      type: 'secretPassage',
      wallTiles: pc.wallTiles,
    });
  }

  const uniqueCandidates = new Map<string, MultiWallCandidate>();
  for (const c of candidates) {
    const wallKey = c.wallTiles
      ? c.wallTiles.map(w => `${w.x},${w.y}`).sort().join('|')
      : `${c.position.x},${c.position.y}`;
    const existing = uniqueCandidates.get(wallKey);
    if (!existing || existing.score < c.score) uniqueCandidates.set(wallKey, c);
  }

  return Array.from(uniqueCandidates.values()).sort((a, b) => b.score - a.score);
};

export const findCorridorBlockWalls = (
  grid: GameMap,
  start: Position,
  goal: Position,
  usedPositions: Set<string>
): ScoredWallCandidate[] => {
  const path = findPath(grid, start, goal);
  if (path.length === 0) return [];

  const candidates: ScoredWallCandidate[] = [];
  for (const pathTile of path) {
    const key = `${pathTile.x},${pathTile.y}`;
    if (usedPositions.has(key)) continue;
    if ((pathTile.x === start.x && pathTile.y === start.y) || (pathTile.x === goal.x && pathTile.y === goal.y)) {
      continue;
    }
    if (!isNarrowPassage(grid, pathTile)) continue;
    if (!hasAlternativeRoute(grid, pathTile, start, goal)) continue;

    const pathIndex = path.findIndex(p => p.x === pathTile.x && p.y === pathTile.y);
    const middleIndex = Math.floor(path.length / 2);
    const distanceFromMiddle = Math.abs(pathIndex - middleIndex);
    candidates.push({
      position: pathTile,
      score: path.length - distanceFromMiddle,
      type: 'corridorBlock',
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
};
