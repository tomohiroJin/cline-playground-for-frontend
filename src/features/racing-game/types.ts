// Racing Game 型定義

export type Point = { x: number; y: number };
export type Checkpoint = Point & { idx: number };
export type StartLine = {
  cx: number;
  cy: number;
  px: number;
  py: number;
  dx: number;
  dy: number;
  len: number;
};
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
};
export type Spark = { x: number; y: number; vx: number; vy: number; color: string; life: number };
export type Confetti = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  rotSpd: number;
};

export interface Course {
  name: string;
  bg: string;
  ground: string;
  deco: 'forest' | 'city' | 'mountain' | 'beach' | 'night' | 'snow';
  pts: Array<[number, number]>;
  points: Point[];
  checkpoints: number[];
  checkpointCoords: Checkpoint[];
}

// === ゲーム状態拡張 ===

export type GamePhase = 'menu' | 'countdown' | 'race' | 'draft' | 'result';

// === ドリフトシステム ===

export interface DriftState {
  active: boolean;        // ドリフト中かどうか
  duration: number;       // 継続時間（秒）
  slipAngle: number;      // 現在のスリップ角（ラジアン）
  boostRemaining: number; // ブースト残り時間（秒）
  boostPower: number;     // 現在のブースト力
}

// === HEAT システム ===

export interface HeatState {
  gauge: number;          // 現在のゲージ値 (0〜1)
  boostRemaining: number; // ブースト残り時間（秒）
  boostPower: number;     // 現在のブースト力
  cooldown: number;       // クールダウン残り時間（秒）
}

// === コース環境効果 ===

export interface CourseEffect {
  name: string;
  frictionMultiplier: number;      // 摩擦係数倍率（1.0 = 変化なし）
  driftAngleBonus: number;         // ドリフト角度ボーナス（ラジアン）
  speedModifier: number;           // 速度修正（加減算、0 = 変化なし）
  visualEffect: 'none' | 'rain' | 'leaves' | 'snow' | 'vignette';
  segmentBased: boolean;           // セグメントごとに効果が異なるか
}

// === ドラフトカード ===

export type CardCategory = 'speed' | 'handling' | 'defense' | 'special';
export type CardRarity = 'R' | 'SR' | 'SSR';

export interface CardEffect {
  speedMultiplier?: number;       // 最高速度倍率
  accelMultiplier?: number;       // 加速力倍率
  turnMultiplier?: number;        // 旋回速度倍率
  driftBoostMultiplier?: number;  // ドリフトブースト倍率
  wallDamageMultiplier?: number;  // 壁ダメージ倍率（< 1 で軽減）
  heatGainMultiplier?: number;    // HEAT蓄積速度倍率
  shieldCount?: number;           // シールド回数
  specialType?: string;           // 特殊効果タイプ
  duration?: number;              // 効果時間（秒、ラップ全体ではない場合）
}

export interface Card {
  id: string;
  name: string;
  category: CardCategory;
  rarity: CardRarity;
  description: string;
  effect: CardEffect;
  icon: string;
}

export interface DeckState {
  pool: Card[];          // 残りデッキ
  hand: Card[];          // 現在の手札（3枚）
  active: CardEffect[];  // 現在適用中の効果
  history: Card[];       // 選択済みカード履歴
}

// === ゴースト ===

export interface GhostFrame {
  x: number;      // X座標
  y: number;      // Y座標
  angle: number;  // 車体角度（ラジアン）
  speed: number;  // 速度
  lap: number;    // 現在のラップ数
  t: number;      // レース開始からの経過時間（ms）
}

export interface GhostData {
  frames: GhostFrame[];
  totalTime: number;     // 総レース時間（ms）
  course: number;        // コースインデックス (0-5)
  laps: number;          // 周回数
  date: string;          // 記録日時（ISO 8601）
  playerName: string;    // プレイヤー名
}

// === ハイライト ===

export type HighlightType =
  | 'drift_bonus'
  | 'heat_boost'
  | 'near_miss'
  | 'overtake'
  | 'fastest_lap'
  | 'photo_finish';

export interface HighlightEvent {
  type: HighlightType;
  player: number;     // プレイヤーインデックス（0 or 1）
  lap: number;        // 発生ラップ
  time: number;       // レース開始からの経過時間（ms）
  score: number;      // 獲得スコア
  message: string;    // 通知テキスト
}

// === Player 型（ドリフト・HEAT・カード効果フィールドを追加） ===

export interface Player {
  x: number;
  y: number;
  angle: number;
  color: string;
  name: string;
  isCpu: boolean;
  lap: number;
  checkpointFlags: number;
  lapTimes: number[];
  lapStart: number;
  speed: number;
  wallStuck: number;
  progress: number;
  lastSeg: number;
  drift: DriftState;
  heat: HeatState;
  activeCards: CardEffect[];
  shieldCount: number;
}

export type Decoration = { x: number; y: number; variant: number };

export interface GameResults {
  winnerName: string;
  winnerColor: string;
  times: { p1: number; p2: number };
  fastest: number;
}
