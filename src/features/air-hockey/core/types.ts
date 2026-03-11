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
  pucks: Puck[];
  items: Item[];
  effects: GameEffects;
  flash: { type: ItemType; time: number } | null;
  goalEffect: GoalEffect | null;
  lastItemSpawn: number;
  cpuTarget: Vector | null;
  cpuTargetTime: number;
  cpuStuckTimer: number;
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
};

// ゲームモード（フリー対戦 or ストーリー）
export type GameMode = 'free' | 'story';

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
