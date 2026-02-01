/**
 * IPNE ゲームロジック エクスポート
 */

// 型定義
export { TileType, Direction, ScreenState, ExplorationState } from './types';
export type {
  TileTypeValue,
  GameMap,
  Position,
  Player,
  DirectionValue,
  ScreenStateValue,
  GameState,
  MazeConfig,
  Room,
  Rectangle,
  Corridor,
  ExplorationStateValue,
  AutoMapState,
} from './types';

// マップ
export { createMap, getMapWidth, getMapHeight } from './map';

// プレイヤー
export { createPlayer, movePlayer } from './player';

// 衝突判定
export { isWall, canMove } from './collision';

// ゴール判定
export { isGoal, findGoalPosition, findStartPosition } from './goal';

// 自動マッピング
export { initExploration, updateExploration, isGoalDiscovered, drawAutoMap } from './autoMapping';
