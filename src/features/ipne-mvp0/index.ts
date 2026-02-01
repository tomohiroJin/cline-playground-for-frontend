/**
 * IPNE MVP0 ゲームロジック エクスポート
 */

// 型定義
export { TileType, Direction, ScreenState } from './types';
export type {
  TileTypeValue,
  GameMap,
  Position,
  Player,
  DirectionValue,
  ScreenStateValue,
  GameState,
} from './types';

// マップ
export { createMap, getMapWidth, getMapHeight } from './map';

// プレイヤー
export { createPlayer, movePlayer } from './player';

// 衝突判定
export { isWall, canMove } from './collision';

// ゴール判定
export { isGoal, findGoalPosition, findStartPosition } from './goal';
