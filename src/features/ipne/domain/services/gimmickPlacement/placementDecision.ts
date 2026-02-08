import { createWall } from '../../../wall';
import { assertCondition, assertIntegerInRange, assertNumberInRange } from '../../../shared/contracts';
import { Position, Trap, TrapType, TrapTypeValue, Wall, WallType } from '../../../types';
import { MultiWallCandidate } from './types';

export interface PlacementConfigLike {
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
}

export const selectTrapType = (ratio: PlacementConfigLike['trapRatio']): TrapTypeValue => {
  const rand = Math.random();
  if (rand < ratio.damage) {
    return TrapType.DAMAGE;
  } else if (rand < ratio.damage + ratio.slow) {
    return TrapType.SLOW;
  } else {
    return TrapType.TELEPORT;
  }
};

export const selectWallType = (ratio: PlacementConfigLike['wallRatio']): typeof WallType[keyof typeof WallType] => {
  const rand = Math.random();
  if (rand < ratio.breakable) {
    return WallType.BREAKABLE;
  } else if (rand < ratio.breakable + ratio.passable) {
    return WallType.PASSABLE;
  }
  return WallType.INVISIBLE;
};

export const calculateWallTypeCounts = (
  wallCount: number,
  wallRatio: PlacementConfigLike['wallRatio']
): { breakableCount: number; passableCount: number; invisibleCount: number } => {
  const breakableCount = Math.ceil(wallCount * wallRatio.breakable);
  const passableCount = Math.ceil(wallCount * wallRatio.passable);
  const invisibleCount = Math.max(0, wallCount - breakableCount - passableCount);
  return { breakableCount, passableCount, invisibleCount };
};

export const placeMultiWallCandidate = (
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

const assertRatio = (name: string, values: number[]): void => {
  for (const value of values) {
    assertNumberInRange(value, 0, 1, `${name} ratio`);
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  assertCondition(Math.abs(sum - 1) < 1e-6, `${name} の比率合計は1である必要があります`);
};

export const validateGimmickPlacementConfig = (config: PlacementConfigLike): void => {
  assertIntegerInRange(config.trapCount, 0, 999, 'trapCount');
  assertIntegerInRange(config.wallCount, 0, 999, 'wallCount');
  assertRatio('trap', [config.trapRatio.damage, config.trapRatio.slow, config.trapRatio.teleport]);
  assertRatio('wall', [config.wallRatio.breakable, config.wallRatio.passable, config.wallRatio.invisible]);
};

const assertUniquePositions = (positions: Position[], name: string): void => {
  const used = new Set<string>();
  for (const pos of positions) {
    const key = `${pos.x},${pos.y}`;
    assertCondition(!used.has(key), `${name} に重複座標が含まれています`);
    used.add(key);
  }
};

export const assertGimmickPlacementPostconditions = (
  traps: Trap[],
  walls: Wall[],
  config: PlacementConfigLike
): void => {
  assertCondition(traps.length <= config.trapCount, 'trapCount を超える罠が配置されました');
  assertUniquePositions(
    traps.map(t => ({ x: t.x, y: t.y })),
    'traps'
  );
  assertUniquePositions(
    walls.map(w => ({ x: w.x, y: w.y })),
    'walls'
  );

  const trapPos = new Set(traps.map(t => `${t.x},${t.y}`));
  for (const wall of walls) {
    assertCondition(!trapPos.has(`${wall.x},${wall.y}`), '罠と壁が同一座標に配置されています');
  }
};
