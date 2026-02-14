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
  CLASS_SELECT: 'class_select',
  PROLOGUE: 'prologue',
  GAME: 'game',
  DYING: 'dying',
  CLEAR: 'clear',
  GAME_OVER: 'game_over',
} as const;

export type ScreenStateValue = (typeof ScreenState)[keyof typeof ScreenState];

// ===== 職業関連の型定義 =====

/** 職業の種類 */
export const PlayerClass = {
  WARRIOR: 'warrior',
  THIEF: 'thief',
} as const;

export type PlayerClassValue = (typeof PlayerClass)[keyof typeof PlayerClass];

/** 可視性の種類 */
export type VisibilityType = 'none' | 'faint';

/** 職業設定 */
export interface ClassConfig {
  name: string;
  description: string;
  trapVisibility: VisibilityType;
  wallVisibility: VisibilityType;
}

// ===== 成長関連の型定義 =====

/** 能力値の種類 */
export const StatType = {
  ATTACK_POWER: 'attackPower',
  ATTACK_RANGE: 'attackRange',
  MOVE_SPEED: 'moveSpeed',
  ATTACK_SPEED: 'attackSpeed',
  HEAL_BONUS: 'healBonus',
} as const;

export type StatTypeValue = (typeof StatType)[keyof typeof StatType];

/** プレイヤー能力値 */
export interface PlayerStats {
  attackPower: number;
  attackRange: number;
  moveSpeed: number;
  attackSpeed: number;
  healBonus: number;
}

/** レベルアップ選択肢 */
export interface LevelUpChoice {
  stat: StatTypeValue;
  increase: number;
  description: string;
}

// ===== 罠関連の型定義 =====

/** 罠の種類 */
export const TrapType = {
  DAMAGE: 'damage',
  SLOW: 'slow',
  TELEPORT: 'teleport',
} as const;

export type TrapTypeValue = (typeof TrapType)[keyof typeof TrapType];

/** 罠の状態 */
export const TrapState = {
  HIDDEN: 'hidden',
  REVEALED: 'revealed',
  TRIGGERED: 'triggered',
} as const;

export type TrapStateValue = (typeof TrapState)[keyof typeof TrapState];

/** 罠データ */
export interface Trap {
  id: string;
  x: number;
  y: number;
  type: TrapTypeValue;
  state: TrapStateValue;
  isVisibleToThief: boolean;
  cooldownUntil?: number;
}

// ===== 壁関連の型定義 =====

/** 壁の種類 */
export const WallType = {
  NORMAL: 'normal',
  BREAKABLE: 'breakable',
  PASSABLE: 'passable',
  INVISIBLE: 'invisible',
} as const;

export type WallTypeValue = (typeof WallType)[keyof typeof WallType];

/** 壁の状態 */
export const WallState = {
  INTACT: 'intact',
  DAMAGED: 'damaged',
  BROKEN: 'broken',
  REVEALED: 'revealed',
} as const;

export type WallStateValue = (typeof WallState)[keyof typeof WallState];

/** 壁データ */
export interface Wall {
  x: number;
  y: number;
  type: WallTypeValue;
  state: WallStateValue;
  hp?: number;
}

/** プレイヤー状態 */
export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  direction: DirectionValue;
  isInvincible: boolean;
  invincibleUntil: number;
  attackCooldownUntil: number;
  // MVP3追加
  playerClass: PlayerClassValue;
  level: number;
  killCount: number;
  stats: PlayerStats;
  slowedUntil: number;
  // MVP6追加
  hasKey: boolean;
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
  tiles?: Position[];
}

/** 通路データ */
export interface Corridor {
  start: Position;
  end: Position;
  horizontal: boolean;
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

// ===== 自動マッピング関連の型定義 =====

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

// ===== 敵関連の型定義 =====

/** 敵の種類 */
export const EnemyType = {
  PATROL: 'patrol',
  CHARGE: 'charge',
  RANGED: 'ranged',
  SPECIMEN: 'specimen',
  BOSS: 'boss',
} as const;

export type EnemyTypeValue = (typeof EnemyType)[keyof typeof EnemyType];

/** 敵の状態 */
export const EnemyState = {
  IDLE: 'idle',
  PATROL: 'patrol',
  CHASE: 'chase',
  ATTACK: 'attack',
  FLEE: 'flee',
  RETURN: 'return',
  KNOCKBACK: 'knockback',
} as const;

export type EnemyStateValue = (typeof EnemyState)[keyof typeof EnemyState];

/** 敵データ */
export interface Enemy {
  id: string;
  x: number;
  y: number;
  type: EnemyTypeValue;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  detectionRange: number;
  chaseRange?: number;
  attackRange: number;
  attackCooldownUntil: number;
  state: EnemyStateValue;
  patrolPath?: Position[];
  patrolIndex?: number;
  homePosition: Position;
  lastKnownPlayerPos?: Position;
  lastSeenAt?: number;
  lastMoveAt?: number;
  knockbackUntil?: number;
  knockbackDirection?: DirectionValue;
}

// ===== アイテム関連の型定義 =====

/** アイテム種別 */
export const ItemType = {
  HEALTH_SMALL: 'health_small',
  HEALTH_LARGE: 'health_large',
  HEALTH_FULL: 'health_full',
  LEVEL_UP: 'level_up',
  MAP_REVEAL: 'map_reveal',
  KEY: 'key',
} as const;

export type ItemTypeValue = (typeof ItemType)[keyof typeof ItemType];

/** アイテムデータ */
export interface Item {
  id: string;
  x: number;
  y: number;
  type: ItemTypeValue;
  healAmount: number;
}

// ===== 戦闘関連の型定義 =====

/** 戦闘の一時状態 */
export interface CombatState {
  lastAttackAt: number;
  lastDamageAt: number;
}

// ===== ゲーム状態 =====

/** ゲーム全体の状態 */
export interface GameState {
  map: GameMap;
  player: Player;
  screen: ScreenStateValue;
  isCleared: boolean;
  enemies: Enemy[];
  items: Item[];
  // MVP3追加
  traps: Trap[];
  walls: Wall[];
  isLevelUpPending: boolean;
}

// ===== MVP4 エンディング関連の型定義 =====

/** 評価ランク */
export const Rating = {
  S: 's',
  A: 'a',
  B: 'b',
  C: 'c',
  D: 'd',
} as const;

export type RatingValue = (typeof Rating)[keyof typeof Rating];

/** エピローグテキスト */
export interface EpilogueText {
  title: string;
  text: string;
}

// ===== MVP4 タイマー関連の型定義 =====

/** タイマー状態 */
export const TimerState = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
} as const;

export type TimerStateValue = (typeof TimerState)[keyof typeof TimerState];

/** ゲームタイマー */
export interface GameTimer {
  state: TimerStateValue;
  startTime: number;
  pausedTime: number;
  totalPausedDuration: number;
}

// ===== MVP4 記録関連の型定義 =====

/** ゲーム記録 */
export interface GameRecord {
  time: number;
  rating: RatingValue;
  playerClass: PlayerClassValue;
  date: string;
}

/** ベスト記録（職業別） */
export interface BestRecords {
  [PlayerClass.WARRIOR]?: GameRecord;
  [PlayerClass.THIEF]?: GameRecord;
}

// ===== MVP4 チュートリアル関連の型定義 =====

/** チュートリアルステップの種類 */
export const TutorialStepType = {
  MOVEMENT: 'movement',
  ATTACK: 'attack',
  MAP: 'map',
  ITEM: 'item',
  TRAP: 'trap',
  GOAL: 'goal',
} as const;

export type TutorialStepTypeValue = (typeof TutorialStepType)[keyof typeof TutorialStepType];

/** チュートリアルステップ */
export interface TutorialStep {
  id: TutorialStepTypeValue;
  title: string;
  text: string;
  condition?: string;
}

/** チュートリアル状態 */
export interface TutorialState {
  isCompleted: boolean;
  currentStep: number;
  isVisible: boolean;
}

// ===== MVP4 フィードバック関連の型定義 =====

/** フィードバックの種類 */
export const FeedbackType = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  LEVEL_UP: 'level_up',
  TRAP: 'trap',
  ITEM_PICKUP: 'item_pickup',
  BOSS_KILL: 'boss_kill',
  SPEED_BOOST: 'speed_boost',
} as const;

export type FeedbackTypeValue = (typeof FeedbackType)[keyof typeof FeedbackType];

/** フィードバックエフェクト */
export interface FeedbackEffect {
  id: string;
  type: FeedbackTypeValue;
  x: number;
  y: number;
  text?: string;
  color: string;
  startTime: number;
  duration: number;
}

// ===== MVP5 音声関連の型定義 =====

/** 効果音の種類 */
export const SoundEffectType = {
  // 既存 10 種
  PLAYER_DAMAGE: 'player_damage',
  ENEMY_KILL: 'enemy_kill',
  BOSS_KILL: 'boss_kill',
  GAME_CLEAR: 'game_clear',
  GAME_OVER: 'game_over',
  LEVEL_UP: 'level_up',
  ATTACK_HIT: 'attack_hit',
  ITEM_PICKUP: 'item_pickup',
  HEAL: 'heal',
  TRAP_TRIGGERED: 'trap_triggered',
  // 新規 12 種
  MOVE_STEP: 'move_step',
  WALL_BUMP: 'wall_bump',
  ATTACK_SWING: 'attack_swing',
  ATTACK_MISS: 'attack_miss',
  ENEMY_DAMAGE: 'enemy_damage',
  DODGE: 'dodge',
  KEY_PICKUP: 'key_pickup',
  DOOR_OPEN: 'door_open',
  SPEED_BOOST: 'speed_boost',
  WALL_BREAK: 'wall_break',
  TELEPORT: 'teleport',
  DYING: 'dying',
} as const;

export type SoundEffectTypeValue = (typeof SoundEffectType)[keyof typeof SoundEffectType];

/** BGMの種類 */
export const BgmType = {
  TITLE: 'title',
  GAME: 'game',
  CLEAR: 'clear',
  GAME_OVER: 'game_over',
} as const;

export type BgmTypeValue = (typeof BgmType)[keyof typeof BgmType];

/** 音声設定 */
export interface AudioSettings {
  masterVolume: number;
  seVolume: number;
  bgmVolume: number;
  isMuted: boolean;
}

/** 音声設定のデフォルト値 */
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  seVolume: 0.8,
  bgmVolume: 0.5,
  isMuted: false,
};

/** 効果音設定 */
export interface SoundConfig {
  frequency: number;
  type: OscillatorType;
  duration: number;
  gain: number;
  sweep?: number;
}

/** メロディノート（周波数, 長さ） */
export type MelodyNote = readonly [number, number];
