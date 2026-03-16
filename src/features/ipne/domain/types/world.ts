/**
 * ワールド関連の型定義
 * タイル、マップ、位置、方向、迷路生成設定
 */

/** タイルの種類 */
export const TileType = {
  FLOOR: 0,
  WALL: 1,
  GOAL: 2,
  START: 3,
} as const;

export type TileTypeValue = (typeof TileType)[keyof typeof TileType];

/** マップデータ（2次元配列） */
export type GameMap = TileTypeValue[][];

/** プレイヤー位置 */
export interface Position {
  x: number;
  y: number;
}

/** 移動方向 */
export const Direction = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
} as const;

export type DirectionValue = (typeof Direction)[keyof typeof Direction];

/** BSP分割用の矩形領域 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 部屋データ */
export interface Room {
  rect: Rectangle;
  center: Position;
  tiles?: Position[];
}

/** 通路データ */
export interface Corridor {
  start: Position;
  end: Position;
  horizontal: boolean;
}

/** タイルの探索状態 */
export const ExplorationState = {
  UNEXPLORED: 0,
  EXPLORED: 1,
  VISIBLE: 2,
} as const;

export type ExplorationStateValue = (typeof ExplorationState)[keyof typeof ExplorationState];

/** 自動マッピング状態 */
export interface AutoMapState {
  exploration: ExplorationStateValue[][];
  isMapVisible: boolean;
  isFullScreen: boolean;
}

/** 迷路生成設定 */
export interface MazeConfig {
  width: number;
  height: number;
  minRoomSize: number;
  maxRoomSize: number;
  corridorWidth: number;
  maxDepth: number;
  loopCount: number;
}
