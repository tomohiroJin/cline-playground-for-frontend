// ============================================================================
// Deep Sea Interceptor - 型定義
// ============================================================================

/** 敵タイプ */
export type EnemyType =
  | 'basic' | 'fast' | 'shooter' | 'tank' | 'mine'
  | 'boss' | 'boss1' | 'boss2' | 'boss3' | 'boss4' | 'boss5'
  | 'midboss1' | 'midboss2' | 'midboss3' | 'midboss4' | 'midboss5';

/** アイテムタイプ */
export type ItemType = 'power' | 'speed' | 'shield' | 'spread' | 'bomb' | 'life';

/** 武器タイプ */
export type WeaponType = 'torpedo' | 'sonarWave' | 'bioMissile';

/** 難易度 */
export type Difficulty = 'cadet' | 'standard' | 'abyss';

/** 座標 */
export interface Position {
  x: number;
  y: number;
}

/** 基本エンティティ */
export interface BaseEntity extends Position {
  id: number;
  createdAt: number;
}

/** プレイヤーの弾 */
export interface Bullet extends BaseEntity {
  type: 'bullet';
  weaponType: WeaponType;
  charged: boolean;
  angle: number;
  speed: number;
  damage: number;
  size: number;
  piercing: boolean;
  homing: boolean;
  homingTarget?: number;
  lifespan?: number;
}

/** 敵キャラクター */
export interface Enemy extends BaseEntity {
  type: 'enemy';
  enemyType: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  points: number;
  size: number;
  canShoot: boolean;
  fireRate: number;
  lastShotAt: number;
  movementPattern: number;
  angle: number;
  bossPhase: number;
}

/** 敵の弾 */
export interface EnemyBullet extends BaseEntity {
  type: 'enemyBullet';
  vx: number;
  vy: number;
  size: number;
}

/** アイテム */
export interface Item extends BaseEntity {
  type: 'item';
  itemType: ItemType;
  size: number;
  speed: number;
}

/** パーティクル */
export interface Particle extends BaseEntity {
  type: 'particle';
  color: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

/** 泡 */
export interface Bubble extends BaseEntity {
  size: number;
  speed: number;
  opacity: number;
}

/** ゲーム内部状態（ref で管理） */
export interface GameState {
  player: { x: number; y: number };
  bullets: Bullet[];
  enemies: Enemy[];
  enemyBullets: EnemyBullet[];
  items: Item[];
  particles: Particle[];
  bubbles: Bubble[];
  charging: boolean;
  chargeLevel: number;
  chargeStartTime: number;
  spawnTimer: number;
  bossDefeated: boolean;
  bossDefeatedTime: number;
  invincible: boolean;
  invincibleEndTime: number;
  input: { dx: number; dy: number };
  keys: Record<string, boolean>;
  combo: number;
  comboTimer: number;
  maxCombo: number;
  grazeCount: number;
  grazedBulletIds: Set<number>;
  gameStartTime: number;
  // 演出用フィールド
  bossWarning: boolean;
  bossWarningStartTime: number;
  screenShake: number;
  screenFlash: number;
  stageClearTime: number;
  grazeFlashTime: number;
  // ミッドボス用
  midBossSpawned: boolean;
  // 環境ギミック用
  currentDirection: number;
  currentChangeTime: number;
  thermalVents: ThermalVent[];
  thermalVentTimer: number;
  luminescence: boolean;
  luminescenceEndTime: number;
  pressureBounds: { left: number; right: number };
}

/** UI表示用状態（React state で管理） */
export interface UiState {
  stage: number;
  score: number;
  lives: number;
  highScore: number;
  power: number;
  spreadTime: number;
  shieldEndTime: number;
  speedLevel: number;
  combo: number;
  multiplier: number;
  grazeCount: number;
  maxCombo: number;
  difficulty: Difficulty;
  weaponType: WeaponType;
}

/** プレイ統計（リザルト画面用） */
export interface PlayStats {
  score: number;
  maxCombo: number;
  grazeCount: number;
  livesLost: number;
  playTime: number;
  difficulty: Difficulty;
  weaponType: WeaponType;
  stagesCleared: number;
  rank: string;
}

/** 熱水柱（Stage 3 ギミック） */
export interface ThermalVent {
  x: number;
  width: number;
  active: boolean;
  startTime: number;
  warningTime: number;
}

/** 実績定義 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (stats: PlayStats) => boolean;
}

/** 保存済み実績データ */
export interface SavedAchievementData {
  unlockedIds: string[];
  lastUpdated: number;
}

/** オーディオイベント（副作用分離用） */
export type AudioEvent = { readonly name: string };

/** 移動可能エンティティ */
export type MovableEntity = Position & { speed: number };

/** 角度指定移動エンティティ */
export type AngleEntity = Position & { angle: number; speed: number };

/** 速度ベクトル移動エンティティ */
export type VelocityEntity = Position & { vx: number; vy: number };

/** サウンド定義 */
export interface SoundDef {
  f: number;
  w: OscillatorType;
  g: number;
  d: number;
  ef?: number;
}
