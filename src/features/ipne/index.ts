/**
 * IPNE ゲームロジック エクスポート
 */

// 型定義
export {
  TileType,
  Direction,
  ScreenState,
  ExplorationState,
  EnemyType,
  EnemyState,
  ItemType,
  // MVP3追加
  PlayerClass,
  StatType,
  TrapType,
  TrapState,
  WallType,
  WallState,
} from './types';
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
  // MVP3追加
  PlayerClassValue,
  PlayerStats,
  StatTypeValue,
  Trap,
  TrapTypeValue,
  TrapStateValue,
  Wall,
  WallTypeValue,
  WallStateValue,
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
  // MVP3追加
  incrementKillCount,
  processLevelUp,
  getEffectiveMoveSpeed,
  getEffectiveAttackCooldown,
  getEffectiveHeal,
  applySlowEffect,
  isSlowed,
} from './player';
export type { KillCountResult } from './player';

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
  getEffectiveMoveInterval,
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
  createHealthFull,
  createLevelUpItem,
  createMapRevealItem,
  spawnItems,
  canPickupItem,
  pickupItem,
} from './item';
export type { ItemEffectType, ItemPickupResult } from './item';

// ===== MVP3 追加モジュール =====

// 職業
export {
  CLASS_CONFIGS,
  getClassConfig,
  canSeeTrap,
  canSeeSpecialWall,
  getTrapAlpha,
  getWallAlpha,
} from './class';

// 成長
export {
  MAX_LEVEL,
  KILL_COUNT_TABLE,
  STAT_LIMITS,
  LEVEL_UP_CHOICES,
  getKillCountForLevel,
  getLevelFromKillCount,
  shouldLevelUp,
  applyLevelUpChoice,
  canChooseStat,
  getNextKillsRequired,
} from './progression';

// 罠
export {
  TRAP_CONFIGS,
  generateTrapId,
  resetTrapIdCounter,
  createTrap,
  createDamageTrap,
  createSlowTrap,
  createTeleportTrap,
  triggerTrap,
  canTriggerTrap,
  getTrapAt,
  revealTrap,
  getRandomPassableTile,
} from './trap';
export type { TrapTriggerResult, TeleportDestination } from './trap';

// 壁
export {
  WALL_CONFIGS,
  createWall,
  createBreakableWall,
  createPassableWall,
  createInvisibleWall,
  damageWall,
  isWallPassable,
  isWallBlocking,
  revealWall,
  getWallAt,
} from './wall';

// ギミック配置
export {
  DEFAULT_GIMMICK_CONFIG,
  placeTrap,
  placeWalls,
  placeGimmicks,
} from './gimmickPlacement';
export type { GimmickPlacementConfig, GimmickPlacementResult } from './gimmickPlacement';

// 敵AI（RANGED追加）
export { createRangedEnemy } from './enemy';
export { updateRangedEnemy } from './enemyAI';
