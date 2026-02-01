/**
 * IPNE MVP0 ゲームの型定義
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
