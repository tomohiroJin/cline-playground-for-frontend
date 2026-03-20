# Air Hockey 大規模リファクタリング — 仕様書

## 概要

本仕様書は、Air Hockey の大規模リファクタリングにおける各成果物の技術仕様・インターフェース・設計制約を定義する。

## 成果物一覧

| ID | 成果物 | 種類 | 配置先 |
|----|--------|------|--------|
| S-01 | ドメインモデル層 | 新規ディレクトリ | `domain/` |
| S-02 | インフラストラクチャ層 | 新規ディレクトリ | `infrastructure/` |
| S-03 | アプリケーション層 | 新規ディレクトリ | `application/` |
| S-04 | プレゼンテーション層リファクタリング | コード変更 | `presentation/` |
| S-05 | テストリファクタリング | コード変更 | `__tests__/`, 各テストファイル |
| S-06 | ドメイン統合テスト + ユースケース結合テスト | テストファイル | `__tests__/integration/`, `__tests__/use-case/` |

---

## S-01: ドメインモデル層

### S-01-1: Value Object

#### Vector

```typescript
// domain/models/vector.ts

/**
 * 2D ベクトル値オブジェクト（不変）
 * - すべての演算は新しい Vector を返す
 * - 等値比較は値ベース
 */
export class Vector {
  readonly x: number;
  readonly y: number;

  private constructor(x: number, y: number);

  static create(x: number, y: number): Vector;
  static zero(): Vector;

  // 演算
  add(other: Vector): Vector;
  subtract(other: Vector): Vector;
  multiply(scalar: number): Vector;
  normalize(): Vector;

  // プロパティ
  magnitude(): number;
  magnitudeSquared(): number;
  distanceTo(other: Vector): number;

  // 等値比較
  equals(other: Vector): boolean;

  // 不変条件: x, y が NaN/Infinity でないこと
}
```

#### FieldConfig

```typescript
// domain/constants/fields.ts

/**
 * フィールド設定値オブジェクト（不変）
 */
export type FieldConfig = Readonly<{
  id: string;
  name: string;
  goalSize: number;
  color: string;
  obstacles: ReadonlyArray<ObstacleConfig>;
  destructible: boolean;
  obstacleHp: number;
  obstacleRespawnMs: number;
}>;

export type ObstacleConfig = Readonly<{
  x: number;
  y: number;
  radius: number;
}>;

// 定義済みフィールド
export const FIELDS: ReadonlyArray<FieldConfig>;
```

#### AiBehaviorConfig

```typescript
// domain/constants/ai-presets.ts

/**
 * AI 行動設定値オブジェクト（不変）
 */
export type AiBehaviorConfig = Readonly<{
  maxSpeed: number;
  predictionFactor: number;
  wobble: number;
  skipRate: number;
  centerWeight: number;
  wallBounce: boolean;
  reactionDelay: number;
}>;

export const AI_BEHAVIOR_PRESETS: Readonly<Record<Difficulty, AiBehaviorConfig>>;
```

### S-01-2: エンティティ

#### Puck

```typescript
// domain/models/puck.ts

/**
 * パックエンティティ
 * - 位置・速度・半径を保持
 * - 衝突判定・速度適用のドメインメソッドを持つ
 * - 不変更新パターン（新しい Puck を返す）
 */
export type PuckState = Readonly<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  visible: boolean;
  hitCount: number;
}>;

export const Puck = {
  create(x: number, y: number, radius: number): PuckState;

  // 状態更新（すべて新しい PuckState を返す）
  applyVelocity(puck: PuckState, dt: number): PuckState;
  applyFriction(puck: PuckState, friction: number): PuckState;
  reflect(puck: PuckState, normal: Vector): PuckState;

  // クエリ
  speed(puck: PuckState): number;
  isMoving(puck: PuckState, threshold?: number): boolean;
  isInGoal(puck: PuckState, canvasHeight: number, goalSize: number): 'player' | 'cpu' | null;
} as const;
```

#### Mallet

```typescript
// domain/models/mallet.ts

/**
 * マレットエンティティ
 * - プレイヤー/CPU の操作対象
 * - 移動制限（自陣半分のみ）
 */
export type MalletState = Readonly<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  side: 'player' | 'cpu';
}>;

export const Mallet = {
  create(x: number, y: number, radius: number, side: 'player' | 'cpu'): MalletState;
  moveTo(mallet: MalletState, targetX: number, targetY: number, maxSpeed: number): MalletState;
  clampToSide(mallet: MalletState, canvasWidth: number, canvasHeight: number): MalletState;
} as const;
```

#### GameState（集約ルート）

```typescript
// domain/models/game-state.ts

/**
 * ゲーム状態集約ルート
 * - ゲーム内のすべてのエンティティを管理
 * - 状態遷移の整合性を保証
 * - 不変更新パターン
 */
export type GameStateData = Readonly<{
  player: MalletState;
  cpu: MalletState;
  pucks: ReadonlyArray<PuckState>;
  items: ReadonlyArray<ItemState>;
  effects: GameEffects;
  combo: ComboState;
  fever: FeverState;
  particles: ReadonlyArray<Particle>;
  obstacleStates: ReadonlyArray<ObstacleState>;
  phase: GamePhase;
  score: { player: number; cpu: number };
}>;

export const GameState = {
  // ファクトリー
  create(field: FieldConfig, difficulty: Difficulty): GameStateData;
  reset(state: GameStateData): GameStateData;

  // フレーム更新（純粋関数、ドメインイベントを返す）
  update(
    state: GameStateData,
    input: PlayerInput,
    aiConfig: AiBehaviorConfig,
    field: FieldConfig,
    now: number,
    dt: number
  ): { state: GameStateData; events: ReadonlyArray<GameEvent> };

  // フェーズ遷移
  startCountdown(state: GameStateData): GameStateData;
  startPlaying(state: GameStateData): GameStateData;
  pause(state: GameStateData): GameStateData;
  finish(state: GameStateData): GameStateData;

  // スコア判定
  checkGoal(state: GameStateData): { scorer: 'player' | 'cpu' } | null;
} as const;
```

### S-01-3: ドメインサービス

#### Physics サービス

```typescript
// domain/services/physics.ts

/**
 * 物理演算ドメインサービス
 * - 現 core/physics.ts の API を維持
 * - 純粋関数のみ
 */
export const Physics = {
  detectCollision(
    ax: number, ay: number, ar: number,
    bx: number, by: number, br: number
  ): CollisionResult | null;

  resolveCollision(
    obj: Entity, collision: CollisionResult,
    power: number, sourceVx: number, sourceVy: number, factor: number
  ): Entity;

  reflectOffSurface(obj: Entity, collision: CollisionResult): Entity;
  applyWallBounce(obj: Entity, radius: number, goalChecker: GoalChecker, onBounce?: BounceCallback): Entity;
  applyFriction(obj: Entity, consts: PhysicsConstants): Entity;
} as const;
```

#### AI サービス

```typescript
// domain/services/ai.ts

/**
 * CPU AI ドメインサービス
 * - 現 core/ai.ts の API を維持
 * - 純粋関数のみ
 */
export const CpuAI = {
  calculateTargetWithBehavior(
    game: GameStateData,
    config: AiBehaviorConfig,
    now: number
  ): Vector;

  updateWithBehavior(
    game: GameStateData,
    config: AiBehaviorConfig,
    now: number
  ): MalletState;
} as const;
```

#### ItemEffect サービス（Strategy パターン）

```typescript
// domain/services/item-effect.ts

/**
 * アイテムエフェクトインターフェース（Strategy パターン）
 * - 各アイテムは ItemEffectStrategy を実装
 * - 新アイテム追加時は Strategy の実装を追加するのみ
 */
export interface ItemEffectStrategy {
  readonly type: ItemType;
  apply(state: GameStateData, target: 'player' | 'cpu', now: number): GameStateData;
}

// 具体的な Strategy 実装
export class SplitEffect implements ItemEffectStrategy { /* パック分裂 */ }
export class SpeedEffect implements ItemEffectStrategy { /* 速度UP */ }
export class InvisibleEffect implements ItemEffectStrategy { /* 不可視 */ }
export class ShieldEffect implements ItemEffectStrategy { /* 盾 */ }
export class MagnetEffect implements ItemEffectStrategy { /* マグネット */ }
export class BigEffect implements ItemEffectStrategy { /* 巨大化 */ }

// エフェクトレジストリ
export const ItemEffectRegistry = {
  register(strategy: ItemEffectStrategy): void;
  apply(type: ItemType, state: GameStateData, target: 'player' | 'cpu', now: number): GameStateData;
  getAll(): ReadonlyArray<ItemEffectStrategy>;
} as const;
```

### S-01-4: ドメインイベント

```typescript
// domain/events/game-events.ts

/**
 * ドメインイベント定義
 * - ゲーム内で発生する重要な出来事を表現
 * - Observer パターンで購読可能
 */
export type GameEvent =
  | { type: 'GOAL_SCORED'; scorer: 'player' | 'cpu'; speed: number }
  | { type: 'COLLISION'; objectA: string; objectB: string; speed: number; x: number; y: number }
  | { type: 'WALL_BOUNCE'; x: number; y: number }
  | { type: 'ITEM_COLLECTED'; itemType: ItemType; collector: 'player' | 'cpu' }
  | { type: 'ITEM_SPAWNED'; itemType: ItemType; x: number; y: number }
  | { type: 'PHASE_CHANGED'; from: GamePhase; to: GamePhase }
  | { type: 'COMBO_INCREASED'; count: number }
  | { type: 'FEVER_ACTIVATED' }
  | { type: 'OBSTACLE_DESTROYED'; x: number; y: number }
  | { type: 'ACHIEVEMENT_UNLOCKED'; achievementId: string };

/**
 * イベントディスパッチャー
 */
export interface GameEventDispatcher {
  subscribe(handler: (event: GameEvent) => void): () => void;
  dispatch(event: GameEvent): void;
}

export function createEventDispatcher(): GameEventDispatcher;
```

### S-01-5: ドメイン定数

```typescript
// domain/constants/physics.ts

/**
 * 物理演算定数（現 core/constants.ts から分離）
 */
export const PHYSICS_CONSTANTS = {
  CANVAS_WIDTH: 450,
  CANVAS_HEIGHT: 900,
  PUCK_RADIUS: 20,
  MALLET_RADIUS: 30,
  FRICTION: 0.998,
  MAX_PUCK_SPEED: 15,
  HIT_POWER: 1.2,
  GOAL_SIZE_DEFAULT: 120,
} as const;

export type PhysicsConstants = typeof PHYSICS_CONSTANTS;
```

---

## S-02: インフラストラクチャ層

### S-02-1: ストレージポート・アダプタ

```typescript
// domain/contracts/storage.ts

/**
 * ストレージポート（インターフェース）
 * - ドメイン層で定義し、インフラ層で実装
 * - 依存性逆転の原則（DIP）
 */
export interface GameStoragePort {
  // 実績
  loadAchievements(): string[];
  saveAchievements(ids: string[]): void;

  // ストーリー
  loadStoryProgress(): StoryProgress;
  saveStoryProgress(progress: StoryProgress): void;

  // アンロック
  loadUnlockState(): UnlockState;
  saveUnlockState(state: UnlockState): void;

  // 図鑑
  loadDexProgress(): DexProgress;
  saveDexProgress(progress: DexProgress): void;

  // オーディオ設定
  loadAudioSettings(): AudioSettings;
  saveAudioSettings(settings: AudioSettings): void;

  // デイリーチャレンジ
  loadDailyChallengeResult(date: string): DailyChallengeResult | undefined;
  saveDailyChallengeResult(date: string, result: DailyChallengeResult): void;

  // スコア
  loadHighScores(key: string): number[];
  saveHighScore(key: string, score: number): void;
}
```

```typescript
// infrastructure/storage/local-storage-adapter.ts

/**
 * localStorage アダプタ
 * - GameStoragePort の具象実装
 * - try-catch による破損時フォールバック
 * - JSON パース + バリデーション
 */
export class LocalStorageAdapter implements GameStoragePort {
  // ストレージキーのプレフィックス管理
  private readonly PREFIX = 'ah_';

  // 各メソッドの実装
  // - loadXxx(): localStorage.getItem → JSON.parse → バリデーション → デフォルト値フォールバック
  // - saveXxx(): JSON.stringify → localStorage.setItem
}
```

```typescript
// __tests__/helpers/in-memory-storage.ts

/**
 * テスト用インメモリストレージ
 * - localStorage を使わずにテスト可能
 */
export class InMemoryStorageAdapter implements GameStoragePort {
  private store: Map<string, string> = new Map();
  // 各メソッドの実装（Map で管理）
}
```

### S-02-2: オーディオポート・アダプタ

```typescript
// domain/contracts/audio.ts

/**
 * オーディオポート（インターフェース）
 */
export interface AudioPort {
  // 効果音
  playHit(speed: number): void;
  playWall(): void;
  playGoal(): void;
  playItem(): void;
  playCountdown(): void;
  playWhistle(): void;

  // BGM
  startBgm(): void;
  stopBgm(): void;

  // 設定
  setBgmVolume(volume: number): void;
  setSeVolume(volume: number): void;
  setBgmMuted(muted: boolean): void;
  setSeMuted(muted: boolean): void;
}
```

```typescript
// infrastructure/audio/web-audio-adapter.ts

/**
 * Web Audio API アダプタ
 * - 現 core/sound.ts のロジックを移行
 * - AudioPort の具象実装
 */
export class WebAudioAdapter implements AudioPort {
  private ctx: AudioContext | null = null;
  // Web Audio API を使った実装
}
```

```typescript
// __tests__/helpers/null-audio.ts

/**
 * テスト用 Null オーディオアダプタ
 * - 何もしない実装（テスト時の音声抑制）
 * - 呼び出し記録機能付き（spy 的に使用可能）
 */
export class NullAudioAdapter implements AudioPort {
  readonly calls: Array<{ method: string; args: unknown[] }> = [];
  // 各メソッドは calls に記録するだけ
}
```

### S-02-3: レンダラー分割

```typescript
// domain/contracts/renderer.ts

/**
 * レンダラーポート（インターフェース）
 */
export interface GameRendererPort {
  clear(now: number): void;
  drawField(field: FieldConfig, obstacles: ReadonlyArray<ObstacleState>): void;
  drawPuck(puck: PuckState, effects: PuckEffects): void;
  drawMallet(mallet: MalletState, effects: MalletEffects): void;
  drawItem(item: ItemState): void;
  drawParticles(particles: ReadonlyArray<Particle>): void;
  drawCountdown(count: number): void;
  drawHitStop(hitStop: HitStopState): void;
  drawScore(player: number, cpu: number): void;
}
```

```typescript
// infrastructure/renderer/canvas-renderer.ts（Facade）

/**
 * Canvas レンダラー（Facade パターン）
 * - 描画責務を各サブレンダラーに委譲
 * - 現 renderer.ts の分割統合
 */
export class CanvasRenderer implements GameRendererPort {
  private readonly fieldRenderer: FieldRenderer;
  private readonly entityRenderer: EntityRenderer;
  private readonly effectRenderer: EffectRenderer;
  private readonly uiRenderer: UiRenderer;

  constructor(ctx: CanvasRenderingContext2D, consts: PhysicsConstants);

  // GameRendererPort の実装
  // 各メソッドは適切なサブレンダラーに委譲
}
```

```typescript
// infrastructure/renderer/field-renderer.ts
// フィールド背景・障害物・ゴールエリアの描画

// infrastructure/renderer/entity-renderer.ts
// パック・マレットの描画（トレイル含む）

// infrastructure/renderer/effect-renderer.ts
// パーティクル・衝撃波・ヒットストップ・スローモーションの描画

// infrastructure/renderer/ui-renderer.ts
// カウントダウン・スコア・アイテムアイコンの描画
```

---

## S-03: アプリケーション層

### S-03-1: ゲームループユースケース

```typescript
// application/use-cases/game-loop.ts

/**
 * ゲームループユースケース
 * - 1フレームの更新処理を純粋にオーケストレーション
 * - 副作用はポート経由で実行
 */
export type GameLoopDependencies = {
  storage: GameStoragePort;
  audio: AudioPort;
  renderer: GameRendererPort;
  eventDispatcher: GameEventDispatcher;
};

export type GameLoopInput = {
  playerInput: PlayerInput;
  now: number;
  dt: number;
};

export class GameLoopUseCase {
  constructor(
    private deps: GameLoopDependencies,
    private field: FieldConfig,
    private aiConfig: AiBehaviorConfig
  );

  /**
   * 1フレームの更新処理
   * 1. プレイヤー入力の適用
   * 2. AI の更新
   * 3. 物理演算（衝突判定・壁反射）
   * 4. アイテム判定
   * 5. スコア判定
   * 6. エフェクト更新
   * 7. ドメインイベントの発行
   * 8. 描画の委譲
   */
  update(state: GameStateData, input: GameLoopInput): GameStateData;

  /**
   * ドメインイベントのハンドリング
   * - 音声再生の委譲
   * - エフェクトのトリガー
   */
  handleEvents(events: ReadonlyArray<GameEvent>): void;
}
```

### S-03-2: ストーリーモードユースケース

```typescript
// application/use-cases/story-mode.ts

/**
 * ストーリーモードユースケース
 * - ストーリーフロー管理（ステージ選択→ゲーム→リザルト）
 * - ストーリー進行の保存・読込
 * - キャラクターアンロック連携
 */
export class StoryModeUseCase {
  constructor(
    private storage: GameStoragePort,
    private eventDispatcher: GameEventDispatcher
  );

  // ストーリー進行の読込
  loadProgress(): StoryProgress;

  // ステージのバランス設定を取得
  getStageConfig(stageId: string): { aiConfig: AiBehaviorConfig; field: FieldConfig };

  // ステージクリア処理
  completeStage(stageId: string, winner: 'player' | 'cpu', stats: MatchStats): {
    progress: StoryProgress;
    newUnlocks: string[];
    achievements: string[];
  };

  // ストーリーリセット
  resetProgress(): void;
}
```

### S-03-3: フリー対戦ユースケース

```typescript
// application/use-cases/free-battle.ts

/**
 * フリー対戦ユースケース
 * - 設定に基づくゲーム開始
 * - リザルト処理（スコア保存・実績判定）
 */
export class FreeBattleUseCase {
  constructor(
    private storage: GameStoragePort,
    private eventDispatcher: GameEventDispatcher
  );

  // ゲーム設定の生成
  createGameConfig(difficulty: Difficulty, field: FieldConfig, winScore: number): GameConfig;

  // ゲーム完了処理
  completeGame(config: GameConfig, winner: 'player' | 'cpu', stats: MatchStats): {
    highScores: number[];
    achievements: string[];
    newUnlocks: string[];
  };
}
```

### S-03-4: デイリーチャレンジユースケース

```typescript
// application/use-cases/daily-challenge.ts

/**
 * デイリーチャレンジユースケース
 * - 日付ベースのシード生成
 * - ルール生成と適用
 */
export class DailyChallengeUseCase {
  constructor(private storage: GameStoragePort);

  // 今日のチャレンジを取得
  getTodayChallenge(): DailyChallenge;

  // チャレンジ完了処理
  completeChallenge(result: DailyChallengeResult): void;

  // 過去の結果を取得
  getResult(date: string): DailyChallengeResult | undefined;
}
```

---

## S-04: プレゼンテーション層リファクタリング

### S-04-1: useGameLoop 薄いラッパー化

```typescript
// presentation/hooks/useGameLoop.ts

/**
 * ゲームループフック（薄いラッパー）
 * - requestAnimationFrame の管理のみ
 * - ゲームロジックは GameLoopUseCase に委譲
 */
export function useGameLoop(params: {
  screen: ScreenType;
  gameLoopUseCase: GameLoopUseCase;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  inputRef: React.RefObject<PlayerInput>;
}): {
  gameState: GameStateData;
  phase: GamePhase;
};
```

### S-04-2: AirHockeyGame 分割

```typescript
// presentation/hooks/useScreenNavigation.ts

/**
 * 画面遷移フック
 * - 8種類の screen 状態の遷移管理のみ
 */
export function useScreenNavigation(): {
  screen: ScreenType;
  navigateTo(screen: ScreenType): void;
  goBack(): void;
};

// presentation/hooks/useGameMode.ts

/**
 * ゲームモードフック
 * - フリー対戦/ストーリーモード/デイリーチャレンジの切り替え
 * - 各モードのユースケースへの橋渡し
 */
export function useGameMode(deps: {
  storage: GameStoragePort;
  eventDispatcher: GameEventDispatcher;
}): {
  mode: GameMode;
  difficulty: Difficulty;
  field: FieldConfig;
  winScore: number;
  setDifficulty(d: Difficulty): void;
  setField(f: FieldConfig): void;
  setWinScore(s: number): void;
  startFreeGame(): GameConfig;
  startStoryGame(stageId: string): GameConfig;
  startDailyChallenge(): GameConfig;
};
```

### S-04-3: コンポーネント移動

```
現在のパス → 新しいパス
components/*.tsx → presentation/components/*.tsx
hooks/*.ts → presentation/hooks/*.ts
AirHockeyGame.tsx → presentation/AirHockeyGame.tsx
styles.ts → presentation/styles.ts

旧パスからは re-export で後方互換を維持
```

---

## S-05: テストリファクタリング

### S-05-1: テストヘルパー

```typescript
// __tests__/helpers/factories.ts

/**
 * テストデータファクトリー
 * - AAA パターンの Arrange を簡素化
 * - ドメインオブジェクトの生成を一元管理
 */
export const TestFactory = {
  // ゲーム状態
  createGameState(overrides?: Partial<GameStateData>): GameStateData;
  createPuck(overrides?: Partial<PuckState>): PuckState;
  createMallet(side: 'player' | 'cpu', overrides?: Partial<MalletState>): MalletState;
  createItem(type: ItemType, overrides?: Partial<ItemState>): ItemState;

  // 設定
  createFieldConfig(overrides?: Partial<FieldConfig>): FieldConfig;
  createAiConfig(overrides?: Partial<AiBehaviorConfig>): AiBehaviorConfig;

  // ストーリー
  createStoryProgress(overrides?: Partial<StoryProgress>): StoryProgress;
  createMatchStats(overrides?: Partial<MatchStats>): MatchStats;
} as const;
```

```typescript
// __tests__/helpers/mock-setup.ts

/**
 * 共通モック設定
 * - Canvas API, Audio API, localStorage のモック
 * - 個別テストでの重複設定を排除
 */
export function setupCanvasMock(): CanvasRenderingContext2D;
export function setupAudioMock(): NullAudioAdapter;
export function setupStorageMock(): InMemoryStorageAdapter;
```

### S-05-2: テスト品質基準

| 対象 | カバレッジ目標 | テストパターン |
|------|---------------|---------------|
| domain/models | 95% 以上 | Value Object の等値比較・不変性、エンティティの状態遷移 |
| domain/services | 90% 以上 | 純粋関数の入出力テスト |
| domain/events | 90% 以上 | イベント発行・購読のテスト |
| application/use-cases | 85% 以上 | ユースケースのフロー（モック依存注入） |
| infrastructure | 80% 以上 | アダプタの保存・読込・フォールバック |
| presentation | 70% 以上 | 振る舞いベースの UI テスト |

---

## S-06: ドメイン統合テスト + ユースケース結合テスト

> **E2E テストを採用しない理由**:
> Canvas ベースのゲームでは、操作対象が DOM 要素でなくピクセルのため Playwright 等では検証困難。
> 代わりに、ドメイン層・アプリケーション層でのテストにより、Canvas を介さずに
> ゲームフロー全体のリグレッション検知を実現する。

### S-06-1: テスト構成

```
__tests__/
├── helpers/
│   ├── factories.ts            # テストデータファクトリー
│   ├── mock-setup.ts           # 共通モック設定
│   ├── in-memory-storage.ts    # InMemoryStorageAdapter
│   ├── null-audio.ts           # NullAudioAdapter
│   └── game-runner.ts          # ゲームループランナー（複数フレーム実行）
├── integration/                # ドメイン統合テスト
│   ├── game-flow.test.ts       # ゲームフロー統合テスト
│   ├── item-lifecycle.test.ts  # アイテムライフサイクル統合テスト
│   ├── combo-fever.test.ts     # コンボ・フィーバー統合テスト
│   └── obstacle.test.ts        # 障害物ライフサイクル統合テスト
└── use-case/                   # ユースケース結合テスト
    ├── story-flow.test.ts      # ストーリーモード全フロー
    ├── free-battle-flow.test.ts # フリー対戦フロー
    ├── daily-challenge-flow.test.ts # デイリーチャレンジフロー
    ├── unlock-chain.test.ts    # アンロック連鎖フロー
    └── achievement-chain.test.ts # 実績連鎖フロー
```

### S-06-2: ゲームループランナー

```typescript
// __tests__/helpers/game-runner.ts

/**
 * ゲームループランナー
 * - ゲームループを複数フレーム実行するテストヘルパー
 * - Canvas / Audio なしで純粋にドメインロジックを実行
 * - ドメインイベントを収集して検証可能に
 */
export class GameRunner {
  private state: GameStateData;
  private events: GameEvent[] = [];
  private frameCount: number = 0;

  constructor(
    field: FieldConfig,
    aiConfig: AiBehaviorConfig,
    initialState?: Partial<GameStateData>
  );

  /**
   * 指定フレーム数だけゲームループを実行
   * @param frames 実行フレーム数
   * @param input プレイヤー入力（省略時は無入力）
   */
  runFrames(frames: number, input?: PlayerInput): void;

  /**
   * 特定条件を満たすまでゲームループを実行
   * @param predicate 停止条件
   * @param maxFrames 最大フレーム数（無限ループ防止）
   */
  runUntil(predicate: (state: GameStateData) => boolean, maxFrames?: number): void;

  // 状態取得
  getState(): GameStateData;
  getEvents(): ReadonlyArray<GameEvent>;
  getEventsOfType<T extends GameEvent['type']>(type: T): Extract<GameEvent, { type: T }>[];
  getFrameCount(): number;

  // 状態操作（テスト用）
  setPuckPosition(index: number, x: number, y: number): void;
  setPuckVelocity(index: number, vx: number, vy: number): void;
  spawnItem(type: ItemType, x: number, y: number): void;
}
```

### S-06-3: ドメイン統合テストシナリオ

#### ゲームフロー統合テスト（game-flow.test.ts）

```typescript
describe('ゲームフロー統合テスト', () => {
  describe('ゴール判定', () => {
    test('パックがプレイヤー側ゴールに入るとCPUにスコアが加算される', () => {
      const runner = new GameRunner(defaultField, easyAi);
      runner.setPuckPosition(0, 225, 880);
      runner.setPuckVelocity(0, 0, 5);

      runner.runUntil(s => s.score.cpu > 0, 120);

      expect(runner.getState().score.cpu).toBe(1);
      expect(runner.getEventsOfType('GOAL_SCORED')).toHaveLength(1);
      expect(runner.getEventsOfType('GOAL_SCORED')[0].scorer).toBe('cpu');
    });

    test('パックがCPU側ゴールに入るとプレイヤーにスコアが加算される', () => { /* ... */ });
    test('ゴール後にパックが中央にリセットされる', () => { /* ... */ });
  });

  describe('衝突', () => {
    test('マレットとパックが衝突するとパックが反射する', () => { /* ... */ });
    test('壁に衝突するとパックが反射しWALL_BOUNCEイベントが発行される', () => { /* ... */ });
    test('衝突時の速度に応じたCOLLISIONイベントが発行される', () => { /* ... */ });
  });
});
```

#### アイテムライフサイクル統合テスト（item-lifecycle.test.ts）

```typescript
describe('アイテムライフサイクル', () => {
  test('Splitアイテム取得でパックが3つに分裂する', () => {
    const runner = new GameRunner(defaultField, easyAi);
    runner.spawnItem('split', 225, 450);
    // プレイヤーマレットをアイテム位置に移動

    runner.runFrames(60);

    expect(runner.getState().pucks.length).toBe(3);
    expect(runner.getEventsOfType('ITEM_COLLECTED')).toHaveLength(1);
  });

  test('Speedエフェクトは8秒後に自動解除される', () => { /* ... */ });
  test('Shieldは1回の失点で消費される', () => { /* ... */ });
  test('複数パック（Split後）の同時ゴールが正しく処理される', () => { /* ... */ });
});
```

### S-06-4: ユースケース結合テストシナリオ

#### ストーリーモード全フロー（story-flow.test.ts）

```typescript
describe('ストーリーモード全フロー', () => {
  test('ステージ 1-1 → 1-2 → 1-3 を順にクリアし全キャラアンロック', () => {
    const storage = new InMemoryStorageAdapter();
    const dispatcher = createEventDispatcher();
    const story = new StoryModeUseCase(storage, dispatcher);
    const dex = new CharacterDexUseCase(storage);

    // ステージ 1-1 クリア
    const result1 = story.completeStage('1-1', 'player', createTestMatchStats());
    expect(result1.newUnlocks).toContain('hiro');

    // ステージ 1-2 クリア
    const result2 = story.completeStage('1-2', 'player', createTestMatchStats());
    expect(result2.newUnlocks).toContain('misaki');

    // ステージ 1-3 クリア
    const result3 = story.completeStage('1-3', 'player', createTestMatchStats());
    expect(result3.newUnlocks).toContain('takuma');

    // 図鑑の状態確認
    const progress = dex.getProgress();
    expect(progress.unlockedCharacterIds).toEqual(
      expect.arrayContaining(['player', 'hiro', 'misaki', 'takuma'])
    );
  });

  test('敗北してもストーリー進行は保存されない', () => { /* ... */ });
  test('ストーリーリセットで全進行がクリアされる', () => { /* ... */ });
});
```

#### アンロック連鎖フロー（unlock-chain.test.ts）

```typescript
describe('アンロック連鎖', () => {
  test('ステージクリア → キャラアンロック → 図鑑通知 → 既読処理の連鎖', () => {
    const storage = new InMemoryStorageAdapter();
    const story = new StoryModeUseCase(storage, createEventDispatcher());
    const dex = new CharacterDexUseCase(storage);

    // ステージクリアでアンロック
    story.completeStage('1-1', 'player', createTestMatchStats());
    expect(dex.getNewUnlockCount()).toBe(1);
    expect(dex.getProgress().newlyUnlockedIds).toContain('hiro');

    // 既読処理
    dex.markViewed(['hiro']);
    expect(dex.getNewUnlockCount()).toBe(0);
    expect(dex.getProgress().newlyUnlockedIds).toHaveLength(0);

    // アンロック状態は保持
    expect(dex.isUnlocked('hiro')).toBe(true);
  });

  test('フリー対戦完了 → スコア保存 → 実績判定 → フィールドアンロック', () => { /* ... */ });
  test('難易度オートアジャスト → 連勝後の設定変更', () => { /* ... */ });
});
```

---

## 設計制約（まとめ）

1. **後方互換性**: 旧パスからの import を re-export で維持（段階的移行完了後に削除）
2. **レイヤー依存方向**: `domain` ← `application` ← `infrastructure` / `presentation`（逆方向の依存禁止）
3. **ドメイン層の純粋性**: `domain/` 内に `import` される外部ライブラリは型定義のみ許可（React, localStorage, Canvas API 等は禁止）
4. **不変更新パターン**: すべてのドメインオブジェクトは不変。状態更新は新しいオブジェクトを返す
5. **既存テスト維持**: 各ステップで既存テスト全パスを確認。テスト削除は代替テスト作成後のみ
6. **パフォーマンス**: ゲームループ内の不要なオブジェクト生成を避ける（プールパターンの検討）
7. **型安全性**: `any` 使用禁止。`unknown` + 型ガードで安全に処理
