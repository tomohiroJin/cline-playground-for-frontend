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

// 経路探索
export { findPath } from './pathfinder';

// 自動マッピング
export { initExploration, updateExploration, isGoalDiscovered, drawAutoMap } from './autoMapping';

// ビューポート
export {
  calculateViewport,
  worldToScreen,
  isPlayerInViewport,
  getCanvasSize,
  VIEWPORT_CONFIG,
} from './viewport';
export type { Viewport } from './viewport';

// デバッグ
export {
  isDebugMode,
  initDebugState,
  toggleDebugOption,
  drawDebugPanel,
  drawCoordinateOverlay,
  DEFAULT_DEBUG_STATE,
} from './debug';
export type { DebugState } from './debug';

// 連続移動
export {
  getDirectionFromKey,
  isMovementKey,
  startMovement,
  stopMovement,
  updateMovement,
  DEFAULT_MOVEMENT_CONFIG,
  INITIAL_MOVEMENT_STATE,
} from './movement';
export type { MovementConfig, MovementState } from './movement';
