import { CONFIG, CONTENT } from './constants';

// ==================== TYPES ====================
export type Difficulty = keyof typeof CONFIG.difficulties;
export type EntityType = keyof typeof CONTENT.items;
export type SoundName = keyof typeof CONTENT.sounds;
export type EnemyType = 'wanderer' | 'chaser' | 'teleporter';
export type EnemyAIState = 'patrol' | 'chase' | 'search';

/** 投擲中の石 */
export interface StoneProjectile {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  /** 飛行距離の累計（最大飛距離の判定に使う） */
  traveled: number;
}

export interface Entity {
  x: number;
  y: number;
}

export interface Player extends Entity {
  angle: number;
  stamina: number;
}

export interface Enemy extends Entity {
  dir: number;
  active: boolean;
  actTime: number;
  lastSeenX: number;
  lastSeenY: number;
  type: EnemyType;
  path: { x: number; y: number }[];
  pathTime: number;
  teleportCooldown: number;
  /** AI 状態機械の現在状態 */
  aiState: EnemyAIState;
  /** 捜索状態の残り時間（ms） */
  searchTimer: number;
  /** 追跡中に視線を失ってからの経過時間（ms） */
  loseSightTimer: number;
}

export interface Item extends Entity {
  type: EntityType;
  got: boolean;
  /** 捕縛時に落とした鍵は true（再回収時にスコア/コンボを与えない目印） */
  dropped?: boolean;
}

export interface Sprite extends Entity {
  type: string;
  emoji: string;
  name: string;
  color: string;
  bgColor: string;
  sc?: number;
  glow?: boolean;
  bob?: boolean;
  pulse?: boolean;
  isEnemy?: boolean;
}

export interface GameState {
  maze: number[][];
  items: Item[];
  enemies: Enemy[];
  difficulty: Difficulty;
  player: Player;
  exit: Entity;
  keys: number;
  reqKeys: number;
  time: number;
  lives: number;
  maxLives: number;
  hiding: boolean;
  energy: number;
  invince: number;
  sprinting: boolean;
  speedBoost: number;
  eSpeed: number;
  gTime: number;
  lastT: number;
  timers: { footstep: number; enemySound: number; heartbeat: number };
  msg: string | null;
  msgTimer: number;
  score: number;
  combo: number;
  lastKeyTime: number;
  explored: Record<string, boolean>;
  /** 石の所持数 */
  stones: number;
  /** 加速チャージの所持数（Eキー/ボタンで発動） */
  speedCharges: number;
  /** 敵位置表示の残り時間 ms（地図取得でセット、>0 の間ミニマップに全敵表示） */
  enemyRevealTimer: number;
  /** 飛行中の石 */
  stoneProjectiles: StoneProjectile[];
  /** 敵の発見可能距離（難易度依存） */
  sightRange: number;
  /** 敵の捜索持続時間 ms（難易度依存） */
  searchDuration: number;
}

export interface HUDData {
  keys: number;
  req: number;
  maxL: number;
  lives: number;
  stamina: number;
  time: number;
  score: number;
  eNear: number;
  hide: boolean;
  energy: number;
  highScore: number;
  /** 石の所持数 */
  stones: number;
  sprinting: boolean;
  /** 加速チャージの所持数 */
  speedCharges: number;
  /** 加速効果中か（ボタン点灯表示に使う） */
  boostActive: boolean;
}
