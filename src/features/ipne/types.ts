/**
 * IPNE ゲームの型定義
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

/** プレイヤー状態 */
export interface Player {
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

/** ゲーム画面の状態 */
export const ScreenState = {
  TITLE: 'title',
  PROLOGUE: 'prologue',
  GAME: 'game',
  CLEAR: 'clear',
} as const;

export type ScreenStateValue = (typeof ScreenState)[keyof typeof ScreenState];

/** ゲーム全体の状態 */
export interface GameState {
  map: GameMap;
  player: Player;
  screen: ScreenStateValue;
  isCleared: boolean;
}

// ===== 迷路生成関連の型定義 =====

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
}

/** 通路データ */
export interface Corridor {
  start: Position;
  end: Position;
  horizontal: boolean;
}

/** 迷路生成設定 */
export interface MazeConfig {
  width: number; // 60-80
  height: number; // 60-80
  minRoomSize: number; // 6
  maxRoomSize: number; // 10
  corridorWidth: number; // 3-4
  maxDepth: number; // 3-4（5-16部屋）
  loopCount: number; // 0-2
}
