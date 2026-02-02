/**
 * IPNE ゲームロジック エクスポート
 */

// 型定義
export { TileType, Direction, ScreenState, ExplorationState, EnemyType, EnemyState, ItemType } from './types';
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
  Enemy,
  EnemyTypeValue,
  EnemyStateValue,
  Item,
  ItemTypeValue,
  CombatState,
} from './types';

// マップ
export { createMap, createMapWithRooms, getMapWidth, getMapHeight } from './map';

// プレイヤー
export {
  createPlayer,
  movePlayer,
  updatePlayerDirection,
  damagePlayer,
  healPlayer,
  isPlayerInvincible,
  canPlayerAttack,
  setAttackCooldown,
} from './player';

// 衝突判定
export { isWall, canMove, checkEnemyCollision, getEnemyAtPosition, getEnemiesInRange } from './collision';

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

// 敵
export {
  ENEMY_CONFIGS,
  generateEnemyId,
  resetEnemyIdCounter,
  createEnemy,
  createPatrolEnemy,
  createChargeEnemy,
  createSpecimenEnemy,
  createBoss,
  isEnemyAlive,
  damageEnemy,
  applyKnockbackToEnemy,
} from './enemy';

export { SPAWN_CONFIG as ENEMY_SPAWN_CONFIG, spawnEnemies, getSpawnPositionsForRoom, distributeEnemyTypes } from './enemySpawner';

export {
  AI_CONFIG,
  detectPlayer,
  shouldChase,
  shouldStopChase,
  moveEnemyTowards,
  generatePatrolPath,
  getNextPatrolPoint,
  updatePatrolEnemy,
  updateChargeEnemy,
  updateFleeEnemy,
  updateEnemiesWithContact,
  updateEnemyAI,
  updateEnemies,
  canEnemyAttack,
  setEnemyAttackCooldown,
  getDirectPathToPlayer,
  calculateFleeDirection,
} from './enemyAI';
export type { EnemyUpdateResult } from './enemyAI';

// 戦闘
export { COMBAT_CONFIG, playerAttack, getAttackTarget, processEnemyContact, isKnockbackComplete } from './combat';

// アイテム
export {
  ITEM_CONFIGS,
  SPAWN_CONFIG as ITEM_SPAWN_CONFIG,
  generateItemId,
  resetItemIdCounter,
  createItem,
  createHealthSmall,
  createHealthLarge,
  spawnItems,
  canPickupItem,
  pickupItem,
} from './item';
