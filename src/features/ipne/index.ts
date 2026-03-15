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
  // MVP4追加
  Rating,
  TimerState,
  FeedbackType,
  TutorialStepType,
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
  // MVP4追加
  RatingValue,
  EpilogueText,
  TimerStateValue,
  GameTimer,
  GameRecord,
  BestRecords,
  TutorialStepTypeValue,
  TutorialStep,
  TutorialState,
  FeedbackTypeValue,
  FeedbackEffect,
  // 5ステージ制追加
  StageNumber,
  StageConfig,
  StageRewardType,
  StageRewardHistory,
  StageCarryOver,
  StoryScene,
} from './types';

// マップ
export { createMap, createMapWithRooms, getMapWidth, getMapHeight } from './domain/services/mapService';

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
} from './domain/entities/player';
export type { KillCountResult, DamageResult } from './domain/entities/player';

// 衝突判定
export { isWall, canMove, checkEnemyCollision, getEnemyAtPosition, getEnemiesInRange } from './domain/services/collisionService';

// ゴール判定
export { isGoal, findGoalPosition, findStartPosition, canGoal } from './domain/services/goalService';

// 経路探索
export { findPath } from './domain/services/pathfinderService';

// 自動マッピング
export { initExploration, updateExploration, isGoalDiscovered, drawAutoMap } from './application/usecases/autoMapping';

// ビューポート
export {
  calculateViewport,
  calculateTileSize,
  worldToScreen,
  isPlayerInViewport,
  getCanvasSize,
  VIEWPORT_CONFIG,
} from './presentation/services/viewportService';
export type { Viewport } from './presentation/services/viewportService';

// デバッグ
export {
  isDebugMode,
  initDebugState,
  toggleDebugOption,
  drawDebugPanel,
  drawCoordinateOverlay,
  DEFAULT_DEBUG_STATE,
  setDebugBrowserEnvProvider,
  resetDebugBrowserEnvProvider,
} from './infrastructure/debug/debugService';
export type { DebugState } from './infrastructure/debug/debugService';

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
} from './domain/services/movementService';
export type { MovementConfig, MovementState } from './domain/services/movementService';

// 敵
export {
  ENEMY_CONFIGS,
  createEnemy,
  createPatrolEnemy,
  createChargeEnemy,
  createSpecimenEnemy,
  createBoss,
  createMiniBoss,
  createMegaBoss,
  isEnemyAlive,
  damageEnemy,
  applyKnockbackToEnemy,
} from './domain/entities/enemy';

export { SPAWN_CONFIG as ENEMY_SPAWN_CONFIG, spawnEnemies, spawnEnemiesForStage, applyScaling, getSpawnPositionsForRoom, distributeEnemyTypes } from './application/usecases/enemySpawner';

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
export { EnemyAiPolicyRegistry, buildDefaultEnemyAiPolicyRegistry } from './domain';
export type { EnemyAiPolicy, EnemyAiUpdateContext } from './domain';

// アプリケーション層
export {
  tickGameState,
  TickDisplayEffect,
  TickSoundEffect,
  TickSaveEffect,
  resolveKnockback,
  resolvePlayerDamage,
  resolveItemPickupEffects,
} from './application';
export type {
  TickGameStateInput,
  TickGameStateResult,
  TickSoundEffectValue,
  TickDisplayEffectValue,
  TickSaveEffectValue,
  GameTickEffect,
  ItemPickupEffectEvent,
} from './application';

// プレゼンテーション層
export { useSyncedState } from './presentation';

// 戦闘
export { COMBAT_CONFIG, playerAttack, getAttackTarget, processEnemyContact, isKnockbackComplete } from './domain/services/combatService';

// アイテム
export {
  ITEM_CONFIGS,
  SPAWN_CONFIG as ITEM_SPAWN_CONFIG,
  createItem,
  createHealthSmall,
  createHealthLarge,
  createHealthFull,
  createLevelUpItem,
  createMapRevealItem,
  createKeyItem,
  spawnItems,
  canPickupItem,
  pickupItem,
} from './domain/entities/item';
export type { ItemEffectType, ItemPickupResult } from './domain/entities/item';

// ===== MVP3 追加モジュール =====

// 職業
export {
  CLASS_CONFIGS,
  getClassConfig,
  canSeeTrap,
  canSeeSpecialWall,
  getTrapAlpha,
  getWallAlpha,
} from './domain/valueObjects/playerClass';

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
  applyStageReward,
  canChooseReward,
  shouldLevelUpInStage,
} from './domain/services/progressionService';

// 罠
export {
  TRAP_CONFIGS,
  createTrap,
  createDamageTrap,
  createSlowTrap,
  createTeleportTrap,
  triggerTrap,
  canTriggerTrap,
  getTrapAt,
  revealTrap,
  getRandomPassableTile,
} from './domain/entities/trap';
export type { TrapTriggerResult, TeleportDestination } from './domain/entities/trap';

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
} from './domain/entities/wall';

// ギミック配置
export {
  DEFAULT_GIMMICK_CONFIG,
  placeTrap,
  placeWalls,
  placeGimmicks,
} from './domain/services/gimmickPlacement/gimmickPlacement';
export type { GimmickPlacementResult } from './domain/services/gimmickPlacement/gimmickPlacement';
export type { GimmickPlacementConfig, StrategicPatternLimits } from './types';

// 敵AI（RANGED追加）
export { createRangedEnemy } from './domain/entities/enemy';
export { updateRangedEnemy } from './enemyAI';

// ===== MVP4 追加モジュール =====

// エンディング
export {
  RATING_THRESHOLDS,
  RATING_COLORS,
  calculateRating,
  getEpilogueText,
  getGameOverText,
  getRatingColor,
} from './domain/services/endingService';
export {
  getEndingImage,
  getGameOverImage,
  getEndingVideo,
} from './presentation/services/endingAssetProvider';

// タイマー
export {
  createTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  getElapsedTime,
  formatTime,
  formatTimeShort,
  isTimerRunning,
  isTimerPaused,
} from './application/services/timerService';

// 記録
export {
  STORAGE_KEYS,
  createRecord,
  loadBestRecords,
  saveBestRecords,
  isBestRecord,
  updateBestRecord,
  saveRecord,
  clearRecords,
  getBestRecordForClass,
  getAllBestRecords,
  setRecordStorageProvider,
  resetRecordStorageProvider,
  setRecordClockProvider,
  resetRecordClockProvider,
} from './infrastructure/storage/recordStorage';

// チュートリアル
export {
  TUTORIAL_STEPS,
  initTutorial,
  isTutorialCompleted,
  saveTutorialCompleted,
  advanceTutorialStep,
  skipTutorial,
  toggleTutorialVisibility,
  getCurrentTutorialStep,
  getTutorialText,
  shouldAdvanceTutorial,
  getTutorialStepIndex,
  getTutorialProgress,
  setTutorialStorageProvider,
  resetTutorialStorageProvider,
} from './presentation/services/tutorialService';

// フィードバック
export {
  FEEDBACK_CONFIGS,
  createFeedback,
  createDamageFeedback,
  createHealFeedback,
  createLevelUpFeedback,
  createTrapFeedback,
  createItemPickupFeedback,
  isFeedbackActive,
  getFeedbackProgress,
  updateFeedbacks,
  drawDamageFlash,
  drawTrapEffect,
  drawPopup,
  needsFlash,
} from './presentation/services/feedbackService';

// 敵ドロップ（MVP4追加）
export {
  SPECIMEN_DROP_RATE,
  DROP_ITEM_WEIGHTS,
  shouldDropItem,
  selectDropItemType,
  createDropItem,
  processEnemyDeath,
} from './domain/entities/enemy';
export type { EnemyDeathResult } from './domain/entities/enemy';

// 迷路生成安定化（MVP4追加）
export {
  SAFE_ZONE_RADIUS,
  MAX_GENERATION_RETRIES,
  DANGEROUS_ENEMIES,
  DANGEROUS_TRAPS,
  isInSafeZone,
  validateEnemyPlacement,
  validateTrapPlacement,
  validateGeneration,
  getPositionsOutsideSafeZone,
  generateSafeMaze,
} from './domain/services/mazeGenerator';
export type { ValidationResult, MazeResult } from './domain/services/mazeGenerator';

// ===== MVP5 音声モジュール =====

// 型定義（追加エクスポート）
export {
  SoundEffectType,
  BgmType,
  DEFAULT_AUDIO_SETTINGS,
} from './types';
export type {
  SoundEffectTypeValue,
  BgmTypeValue,
  AudioSettings,
  SoundConfig,
  MelodyNote,
} from './types';

// AudioContext管理
export {
  getAudioContext,
  enableAudio,
  isAudioInitialized,
  resetAudioContext,
} from './audio';

// 効果音
export {
  playSoundEffect,
  updateSoundSettings,
  getSoundSettings,
  resetSoundSettings,
  playPlayerDamageSound,
  playEnemyKillSound,
  playGameClearSound,
  playGameOverSound,
  playLevelUpSound,
  playAttackHitSound,
  playItemPickupSound,
  playHealSound,
} from './audio';

// BGM
export {
  playBgm,
  stopBgm,
  pauseBgm,
  resumeBgm,
  getCurrentBgmType,
  isBgmPlaying,
  updateBgmSettings,
  resetBgmState,
  playTitleBgm,
  playGameBgm,
  playClearJingle,
  playGameOverJingle,
} from './audio';

// 音声設定
export {
  initializeAudioSettings,
  setMasterVolume,
  setSeVolume,
  setBgmVolume,
  setMuted,
  toggleMute,
  getAudioSettings,
  resetAudioSettings,
  clearAudioSettings,
  setAudioStorageProvider,
  resetAudioStorageProvider,
} from './audio';

// インフラ抽象
export {
  BROWSER_ENV_PROVIDER,
  SYSTEM_CLOCK_PROVIDER,
  MATH_RANDOM_PROVIDER,
  NOOP_STORAGE_PROVIDER,
  createBrowserStorageProvider,
} from './infrastructure';
export type { BrowserEnvProvider, StorageProvider } from './infrastructure';
export type { ClockProvider, RandomProvider } from './domain/ports';

// 契約
export { assertCondition, assertNumberInRange, assertIntegerInRange, assertUniquePositions } from './shared';

// ===== 5ステージ制追加モジュール =====

// ステージ設定
export {
  STAGE_CONFIGS,
  TOTAL_STAGES,
  getStageConfig,
  getNextStage,
  isFinalStage,
} from './domain/config/stageConfig';

// ストーリー
export {
  PROLOGUE_STORY,
  STAGE_REWARD_CHOICES,
  getStageStory,
  getPrologueStory,
  getEndingEpilogue,
  getAllStoryScenes,
} from './domain/config/story';
