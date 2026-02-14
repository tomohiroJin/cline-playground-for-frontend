import { calculateDistances } from '../../../pathfinder';
import { GameMap, Position, Room, TileType } from '../../../types';
import { PenetrationCandidate, WallSegment } from './types';
import { shuffle } from '../../../../../utils/math-utils';

// 後方互換のため shuffleArray を shuffle のエイリアスとして export
export const shuffleArray = shuffle;

export const collectRoomTiles = (rooms: Room[]): Position[] => {
  const tiles: Position[] = [];
  for (const room of rooms) {
    if (room.tiles) {
      tiles.push(...room.tiles);
    }
  }
  return tiles;
};

export const collectCorridorTiles = (grid: GameMap, rooms: Room[]): Position[] => {
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

export const collectWallAdjacentTiles = (grid: GameMap): Position[] => {
  const tiles: Position[] = [];
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[y][x] === TileType.WALL) {
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

export const collectShortcutWallPositions = (grid: GameMap): Position[] => {
  const tiles: Position[] = [];
  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[y][x] === TileType.WALL) {
        const verticalShortcut = grid[y - 1]?.[x] === TileType.FLOOR && grid[y + 1]?.[x] === TileType.FLOOR;
        const horizontalShortcut = grid[y]?.[x - 1] === TileType.FLOOR && grid[y]?.[x + 1] === TileType.FLOOR;
        if (verticalShortcut || horizontalShortcut) {
          tiles.push({ x, y });
        }
      }
    }
  }
  return tiles;
};

export const collectContinuousWallSegments = (
  grid: GameMap,
  minLength: number = 2
): WallSegment[] => {
  const segments: WallSegment[] = [];
  const visited = new Set<string>();

  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (visited.has(`${x},${y}`) || grid[y][x] !== TileType.WALL) continue;

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

  while (wallTiles.length < maxThickness) {
    if (currentY < 0 || currentY >= grid.length || currentX < 0 || currentX >= grid[0].length) {
      return null;
    }

    const tile = grid[currentY][currentX];
    if (tile === TileType.WALL) {
      wallTiles.push({ x: currentX, y: currentY });
      currentX += dx;
      currentY += dy;
    } else if (tile === TileType.FLOOR || tile === TileType.START || tile === TileType.GOAL) {
      if (wallTiles.length > 0) {
        return {
          wallTiles,
          farFloor: { x: currentX, y: currentY },
        };
      }
      return null;
    } else {
      return null;
    }
  }

  return null;
};

export const findPenetrationShortcuts = (
  grid: GameMap,
  start: Position,
  goal: Position,
  minSaving: number = 3
): PenetrationCandidate[] => {
  const candidates: PenetrationCandidate[] = [];
  const processedWalls = new Set<string>();
  const distFromStart = calculateDistances(grid, start);
  const distFromGoal = calculateDistances(grid, goal);

  const directions: Array<{ dx: number; dy: number; dir: 'horizontal' | 'vertical' }> = [
    { dx: 1, dy: 0, dir: 'horizontal' },
    { dx: -1, dy: 0, dir: 'horizontal' },
    { dx: 0, dy: 1, dir: 'vertical' },
    { dx: 0, dy: -1, dir: 'vertical' },
  ];

  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      const tile = grid[y][x];
      if (tile !== TileType.FLOOR && tile !== TileType.START && tile !== TileType.GOAL) continue;

      const nearFloor: Position = { x, y };
      const nearKey = `${x},${y}`;
      const nearDistFromStart = distFromStart.get(nearKey);
      const nearDistFromGoal = distFromGoal.get(nearKey);
      if (nearDistFromStart === undefined || nearDistFromGoal === undefined) continue;

      for (const { dx, dy, dir } of directions) {
        const result = findFloorThroughWall(grid, nearFloor, dx, dy);
        if (!result) continue;

        const { wallTiles, farFloor } = result;
        const wallKey = wallTiles
          .map(w => `${w.x},${w.y}`)
          .sort()
          .join('|');
        if (processedWalls.has(wallKey)) continue;
        processedWalls.add(wallKey);

        const farKey = `${farFloor.x},${farFloor.y}`;
        const farDistFromStart = distFromStart.get(farKey);
        const farDistFromGoal = distFromGoal.get(farKey);
        if (farDistFromStart === undefined || farDistFromGoal === undefined) continue;

        const thickness = wallTiles.length;
        const directPathFromNear = nearDistFromStart + thickness + farDistFromGoal;
        const directPathFromFar = farDistFromStart + thickness + nearDistFromGoal;
        const currentPathFromNear = nearDistFromStart + nearDistFromGoal;
        const currentPathFromFar = farDistFromStart + farDistFromGoal;
        const saving = Math.max(
          currentPathFromNear - directPathFromNear,
          currentPathFromFar - directPathFromFar
        );

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

  return candidates.sort((a, b) => b.saving - a.saving);
};

export const detectTrapCandidateTiles = (rooms: Room[], grid: GameMap): Position[] => {
  const corridorTiles = shuffleArray(collectCorridorTiles(grid, rooms));
  const roomTiles = shuffleArray(collectRoomTiles(rooms));
  return [...corridorTiles, ...roomTiles];
};

export const detectWallPlacementCandidates = (grid: GameMap): {
  segments: WallSegment[];
  shortcutPositions: Position[];
  adjacentPositions: Position[];
} => ({
  segments: shuffleArray(collectContinuousWallSegments(grid, 2)),
  shortcutPositions: shuffleArray(collectShortcutWallPositions(grid)),
  adjacentPositions: shuffleArray(collectWallAdjacentTiles(grid)),
});
