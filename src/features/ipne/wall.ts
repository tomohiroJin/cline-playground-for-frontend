/**
 * 壁ギミックモジュール
 */
import { Wall, WallType, WallTypeValue, WallState, WallStateValue } from './types';

/** 壁の設定 */
interface WallConfig {
  passable: boolean;
  attackable: boolean;
  hp?: number;
}

/** 壁種類別設定 */
export const WALL_CONFIGS: Record<WallTypeValue, WallConfig> = {
  [WallType.NORMAL]: {
    passable: false,
    attackable: false,
  },
  [WallType.BREAKABLE]: {
    passable: false,
    attackable: true,
    hp: 3,
  },
  [WallType.PASSABLE]: {
    passable: true,
    attackable: false,
  },
  [WallType.INVISIBLE]: {
    passable: false,
    attackable: false,
  },
};

/**
 * 壁を作成
 */
export const createWall = (
  type: WallTypeValue,
  x: number,
  y: number,
  state: WallStateValue = WallState.INTACT
): Wall => {
  const config = WALL_CONFIGS[type];
  return {
    x,
    y,
    type,
    state,
    hp: config.hp,
  };
};

/**
 * 破壊可能壁を作成
 */
export const createBreakableWall = (x: number, y: number): Wall => {
  return createWall(WallType.BREAKABLE, x, y);
};

/**
 * すり抜け可能壁を作成
 */
export const createPassableWall = (x: number, y: number): Wall => {
  return createWall(WallType.PASSABLE, x, y);
};

/**
 * 透明壁を作成
 */
export const createInvisibleWall = (x: number, y: number): Wall => {
  return createWall(WallType.INVISIBLE, x, y);
};

/**
 * 壁にダメージを与える
 */
export const damageWall = (wall: Wall, damage: number): Wall => {
  if (wall.type !== WallType.BREAKABLE) return wall;
  if (wall.hp === undefined) return wall;

  const newHp = Math.max(0, wall.hp - damage);
  const newState = newHp === 0 ? WallState.BROKEN : WallState.DAMAGED;

  return {
    ...wall,
    hp: newHp,
    state: newState,
  };
};

/**
 * 壁が通過可能かどうかを判定
 */
export const isWallPassable = (wall: Wall): boolean => {
  // 破壊済みなら通過可能
  if (wall.state === WallState.BROKEN) {
    return true;
  }

  // すり抜け可能壁は常に通過可能
  if (wall.type === WallType.PASSABLE) {
    return true;
  }

  return false;
};

/**
 * 壁が通行を妨げるかどうかを判定
 */
export const isWallBlocking = (wall: Wall): boolean => {
  return !isWallPassable(wall);
};

/**
 * 壁を発見済み状態にする
 */
export const revealWall = (wall: Wall): Wall => {
  if (wall.state === WallState.BROKEN) return wall;
  return {
    ...wall,
    state: WallState.REVEALED,
  };
};

/**
 * 指定位置の壁を取得
 */
export const getWallAt = (walls: Wall[], x: number, y: number): Wall | undefined => {
  return walls.find(wall => wall.x === x && wall.y === y);
};
