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
  hp: number;
  maxHp: number;
  direction: DirectionValue;
  isInvincible: boolean;
  invincibleUntil: number;
  attackCooldownUntil: number;
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
  GAME_OVER: 'game_over',
} as const;

export type ScreenStateValue = (typeof ScreenState)[keyof typeof ScreenState];

/** ゲーム全体の状態 */
export interface GameState {
  map: GameMap;
  player: Player;
  screen: ScreenStateValue;
  isCleared: boolean;
  enemies: Enemy[];
  items: Item[];
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
  tiles?: Position[]; // 実際の床タイル座標リスト（境界ボックス内の壁を避けるため）
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

// ===== 自動マッピング関連の型定義 =====

/** タイルの探索状態 */
export const ExplorationState = {
  UNEXPLORED: 0, // 未探索（非表示）
  EXPLORED: 1, // 通過済み（線表示）
  VISIBLE: 2, // 可視（隣接タイル）
} as const;

export type ExplorationStateValue = (typeof ExplorationState)[keyof typeof ExplorationState];

/** 自動マッピング状態 */
export interface AutoMapState {
  exploration: ExplorationStateValue[][];
  isMapVisible: boolean; // 常時表示ON/OFF
  isFullScreen: boolean; // 全画面モード
}

/** 敵の種類 */
export const EnemyType = {
  PATROL: 'patrol',
  CHARGE: 'charge',
  FLEE: 'flee',
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

/** アイテム種別 */
export const ItemType = {
  HEALTH_SMALL: 'health_small',
  HEALTH_LARGE: 'health_large',
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

/** 戦闘の一時状態 */
export interface CombatState {
  lastAttackAt: number;
  lastDamageAt: number;
}
