# Racing Game リファクタリング仕様書

> 文書ID: RG-20260320-01-SPEC
> 作成日: 2026-03-20
> 関連計画書: RG-20260320-01-PLAN
> ステータス: ドラフト

---

## 目次

1. [ドメインモデル仕様](#1-ドメインモデル仕様)
2. [アプリケーション層仕様](#2-アプリケーション層仕様)
3. [インフラストラクチャ層仕様](#3-インフラストラクチャ層仕様)
4. [プレゼンテーション層仕様](#4-プレゼンテーション層仕様)
5. [DbC（契約）仕様](#5-dbc契約仕様)
6. [テスト仕様](#6-テスト仕様)
7. [移行仕様](#7-移行仕様)

---

## 1. ドメインモデル仕様

### 1.1 Player 境界コンテキスト

#### 1.1.1 Player エンティティ

**責務**: プレイヤーの状態保持と移動計算

```typescript
// domain/player/types.ts

/** プレイヤーの不変な識別情報 */
interface PlayerIdentity {
  readonly name: string;
  readonly color: string;
  readonly isCpu: boolean;
}

/** プレイヤーの可変な状態 */
interface PlayerState {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly speed: number;       // 0〜1 の正規化速度
  readonly wallStuck: number;   // 壁接触カウンター
  readonly lap: number;
  readonly checkpointFlags: number;
  readonly lapTimes: readonly number[];
  readonly lapStart: number;
  readonly progress: number;
  readonly lastSeg: number;
  readonly drift: DriftState;
  readonly heat: HeatState;
  readonly activeCards: readonly CardEffect[];
  readonly shieldCount: number;
}

/** Player = Identity + State（イミュータブル） */
type Player = PlayerIdentity & PlayerState;
```

**不変条件**:
- `speed` は常に `[0, 1]` の範囲内
- `lap` は常に `>= 1`
- `wallStuck` は常に `>= 0`
- `checkpointFlags` は有効なビットマスク

#### 1.1.2 Player 操作関数

```typescript
// domain/player/player.ts

/** プレイヤーを移動させる（純粋関数） */
function movePlayer(
  player: Player,
  baseSpeed: number,
  trackInfo: TrackInfo,
  input: PlayerInput,
  modifiers: SpeedModifiers,
): MoveResult;

/** 移動結果の型 */
interface MoveResult {
  readonly player: Player;
  readonly trackInfo: TrackInfo;
  readonly velocity: number;
  readonly wallHit: boolean;
  readonly wallStage: WallStage;
}

/** 壁接触段階（値オブジェクト） */
type WallStage = 0 | 1 | 2 | 3;

/** 速度修正パラメータ（Strategy パターンの入力） */
interface SpeedModifiers {
  readonly friction: number;        // コース摩擦係数
  readonly speedModifier: number;   // コース速度修正
  readonly accelMultiplier: number; // カード加速倍率
  readonly driftBoostMultiplier: number; // ドリフトブースト倍率
}
```

#### 1.1.3 PlayerFactory

```typescript
// domain/player/player-factory.ts

interface CreatePlayerConfig {
  readonly position: Point;
  readonly angle: number;
  readonly color: string;
  readonly name: string;
  readonly isCpu: boolean;
}

/** 単一プレイヤーの生成 */
function createPlayer(config: CreatePlayerConfig): Player;

/** ゲームモードに応じたプレイヤー群の生成 */
function createPlayers(
  mode: GameMode,
  startPosition: Point,
  startAngle: number,
  colors: readonly [string, string],
  names: readonly [string, string],
): Player[];
```

**事前条件**:
- `colors` の各要素は有効な CSS カラー文字列
- `position` は有効な座標（NaN でない）

#### 1.1.4 DriftState（値オブジェクト）

```typescript
// domain/player/drift.ts

/** ドリフト状態の初期値 */
function createDriftState(): DriftState;

/** ドリフト開始 */
function startDrift(state: DriftState, speed: number): DriftState;
// 事前条件: speed ∈ [0, 1]
// 事後条件: speed >= MIN_SPEED → result.active === true

/** ドリフト更新（毎フレーム） */
function updateDrift(state: DriftState, steering: number, speed: number, dt: number): DriftState;
// 事前条件: dt > 0
// 事後条件: state.active → result.duration >= state.duration

/** ドリフト終了（通常） → ブースト付与 */
function endDrift(state: DriftState): DriftState;
// 事後条件: result.active === false, result.boostRemaining >= 0

/** ドリフトキャンセル（壁/衝突） → ブーストなし */
function cancelDrift(state: DriftState): DriftState;
// 事後条件: result.active === false, result.boostRemaining === 0

/** ブースト値の取得 */
function getDriftBoost(state: DriftState): number;
// 事後条件: result >= 0

/** 速度維持率の取得 */
function getDriftSpeedRetain(): number;
// 事後条件: result ∈ (0, 1]
```

#### 1.1.5 HeatState（値オブジェクト）

```typescript
// domain/player/heat.ts

/** HEAT 状態の初期値 */
function createHeatState(): HeatState;

/** HEAT ゲージの更新 */
function updateHeat(
  state: HeatState,
  wallDist: number,
  carDist: number,
  dt: number,
  gainMultiplier: number,
): HeatState;
// 事前条件: dt > 0, gainMultiplier > 0
// 事後条件: result.gauge ∈ [0, 1]

/** HEAT ブースト値の取得 */
function getHeatBoost(state: HeatState): number;
// 事後条件: result >= 0
```

#### 1.1.6 CpuStrategy（Strategy パターン）

```typescript
// domain/player/cpu-strategy.ts

/** CPU AI の思考インターフェース */
interface CpuStrategy {
  /** 旋回量を計算 */
  calculateTurn(player: Player, trackInfo: TrackInfo, trackPoints: readonly Point[]): number;
  /** ドリフトすべきか判定 */
  shouldDrift(player: Player, trackInfo: TrackInfo): boolean;
}

/** 難易度レベル */
type CpuDifficulty = 'easy' | 'normal' | 'hard';

/** 難易度に応じた Strategy の生成（Factory Method） */
function createCpuStrategy(difficulty: CpuDifficulty): CpuStrategy;
```

### 1.2 Race 境界コンテキスト

#### 1.2.1 Race 集約ルート

```typescript
// domain/race/types.ts

type GamePhase = 'menu' | 'countdown' | 'race' | 'draft' | 'result';
type GameMode = 'solo' | '2p' | 'cpu';

interface RaceConfig {
  readonly mode: GameMode;
  readonly courseIndex: number;
  readonly maxLaps: number;
  readonly baseSpeed: number;
  readonly cpuDifficulty: CpuDifficulty;
  readonly cardsEnabled: boolean;
}

interface RaceState {
  readonly phase: GamePhase;
  readonly players: readonly Player[];
  readonly raceStartTime: number;
  readonly winner: string | null;
  readonly paused: boolean;
}
```

#### 1.2.2 GamePhase（値オブジェクト）

```typescript
// domain/race/game-phase.ts

/** フェーズ遷移の妥当性チェック */
function canTransition(from: GamePhase, to: GamePhase): boolean;

/** 有効な遷移マップ */
const VALID_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  menu: ['countdown'],
  countdown: ['race'],
  race: ['draft', 'result'],
  draft: ['race'],
  result: ['menu'],
};

/** 安全なフェーズ遷移（無効な遷移は例外） */
function transition(from: GamePhase, to: GamePhase): GamePhase;
// 事前条件: canTransition(from, to) === true
```

#### 1.2.3 チェックポイント判定

```typescript
// domain/race/checkpoint.ts

/** チェックポイント通過判定 */
function updateCheckpoints(
  player: Player,
  checkpoints: readonly Checkpoint[],
  radius: number,
): { player: Player; newCheckpointPassed: boolean };
// 事前条件: radius > 0
// 事後条件: result.player.checkpointFlags >= player.checkpointFlags

/** 全チェックポイント通過済み判定 */
function allCheckpointsPassed(flags: number, totalCheckpoints: number): boolean;
// 事前条件: totalCheckpoints >= 0
```

#### 1.2.4 衝突判定

```typescript
// domain/race/collision.ts

interface CollisionResult {
  readonly player1: Player;
  readonly player2: Player;
  readonly contactPoint: Point;
}

/** 2プレイヤー間の衝突判定と解決 */
function handleCollision(
  p1: Player,
  p2: Player,
  collisionDist: number,
): CollisionResult | null;
// 事前条件: collisionDist > 0
```

### 1.3 Track 境界コンテキスト

#### 1.3.1 Track エンティティ

```typescript
// domain/track/types.ts

interface TrackInfo {
  readonly pt: Point;      // 最近接トラック上の点
  readonly seg: number;    // セグメントインデックス
  readonly dist: number;   // トラック中心からの距離
  readonly onTrack: boolean; // トラック上にいるか
  readonly dir: number;    // セグメント方向（ラジアン）
}

interface StartLine {
  readonly cx: number;
  readonly cy: number;
  readonly px: number;
  readonly py: number;
  readonly dx: number;
  readonly dy: number;
  readonly len: number;
}
```

```typescript
// domain/track/track.ts

/** トラック情報の取得 */
function getTrackInfo(x: number, y: number, points: readonly Point[]): TrackInfo;

/** スタートラインの計算 */
function calculateStartLine(points: readonly Point[]): StartLine;

/** 壁法線ベクトルの計算 */
function getWallNormal(segment: number, points: readonly Point[]): Point;
```

#### 1.3.2 CourseEffect（Strategy パターン）

```typescript
// domain/track/course-effect.ts

type CourseType = 'forest' | 'city' | 'mountain' | 'beach' | 'night' | 'snow';

interface CourseEffect {
  readonly name: string;
  readonly frictionMultiplier: number;
  readonly driftAngleBonus: number;
  readonly speedModifier: number;
  readonly visualEffect: VisualEffectType;
  readonly segmentBased: boolean;
}

type VisualEffectType = 'none' | 'rain' | 'leaves' | 'snow' | 'vignette';

/** コースタイプからエフェクトを取得 */
function getCourseEffect(courseType: CourseType): CourseEffect;

/** セグメントごとの摩擦係数を計算 */
function getSegmentFriction(
  effect: CourseEffect,
  segment: number,
  totalSegments: number,
  dist: number,
  trackWidth: number,
): number;
// 事後条件: result > 0

/** セグメントごとの速度修正を計算 */
function getSegmentSpeedModifier(
  effect: CourseEffect,
  segment: number,
  totalSegments: number,
): number;
```

#### 1.3.3 WallPhysics

```typescript
// domain/track/wall-physics.ts

/** 壁衝突時のペナルティ計算 */
function calculateWallPenalty(
  wallStuck: number,
  shieldCount: number,
  wallDamageMultiplier: number,
): { factor: number; newShieldCount: number; wallStage: WallStage };
// 事前条件: wallStuck >= 1
// 事後条件: result.factor ∈ (0, 1]

/** ワープすべきか判定 */
function shouldWarp(wallStuck: number): boolean;

/** ワープ先の計算 */
function calculateWarpDestination(
  segment: number,
  points: readonly Point[],
): { x: number; y: number; angle: number };

/** スライドベクトルの計算 */
function calculateSlideVector(
  angle: number,
  velocity: number,
  segment: number,
  points: readonly Point[],
): { slideX: number; slideY: number; slideMag: number };
```

### 1.4 Card 境界コンテキスト

#### 1.4.1 Card エンティティ

```typescript
// domain/card/types.ts

type CardCategory = 'speed' | 'handling' | 'defense' | 'special';
type CardRarity = 'R' | 'SR' | 'SSR';

interface Card {
  readonly id: string;
  readonly name: string;
  readonly category: CardCategory;
  readonly rarity: CardRarity;
  readonly description: string;
  readonly effect: CardEffect;
  readonly icon: string;
}

interface CardEffect {
  readonly speedMultiplier?: number;
  readonly accelMultiplier?: number;
  readonly turnMultiplier?: number;
  readonly driftBoostMultiplier?: number;
  readonly wallDamageMultiplier?: number;
  readonly heatGainMultiplier?: number;
  readonly shieldCount?: number;
  readonly specialType?: string;
  readonly duration?: number;
}
```

#### 1.4.2 Deck 集約ルート

```typescript
// domain/card/deck.ts

interface DeckState {
  readonly pool: readonly Card[];
  readonly hand: readonly Card[];
  readonly active: readonly CardEffect[];
  readonly history: readonly Card[];
}

/** デッキの生成 */
function createDeck(): DeckState;
// 事後条件: result.pool.length === TOTAL_CARDS

/** カードのドロー（n枚） */
function drawCards(deck: DeckState, count: number): DeckState;
// 事前条件: count > 0
// 事後条件: result.hand.length === count

/** カードの選択 */
function selectCard(deck: DeckState, cardId: string): DeckState;
// 事前条件: deck.hand.some(c => c.id === cardId)
// 事後条件: result.history includes selected card

/** CPU によるカード選択（ヒューリスティック） */
function cpuSelectCard(deck: DeckState, skill: number): DeckState;
// 事前条件: deck.hand.length > 0, skill ∈ [0, 1]

/** アクティブ効果のクリア（ラップ終了時） */
function clearActiveEffects(deck: DeckState): DeckState;
// 事後条件: result.active.length === 0
```

#### 1.4.3 CardEffect 計算

```typescript
// domain/card/card-effect.ts

interface ComputedCardEffects {
  readonly speedMultiplier: number;
  readonly accelMultiplier: number;
  readonly turnMultiplier: number;
  readonly driftBoostMultiplier: number;
  readonly wallDamageMultiplier: number;
  readonly heatGainMultiplier: number;
}

/** 複数カード効果の合算（加算方式） */
function computeCardEffects(effects: readonly CardEffect[]): ComputedCardEffects;
// 事後条件: 全 multiplier >= 0

/** 単一効果値の取得 */
function getCardMultiplier(
  effects: readonly CardEffect[],
  key: keyof CardEffect,
): number;
```

### 1.5 Highlight 境界コンテキスト

#### 1.5.1 HighlightTracker 集約

```typescript
// domain/highlight/types.ts

type HighlightType =
  | 'drift_bonus'
  | 'heat_boost'
  | 'near_miss'
  | 'overtake'
  | 'fastest_lap'
  | 'photo_finish';

interface HighlightEvent {
  readonly type: HighlightType;
  readonly player: number;
  readonly lap: number;
  readonly time: number;
  readonly score: number;
  readonly message: string;
}

interface HighlightTracker {
  readonly events: readonly HighlightEvent[];
  readonly playerStates: readonly PlayerHighlightState[];
}

interface PlayerHighlightState {
  readonly wasDrifting: boolean;
  readonly nearMissTime: number;
  readonly lastPosition: number;
  readonly wasHeatBoosting: boolean;
  readonly fastestLapTime: number;
}
```

```typescript
// domain/highlight/highlight.ts

/** トラッカーの初期化 */
function createTracker(playerCount: number): HighlightTracker;

/** サマリーの生成 */
function getSummary(tracker: HighlightTracker): HighlightSummary[];
```

```typescript
// domain/highlight/event-detector.ts

/** 各イベント検出関数（純粋関数） */
function detectDriftBonus(tracker: HighlightTracker, drift: DriftState, player: number, lap: number, time: number): DetectionResult;
function detectHeatBoost(tracker: HighlightTracker, heat: HeatState, player: number, lap: number, time: number): DetectionResult;
function detectNearMiss(tracker: HighlightTracker, wallDist: number, trackWidth: number, dt: number, player: number, lap: number, time: number): DetectionResult;
function detectOvertake(tracker: HighlightTracker, positions: readonly number[], player: number, lap: number, time: number): DetectionResult;
function detectFastestLap(tracker: HighlightTracker, lapTime: number, player: number, lap: number, time: number): DetectionResult;
function detectPhotoFinish(tracker: HighlightTracker, totalTimes: readonly number[], maxLaps: number, time: number): DetectionResult;

interface DetectionResult {
  readonly tracker: HighlightTracker;
  readonly event: HighlightEvent | null;
}
```

### 1.6 共通ドメインモジュール

#### 1.6.1 数学ユーティリティ

```typescript
// domain/shared/math-utils.ts

/** 値を範囲内にクランプ */
function clamp(value: number, min: number, max: number): number;
// 事後条件: result ∈ [min, max]

/** 角度を [-π, π] に正規化 */
function normalizeAngle(angle: number): number;
// 事後条件: result ∈ [-π, π]

/** 2点間の距離 */
function distance(x1: number, y1: number, x2: number, y2: number): number;
// 事後条件: result >= 0

/** ランダム整数 [0, max) */
function randomInt(max: number): number;
// 事前条件: max > 0
// 事後条件: result ∈ [0, max)

/** ランダム浮動小数 [min, max) */
function randomRange(min: number, max: number): number;
// 事前条件: min < max

/** 時間フォーマット（mm:ss.d） */
function formatTime(ms: number): string;
// 事前条件: ms >= 0
```

#### 1.6.2 アサーション関数

```typescript
// domain/shared/assertions.ts

/** 範囲チェック */
function assertInRange(value: number, min: number, max: number, name: string): asserts value is number;

/** 正の数チェック */
function assertPositive(value: number, name: string): asserts value is number;

/** 非null チェック */
function assertDefined<T>(value: T | undefined | null, name: string): asserts value is T;

/** 配列インデックスの安全なアクセス */
function safeIndex<T>(arr: readonly T[], index: number, fallback: T): T;
```

### 1.7 ドメインイベント

```typescript
// domain/events.ts

/** ドメインで発生するイベントの型定義 */
type DomainEvent =
  | { readonly type: 'lap_completed'; readonly player: number; readonly lap: number; readonly lapTime: number }
  | { readonly type: 'race_finished'; readonly winner: string; readonly totalTimes: readonly number[] }
  | { readonly type: 'collision'; readonly player1: number; readonly player2: number; readonly point: Point }
  | { readonly type: 'wall_hit'; readonly player: number; readonly stage: WallStage }
  | { readonly type: 'drift_start'; readonly player: number }
  | { readonly type: 'drift_end'; readonly player: number; readonly boostPower: number }
  | { readonly type: 'heat_boost'; readonly player: number }
  | { readonly type: 'checkpoint_passed'; readonly player: number; readonly checkpoint: number }
  | { readonly type: 'draft_triggered'; readonly player: number; readonly lap: number }
  | { readonly type: 'card_selected'; readonly player: number; readonly card: Card }
  | { readonly type: 'highlight'; readonly event: HighlightEvent };
```

---

## 2. アプリケーション層仕様

### 2.1 ポートインターフェース

#### 2.1.1 RendererPort

```typescript
// application/ports/renderer-port.ts

interface RendererPort {
  /** 背景描画 */
  renderBackground(course: Course): void;
  /** トラック描画 */
  renderTrack(points: readonly Point[]): void;
  /** プレイヤー車体描画 */
  renderKart(player: Player): void;
  /** HUD 描画 */
  renderHud(players: readonly Player[], courseName: string, maxLaps: number, raceStart: number): void;
  /** エフェクト描画 */
  renderEffects(particles: readonly Particle[], sparks: readonly Spark[]): void;
  /** ドラフトUI描画 */
  renderDraftUI(hand: readonly Card[], selectedIndex: number, timer: number, maxTimer: number, playerName: string, lap: number, confirmed: boolean, animProgress: number): void;
  /** ハイライト通知描画 */
  renderHighlightBanner(event: HighlightEvent, colors: Record<string, string>, index: number): void;
  /** カウントダウン描画 */
  renderCountdown(elapsed: number): void;
  /** リザルト描画 */
  renderResult(confetti: readonly Confetti[]): void;
  /** Canvas クリア・フレーム開始 */
  beginFrame(shake: number): void;
  /** フレーム終了 */
  endFrame(): void;
}
```

#### 2.1.2 AudioPort

```typescript
// application/ports/audio-port.ts

interface AudioPort {
  /** エンジン音の開始 */
  startEngine(): void;
  /** エンジン音の更新 */
  updateEngine(speed: number): void;
  /** エンジン音の停止 */
  stopEngine(): void;
  /** 効果音の再生 */
  playSfx(type: SfxType): void;
  /** 壁衝突音（段階別） */
  playWallHit(stage: WallStage): void;
  /** クリーンアップ */
  cleanup(): void;
}

type SfxType =
  | 'collision'
  | 'lap'
  | 'countdown'
  | 'go'
  | 'finish'
  | 'finalLap'
  | 'checkpoint'
  | 'driftStart'
  | 'driftBoost'
  | 'heatMax'
  | 'heatBoost'
  | 'cardSelect';
```

#### 2.1.3 StoragePort

```typescript
// application/ports/storage-port.ts

interface StoragePort {
  /** スコアの保存 */
  saveScore(gameId: string, score: number, key: string): Promise<void>;
  /** ハイスコアの取得 */
  getHighScore(gameId: string, key: string, order: 'asc' | 'desc'): Promise<number>;
}
```

#### 2.1.4 InputPort

```typescript
// application/ports/input-port.ts

interface InputState {
  readonly left: boolean;
  readonly right: boolean;
  readonly handbrake: boolean;
}

interface InputPort {
  /** 現在の入力状態を取得（指定プレイヤー） */
  getPlayerInput(playerIndex: number): InputState;
  /** ドラフトUI用の入力を取得 */
  getDraftInput(playerIndex: number): DraftInput;
  /** 入力状態のリセット */
  clearDraftInput(playerIndex: number, action: string): void;
}

interface DraftInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly confirm: boolean;
}
```

### 2.2 GameOrchestrator

```typescript
// application/game-orchestrator.ts

interface GameOrchestratorConfig {
  readonly renderer: RendererPort;
  readonly audio: AudioPort;
  readonly storage: StoragePort;
  readonly input: InputPort;
  readonly raceConfig: RaceConfig;
  readonly course: Course;
}

interface GameOrchestratorState {
  readonly phase: GamePhase;
  readonly players: readonly Player[];
  readonly particles: readonly Particle[];
  readonly sparks: readonly Spark[];
  readonly confetti: readonly Confetti[];
  readonly shake: number;
  readonly decks: readonly DeckState[];
  readonly highlightTracker: HighlightTracker;
  readonly raceStartTime: number;
  readonly countdownStartTime: number;
  readonly winner: string | null;
  readonly paused: boolean;
}

/** ゲームオーケストレーターの生成 */
function createOrchestrator(config: GameOrchestratorConfig): GameOrchestrator;

interface GameOrchestrator {
  /** 1フレームの更新処理 */
  update(now: number): GameOrchestratorState;
  /** 1フレームの描画処理 */
  draw(): void;
  /** 現在の状態を取得 */
  getState(): GameOrchestratorState;
  /** ポーズ/リジュームの切替 */
  togglePause(): void;
  /** ゲームのリセット */
  reset(): void;
}
```

### 2.3 InputProcessor（Command パターン）

```typescript
// application/input-processor.ts

/** プレイヤー入力コマンド */
interface PlayerCommand {
  readonly turnRate: number;
  readonly handbrake: boolean;
  readonly steering: number;  // -1, 0, 1
}

/** 入力をコマンドに変換 */
function processInput(
  player: Player,
  inputState: InputState,
  cpuStrategy: CpuStrategy | null,
  trackPoints: readonly Point[],
): PlayerCommand;
```

### 2.4 GameEventBus（Observer パターン）

```typescript
// application/game-event-bus.ts

type EventListener = (event: DomainEvent) => void;

interface GameEventBus {
  /** イベントの購読 */
  subscribe(eventType: DomainEvent['type'], listener: EventListener): () => void;
  /** イベントの発行 */
  publish(event: DomainEvent): void;
}

/** イベントバスの生成 */
function createEventBus(): GameEventBus;
```

### 2.5 DraftProcessor

```typescript
// application/draft-processor.ts

interface DraftProcessorState {
  readonly active: boolean;
  readonly currentPlayer: number;
  readonly triggerPlayer: number;
  readonly selectedIndex: number;
  readonly confirmed: boolean;
  readonly timer: number;
  readonly completedLap: number;
  readonly pendingResume: boolean;
}

/** ドラフトの開始 */
function startDraft(completedLap: number, playerIndex: number, now: number): DraftProcessorState;

/** ドラフトタイマーの更新 */
function updateDraftTimer(state: DraftProcessorState, now: number): DraftProcessorState;

/** カーソル移動 */
function moveCursor(currentIndex: number, direction: 'left' | 'right', handSize: number): number;

/** ドラフト確定処理 */
function confirmSelection(
  state: DraftProcessorState,
  decks: readonly DeckState[],
  players: readonly Player[],
): { state: DraftProcessorState; decks: readonly DeckState[]; players: readonly Player[] };
```

---

## 3. インフラストラクチャ層仕様

### 3.1 Renderer 分割仕様

#### 3.1.1 分割方針

現在の `renderer.ts`（682行）を以下の責務に分割する:

| ファイル | 責務 | 推定行数 |
|---------|------|---------|
| `canvas-renderer.ts` | `RendererPort` の実装、フレーム管理、Canvas コンテキスト管理 | ~80行 |
| `kart-renderer.ts` | 車体描画、名前タグ、ブースト表示 | ~120行 |
| `track-renderer.ts` | トラック描画、スタートライン、チェックポイント、背景 | ~150行 |
| `hud-renderer.ts` | HUD（ラップ、タイム、HEAT ゲージ）、カウントダウン | ~100行 |
| `effect-renderer.ts` | パーティクル、スパーク、コンフェッティ、花火、コースエフェクト | ~150行 |
| `draft-renderer.ts` | ドラフトカードUI描画 | ~100行 |

#### 3.1.2 共通描画ヘルパー

```typescript
// infrastructure/renderer/render-helpers.ts

/** Canvas コンテキストのスコープ管理 */
function withContext(ctx: CanvasRenderingContext2D, fn: (ctx: CanvasRenderingContext2D) => void): void;

/** テキスト描画（フォント・色・位置指定） */
function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, options: TextOptions): void;

/** 角丸矩形描画 */
function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void;
```

### 3.2 Audio アダプター仕様

```typescript
// infrastructure/audio/sound-engine.ts

/** AudioPort の Web Audio API 実装 */
class WebAudioEngine implements AudioPort {
  startEngine(): void;
  updateEngine(speed: number): void;
  stopEngine(): void;
  playSfx(type: SfxType): void;
  playWallHit(stage: WallStage): void;
  cleanup(): void;
}
```

### 3.3 Storage リポジトリ仕様

```typescript
// infrastructure/storage/score-repository.ts

/** StoragePort の localStorage 実装 */
class LocalStorageScoreRepository implements StoragePort {
  async saveScore(gameId: string, score: number, key: string): Promise<void>;
  async getHighScore(gameId: string, key: string, order: 'asc' | 'desc'): Promise<number>;
}
```

### 3.4 Input アダプター仕様

```typescript
// infrastructure/input/keyboard-adapter.ts

/** InputPort のキーボード実装 */
class KeyboardInputAdapter implements InputPort {
  constructor(mode: GameMode);
  getPlayerInput(playerIndex: number): InputState;
  getDraftInput(playerIndex: number): DraftInput;
  clearDraftInput(playerIndex: number, action: string): void;
}
```

---

## 4. プレゼンテーション層仕様

### 4.1 RacingGame.tsx（リファクタリング後）

**目標行数**: 200行以下（現状758行）

**責務**:
- React ステート管理（UI表示用の最小限のステート）
- ゲームループフック（`useGameLoop`）の呼び出し
- コンポーネントの組み合わせ（MenuPanel, ResultPanel, Canvas 等）
- ユーザーイベントハンドラのバインド

**含めないもの**:
- ゲームロジック（Domain 層に委譲）
- 描画処理（Infrastructure 層に委譲）
- 入力処理の詳細（Application 層に委譲）
- 効果音制御（Infrastructure 層に委譲）

### 4.2 useGameLoop フック

```typescript
// presentation/hooks/useGameLoop.ts

interface UseGameLoopResult {
  readonly state: GamePhase;
  readonly results: GameResults | null;
  readonly highlightSummary: HighlightSummary[];
  readonly paused: boolean;
  readonly setPaused: (paused: boolean) => void;
  readonly reset: () => void;
  readonly startGame: () => void;
}

function useGameLoop(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  config: GameConfig,
): UseGameLoopResult;
```

### 4.3 useGameState フック

```typescript
// presentation/hooks/useGameState.ts

interface GameConfig {
  readonly mode: GameMode;
  readonly course: number;
  readonly speed: number;
  readonly cpu: number;
  readonly laps: number;
  readonly color1: number;
  readonly color2: number;
  readonly cardsEnabled: boolean;
  readonly demo: boolean;
}

interface UseGameStateResult {
  readonly config: GameConfig;
  readonly setMode: (mode: GameMode) => void;
  readonly setCourse: (course: number) => void;
  readonly setSpeed: (speed: number) => void;
  readonly setCpu: (cpu: number) => void;
  readonly setLaps: (laps: number) => void;
  readonly setColor1: (color: number) => void;
  readonly setColor2: (color: number) => void;
  readonly setCardsEnabled: (enabled: boolean) => void;
  readonly bests: Record<string, number>;
  readonly bestTimeStr: string;
}

function useGameState(): UseGameStateResult;
```

---

## 5. DbC（契約）仕様

### 5.1 アサーション運用方針

| 環境 | アサーション動作 |
|------|----------------|
| 開発（NODE_ENV=development） | アサーション有効、違反時に例外をスロー |
| テスト（NODE_ENV=test） | アサーション有効、違反時に例外をスロー |
| 本番（NODE_ENV=production） | アサーション無効（Tree-shaking で除去） |

### 5.2 アサーション定義

```typescript
// domain/shared/assertions.ts

const IS_DEV = process.env.NODE_ENV !== 'production';

export function assert(condition: boolean, message?: string): asserts condition {
  if (IS_DEV && !condition) {
    throw new Error(`Assertion failed: ${message || 'unknown'}`);
  }
}

export function assertInRange(value: number, min: number, max: number, name: string): void {
  assert(value >= min && value <= max, `${name} = ${value} is not in [${min}, ${max}]`);
}

export function assertPositive(value: number, name: string): void {
  assert(value > 0, `${name} = ${value} is not positive`);
}

export function assertNonNegative(value: number, name: string): void {
  assert(value >= 0, `${name} = ${value} is negative`);
}

export function assertDefined<T>(value: T | undefined | null, name: string): asserts value is T {
  assert(value !== undefined && value !== null, `${name} is ${value}`);
}

export function assertValidIndex(index: number, length: number, name: string): void {
  assert(Number.isInteger(index) && index >= 0 && index < length, `${name} = ${index} is not a valid index for length ${length}`);
}
```

### 5.3 適用箇所の一覧

| ドメイン | 関数 | 事前条件 | 事後条件 |
|---------|------|---------|---------|
| Player | `movePlayer` | speed ∈ [0,1], baseSpeed > 0 | result.speed ∈ [0,1] |
| Player | `startDrift` | speed ∈ [0,1] | active → speed >= MIN_SPEED |
| Player | `updateHeat` | dt > 0, gainMul > 0 | gauge ∈ [0,1] |
| Race | `transition` | canTransition(from, to) | — |
| Race | `updateCheckpoints` | radius > 0 | flags >= prev flags |
| Track | `getTrackInfo` | points.length >= 2 | dist >= 0 |
| Card | `drawCards` | count > 0 | hand.length === count |
| Card | `selectCard` | cardId in hand | history includes card |
| Shared | `clamp` | min <= max | result ∈ [min, max] |

---

## 6. テスト仕様

### 6.1 テスト戦略

Canvas 2D ベースのゲームでは、E2E テスト（Playwright 等）で Canvas 内部の状態（車の移動、ドリフト挙動、HEAT ゲージ等）を検証できない。そのため、テストピラミッドの下層（単体テスト・統合テスト）に投資を集中し、E2E はスモークテストに限定する。

```
                       ┌────────────────┐
                       │ スモークテスト   │  ← ページ表示・画面遷移のみ（3〜5件）
                      ┌┴────────────────┴┐
                      │   統合テスト       │  ← Application 層（モック Port 注入、10件以上）
                     ┌┴──────────────────┴┐
                     │    単体テスト        │  ← Domain 層（多数・低コスト、カバレッジ 90%）
                     └────────────────────┘
```

**Canvas ゲームにおける E2E の限界**:
- Canvas 内のオブジェクト（車・トラック・HUD）は DOM 要素ではなく、セレクターで検出不可
- `requestAnimationFrame` によるゲームループは非決定的でテストが flaky になりやすい
- レース完了まで数十秒〜数分かかり、テスト実行時間が長大化する

**代替アプローチ（統合テスト）**:
- `GameOrchestrator` にモック Port（RendererPort, AudioPort 等）を注入
- Canvas 描画なしでゲームロジックの状態遷移を高速に検証
- ドメイン層の純粋関数テストと合わせて、コアロジックの99%をカバー

### 6.2 単体テスト仕様

#### ドメイン層テスト（既存テストのリファクタリング + 新規）

| テストファイル | テスト対象 | 移行元 |
|--------------|-----------|--------|
| `domain/player/player.test.ts` | Player 移動・状態更新 | `game-logic.test.ts` の一部 |
| `domain/player/drift.test.ts` | ドリフト計算 | `drift.test.ts` |
| `domain/player/heat.test.ts` | HEAT 計算 | `heat.test.ts` |
| `domain/player/cpu-strategy.test.ts` | CPU AI | `game-logic.test.ts` の一部 |
| `domain/race/game-phase.test.ts` | フェーズ遷移 | 新規 |
| `domain/race/checkpoint.test.ts` | チェックポイント判定 | `game-logic.test.ts` の一部 |
| `domain/race/collision.test.ts` | 衝突判定 | `game-logic.test.ts` の一部 |
| `domain/track/track.test.ts` | トラック情報 | `track.test.ts` |
| `domain/track/wall-physics.test.ts` | 壁物理 | `wall-physics.test.ts` |
| `domain/track/course-effect.test.ts` | コース効果 | `course-effects.test.ts` |
| `domain/card/deck.test.ts` | デッキ管理 | `draft-cards.test.ts` |
| `domain/card/card-effect.test.ts` | カード効果 | `card-effects.test.ts` |
| `domain/highlight/event-detector.test.ts` | イベント検出 | `highlight.test.ts` |
| `domain/shared/math-utils.test.ts` | 数学関数 | `utils.test.ts` |
| `domain/shared/assertions.test.ts` | アサーション | 新規 |

#### テストのリファクタリング方針

1. **振る舞いベースに変更**: 内部実装への依存を排除し、入出力に基づくテストに
2. **AAA パターンの徹底**: Arrange / Act / Assert の明確な区分け
3. **テスト名の日本語化**: `it('速度がMIN_SPEED未満のときドリフトが開始しない', ...)` 形式
4. **テストデータの Factory 化**: テスト用のプレイヤー・デッキ等を生成するヘルパー
5. **不変条件のテスト追加**: DbC の事前/事後条件をテストで検証

#### テスト用ファクトリ

```typescript
// __tests__/helpers/test-factories.ts

function createTestPlayer(overrides?: Partial<Player>): Player;
function createTestDeck(overrides?: Partial<DeckState>): DeckState;
function createTestTrackPoints(segments?: number): readonly Point[];
function createTestCard(overrides?: Partial<Card>): Card;
```

### 6.3 統合テスト仕様（Application 層）

GameOrchestrator にモック Port を注入し、Canvas 描画なしでゲームフロー全体をテストする。
これにより、E2E で本来検証したかった「ゲーム全体の状態遷移」を高速かつ確実に検証できる。

#### テストファイル

| テストファイル | テスト対象 | 検証内容 |
|--------------|-----------|---------|
| `application/game-orchestrator.test.ts` | ゲームオーケストレーター | フェーズ遷移の正確性、ドメイン層との連携 |
| `application/input-processor.test.ts` | 入力処理 | キー入力 → コマンド変換の正確性 |
| `application/draft-processor.test.ts` | ドラフト処理 | タイマー管理、カード選択フロー |
| `application/game-event-bus.test.ts` | イベントバス | Subscribe/Publish の正確性 |

#### GameOrchestrator 統合テストシナリオ

| シナリオ | 検証内容 |
|---------|---------|
| ソロレース基本フロー | countdown → race → result のフェーズ遷移 |
| CPU対戦フロー | countdown → race → draft → race → result |
| 2P対戦フロー | 両プレイヤーの入力処理と勝敗判定 |
| ドラフトフロー | ラップ完了 → ドラフト開始 → カード選択 → レース再開 |
| ポーズ/リジューム | ポーズ中にゲームループが停止すること |
| CPU カード自動選択 | CPU のドラフト時にバックグラウンド選択が行われること |
| ハイライト検出 | レース中のイベント検出とトラッカー更新 |
| 壁衝突フロー | 壁接触 → ペナルティ → 回復の状態遷移 |
| ドリフト → ブースト | ドリフト開始 → 維持 → 終了 → ブースト適用 |
| HEAT ブースト | ニアミス蓄積 → ゲージMAX → ブースト発動 |
| カード効果適用 | カード選択後の次ラップでの効果反映 |
| レース終了判定 | 最終ラップ完了 → 勝者決定 → リザルト遷移 |

#### モック Port の設計

```typescript
// __tests__/helpers/mock-ports.ts

/** 描画の呼び出しを記録するモック Renderer */
function createMockRenderer(): RendererPort & { calls: string[] };

/** 効果音の呼び出しを記録するモック Audio */
function createMockAudio(): AudioPort & { calls: string[] };

/** インメモリのモック Storage */
function createMockStorage(): StoragePort & { data: Record<string, number> };

/** プログラマブルなモック Input */
function createMockInput(inputs?: Record<number, InputState>): InputPort;
```

#### 統合テスト例

```typescript
// __tests__/application/game-orchestrator.test.ts

describe('GameOrchestrator', () => {
  describe('フェーズ遷移', () => {
    it('カウントダウン完了後にレースフェーズに遷移する', () => {
      // Arrange
      const renderer = createMockRenderer();
      const audio = createMockAudio();
      const orchestrator = createOrchestrator({
        renderer, audio,
        storage: createMockStorage(),
        input: createMockInput(),
        raceConfig: { mode: 'cpu', maxLaps: 3, ... },
        course: testCourse,
      });

      // Act: カウントダウン時間分を経過させる
      const countdownEnd = Date.now() + 3500;
      orchestrator.update(countdownEnd);

      // Assert
      expect(orchestrator.getState().phase).toBe('race');
      expect(audio.calls).toContain('go');
    });

    it('ラップ完了時にドラフトフェーズに遷移する', () => {
      // Arrange: レース中の状態を作成
      const orchestrator = createOrchestratorInRace({ laps: 3 });

      // Act: プレイヤーがラップ完了する状態を注入
      simulateLapCompletion(orchestrator, 0);

      // Assert
      expect(orchestrator.getState().phase).toBe('draft');
    });
  });
});
```

### 6.4 スモークテスト仕様（E2E 代替）

Canvas ゲームの特性を考慮し、E2E は「ページが正常に動作すること」の最小限の確認に留める。

#### テスト環境

- **フレームワーク**: Playwright（既に導入済み）
- **テストディレクトリ**: `e2e/racing-game/`
- **ベースURL**: `http://localhost:3000/racing`

#### スモークテストシナリオ（3〜5件）

| シナリオ | 検証内容 | 備考 |
|---------|---------|------|
| ページ表示 | Racing Game ページが正常に表示される | DOM 要素のみ検証 |
| ゲーム開始 | スタートボタンクリックでメニューが非表示になる | DOM 要素の表示/非表示 |
| ポーズ画面 | P キー押下で PAUSED オーバーレイが表示される | DOM オーバーレイの検証 |
| メニュー復帰 | ESC キーでメニューに戻れる | DOM 要素の再表示 |
| Canvas 存在確認 | Canvas 要素が存在し、適切なサイズで表示される | Canvas DOM 属性の検証 |

> **注意**: Canvas 内部の描画内容（車の位置、エフェクト等）は検証しない。
> ゲームロジックの正確性は統合テストで担保する。

#### スモークテスト例

```typescript
// e2e/racing-game/smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Racing Game スモークテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/racing');
  });

  test('ページが正常に表示される', async ({ page }) => {
    await expect(page.getByText('Racing Game')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('ゲーム開始でメニューが消える', async ({ page }) => {
    await page.getByRole('button', { name: /start/i }).click();
    // メニューパネルが非表示になることを確認
    await expect(page.getByRole('button', { name: /start/i })).not.toBeVisible();
  });

  test('ESCキーでメニューに戻れる', async ({ page }) => {
    await page.getByRole('button', { name: /start/i }).click();
    await page.keyboard.press('p');
    await expect(page.getByText('PAUSED')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });
});
```

### 6.5 カバレッジ目標

| 対象 | 目標 | テスト種別 |
|------|------|-----------|
| ドメイン層 全体 | 90% 以上 | 単体テスト |
| アプリケーション層 全体 | 80% 以上 | 統合テスト |
| 統合テストシナリオ | 10 以上 | GameOrchestrator テスト |
| スモークテスト | 3〜5 件 | Playwright |

---

## 7. 移行仕様

### 7.1 ファイル移行マッピング

#### 既存 → 新規の対応表

| 既存ファイル | 移行先 | 移行方法 |
|-------------|--------|---------|
| `utils.ts` | `domain/shared/math-utils.ts` | 関数を移動、旧ファイルは re-export → 削除 |
| `types.ts` | 各 `domain/*/types.ts` に分散 | 型を分散配置、旧ファイルは re-export → 削除 |
| `constants.ts` | 各 `domain/*/constants.ts` に分散 | 定数を分散配置、旧ファイルは re-export → 削除 |
| `drift.ts` | `domain/player/drift.ts` | リファクタリングして移動 |
| `heat.ts` | `domain/player/heat.ts` | リファクタリングして移動 |
| `track.ts` | `domain/track/track.ts` | リファクタリングして移動 |
| `wall-physics.ts` | `domain/track/wall-physics.ts` | リファクタリングして移動 |
| `course-effects.ts` | `domain/track/course-effect.ts` | リファクタリングして移動 |
| `game-logic.ts` | `domain/player/player.ts` + `domain/race/` | 分割して移動 |
| `draft-cards.ts` | `domain/card/deck.ts` + `domain/card/card-catalog.ts` | 分割して移動 |
| `card-effects.ts` | `domain/card/card-effect.ts` | リファクタリングして移動 |
| `highlight.ts` | `domain/highlight/` | 分割して移動 |
| `entities.ts` | `domain/shared/` + `infrastructure/renderer/` | 分割 |
| `renderer.ts` | `infrastructure/renderer/` 配下に分割 | 責務別に分割 |
| `audio.ts` | `infrastructure/audio/sound-engine.ts` | アダプター化 |
| `hooks.ts` | `infrastructure/input/` + `presentation/hooks/` | 分割 |
| `game-update.ts` | `application/game-orchestrator.ts` | 統合 |
| `game-draw.ts` | `infrastructure/renderer/hud-renderer.ts` | 統合 |
| `draft-ui-logic.ts` | `application/draft-processor.ts` | リファクタリングして移動 |
| `RacingGame.tsx` | `presentation/RacingGame.tsx` | 大幅スリム化 |
| `components/*.tsx` | `presentation/components/*.tsx` | パス変更のみ |

#### テスト移行

| 既存テスト | 移行先 |
|-----------|--------|
| `__tests__/drift.test.ts` | `__tests__/domain/player/drift.test.ts` |
| `__tests__/heat.test.ts` | `__tests__/domain/player/heat.test.ts` |
| `__tests__/game-logic.test.ts` | 分割: `player.test.ts`, `checkpoint.test.ts`, `collision.test.ts`, `cpu-strategy.test.ts` |
| `__tests__/track.test.ts` | `__tests__/domain/track/track.test.ts` |
| `__tests__/wall-physics.test.ts` | `__tests__/domain/track/wall-physics.test.ts` |
| `__tests__/course-effects.test.ts` | `__tests__/domain/track/course-effect.test.ts` |
| `__tests__/draft-cards.test.ts` | `__tests__/domain/card/deck.test.ts` |
| `__tests__/card-effects.test.ts` | `__tests__/domain/card/card-effect.test.ts` |
| `__tests__/highlight.test.ts` | `__tests__/domain/highlight/event-detector.test.ts` |
| `__tests__/utils.test.ts` | `__tests__/domain/shared/math-utils.test.ts` |
| `__tests__/entities.test.ts` | 分割: ドメイン部分とインフラ部分 |

### 7.2 後方互換性の維持

移行期間中、旧ファイルは re-export パターンで後方互換性を維持する:

```typescript
// 旧ファイル（例: drift.ts）
// 移行期間中は新モジュールを re-export
export { Drift } from './domain/player/drift';
```

全参照先の切替完了後に旧ファイルを削除する。

### 7.3 インポートパス更新の自動化

TypeScript の `paths` エイリアスを活用し、移行を段階的に行う:

```json
// tsconfig.json（移行期間中のみ）
{
  "compilerOptions": {
    "paths": {
      "@racing/domain/*": ["src/features/racing-game/domain/*"],
      "@racing/app/*": ["src/features/racing-game/application/*"],
      "@racing/infra/*": ["src/features/racing-game/infrastructure/*"]
    }
  }
}
```
