export type Vector = {
  x: number;
  y: number;
};

export type Velocity = {
  vx: number;
  vy: number;
};

export type Entity = Vector & Velocity;

export type Mallet = Entity;

export type Puck = Entity & {
  visible: boolean;
  invisibleCount: number;
  trail?: Vector[];
};

export type ItemType = 'split' | 'speed' | 'invisible' | 'shield' | 'magnet' | 'big';

export type Item = Entity & {
  id: ItemType;
  name: string;
  color: string;
  icon: string;
  r: number;
};

export type EffectState = {
  speed: { start: number; duration: number } | null;
  invisible: number;
  shield: boolean;
  magnet: { start: number; duration: number } | null;
  big: { start: number; duration: number; scale: number } | null;
};

export type GameEffects = {
  player: EffectState;
  cpu: EffectState;
  ally?: EffectState;   // 2v2 時のみ（P2 味方）
  enemy?: EffectState;  // 2v2 時のみ（P4 敵2）
};

export type GoalEffect = {
  scorer: 'player' | 'cpu';
  time: number;
};

export type FeverState = {
  active: boolean;
  lastGoalTime: number;
  extraPucks: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

export type Difficulty = 'easy' | 'normal' | 'hard';

export type Obstacle = Vector & { r: number };

// 障害物の破壊状態を管理
export type ObstacleState = {
  hp: number;
  maxHp: number;
  destroyed: boolean;
  destroyedAt: number; // 破壊された時刻（復活タイマー用）
};

export type FieldConfig = {
  readonly id: string;
  readonly name: string;
  readonly goalSize: number;
  readonly color: string;
  readonly obstacles: readonly Obstacle[];
  readonly destructible?: boolean; // 障害物が破壊可能かどうか
  readonly obstacleHp?: number;
  readonly obstacleRespawnMs?: number;
};

export type GameState = {
  player: Mallet;
  cpu: Mallet;
  ally?: Mallet;       // P2 味方（2v2 時のみ）
  enemy?: Mallet;      // P4 敵2（2v2 時のみ）
  pucks: Puck[];
  items: Item[];
  effects: GameEffects;
  flash: { type: ItemType; time: number } | null;
  goalEffect: GoalEffect | null;
  lastItemSpawn: number;
  cpuTarget: Vector | null;
  cpuTargetTime: number;
  cpuStuckTimer: number;
  // 2v2 モード用の追加 AI 状態
  allyTarget?: Vector | null;
  allyTargetTime?: number;
  allyStuckTimer?: number;
  enemyTarget?: Vector | null;
  enemyTargetTime?: number;
  enemyStuckTimer?: number;
  fever: FeverState;
  particles: Particle[];
  obstacleStates: ObstacleState[]; // 障害物の破壊状態
  combo: ComboState;
};

export type ComboState = {
  count: number;
  lastScorer: 'player' | 'cpu' | undefined;
};

export type MatchStats = {
  playerHits: number;
  cpuHits: number;
  maxPuckSpeed: number;
  playerItemsCollected: number;
  cpuItemsCollected: number;
  playerSaves: number;
  cpuSaves: number;
  matchDuration: number;
};

export type GamePhase = 'countdown' | 'playing' | 'paused' | 'finished';

export type ShakeState = {
  intensity: number;
  duration: number;
  startTime: number;
};

// ヒットストップ状態（強打時の物理更新停止 + 衝撃波演出）
export type HitStopState = {
  active: boolean;
  framesRemaining: number;
  impactX: number;
  impactY: number;
  shockwaveRadius: number;
  shockwaveMaxRadius: number;
};

// スローモーション状態（ゴール時の演出）
export type SlowMotionState = {
  active: boolean;
  startTime: number;
  duration: number;
};

// キャラクターのリアクションテキスト（得点・失点・勝利・敗北 各複数パターン）
export type CharacterReaction = {
  onScore: string[];
  onConcede: string[];
  onWin: string[];
  onLose: string[];
};

// 立ち絵画像パスのセット（通常・嬉しい）
export type PortraitSet = {
  normal: string;
  happy: string;
};

// 対戦キャラクター定義
export type Character = {
  id: string;
  name: string;
  icon: string;
  color: string;
  reactions: CharacterReaction;
  portrait?: PortraitSet;
  vsImage?: string;
};

// ゲームモード
export type GameMode = 'free' | 'story' | '2p-local' | '2v2-local';

// エフェクト適用対象（2v2 時は ally/enemy も対象）
export type EffectTarget = 'player' | 'cpu' | 'ally' | 'enemy';

// 2v2 モードのプレイヤースロット（domain/contracts/input から re-export）
export type { PlayerSlot } from '../domain/contracts/input';

export type SoundSystem = {
  hit: (speed?: number) => void;
  wall: (angle?: number) => void;
  item: () => void;
  goal: () => void;
  lose: () => void;
  start: () => void;
  countdown: () => void;
  go: () => void;
  bgmStart: () => void;
  bgmStop: () => void;
  bgmSetTempo: (tempo: number) => void;
  setBgmVolume: (volume: number) => void;
  setSeVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
};

// キャラクターのプロフィール情報（図鑑表示用）
export type CharacterProfile = {
  characterId: string;
  fullName: string;
  reading: string;
  grade: string;
  age: number;
  birthday: string;
  height: string;
  school: string;
  club: string;
  personality: string[];
  quote: string;
  playStyle: string;
  specialMove: string;
  specialMoveDesc: string;
  description: string;
};

// アンロック条件
export type UnlockCondition =
  | { type: 'default' }
  | { type: 'story-clear'; stageId: string }
  | { type: 'hidden' }; // 現時点では解放不可（将来のアップデートで解放条件を追加予定）

// 図鑑エントリ（プロフィール + アンロック条件の組み合わせ）
export type DexEntry = {
  profile: CharacterProfile;
  unlockCondition: UnlockCondition;
};

// 図鑑の永続化データ
export type DexProgress = {
  unlockedCharacterIds: string[];
  newlyUnlockedIds: string[];
};
