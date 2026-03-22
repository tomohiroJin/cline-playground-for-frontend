# Non-Brake Descent リファクタリング仕様書

## 1. ディレクトリ構成（目標状態）

```
src/features/non-brake-descent/
  domain/
    entities/
      player.ts              # Player エンティティ（ファクトリ + DbC）
      obstacle.ts            # Obstacle エンティティ
      ramp.ts                # Ramp エンティティ
      particle.ts            # Particle / ScorePopup / NearMissEffect
      background.ts          # Cloud / Building
      index.ts               # re-export
    services/
      collision-service.ts   # 衝突判定サービス（純粋関数）
      scoring-service.ts     # スコア・コンボ計算サービス
      speed-service.ts       # 速度・ランク管理サービス
      danger-service.ts      # 危険度計算サービス
      geometry-service.ts    # 座標変換・レイアウトサービス
      physics-service.ts     # 物理演算サービス
      index.ts
    strategies/
      collision/
        collision-handler.ts         # 衝突ハンドラインターフェース
        hole-handler.ts              # 穴障害物ハンドラ
        rock-handler.ts              # 岩ハンドラ
        enemy-handler.ts             # 敵ハンドラ
        item-handler.ts              # アイテム（スコア・エフェクト）ハンドラ
        collision-registry.ts        # 障害物タイプ→ハンドラの対応管理
        index.ts
    events/
      game-events.ts         # ドメインイベント型定義
    math-utils.ts            # 数学ユーティリティ（既存を移動）
    types.ts                 # ドメイン型定義
    constants.ts             # ドメイン定数
    config.ts                # ゲーム設定
  application/
    game-loop/
      frame-processor.ts     # 1フレーム更新のオーケストレーション（純粋関数）
      game-state.ts          # GameState 統合型 + イミュータブル更新
    collision/
      collision-processor.ts # 衝突処理オーケストレーション
    generators/
      ramp-generator.ts      # ランプ生成
      obstacle-generator.ts  # 障害物生成
      background-generator.ts # 背景生成
  infrastructure/
    audio/
      audio-port.ts          # オーディオインターフェース
      web-audio-adapter.ts   # Web Audio API 実装
      null-audio-adapter.ts  # テスト用スタブ
    storage/
      score-repository.ts    # スコア永続化
  presentation/
    screens/
      TitleScreen.tsx        # タイトル画面
      PlayScreen.tsx         # プレイ画面
      ResultScreen.tsx       # リザルト画面（ゲームオーバー + クリア共通）
    components/
      PlayerRenderer.tsx
      RampRenderer.tsx
      ObstacleRenderer.tsx
      ParticlesRenderer.tsx
      ScorePopupsRenderer.tsx
      NearMissRenderer.tsx
      DangerVignette.tsx
      CloudRenderer.tsx
      BuildingRenderer.tsx
      UIOverlay.tsx
      CountdownOverlay.tsx
      MobileControls.tsx
    hooks/
      use-game-engine.ts     # ゲームエンジンフック（ゲームループ統合）
      use-input.ts           # 入力処理フック
      use-audio.ts           # オーディオフック
      use-mobile.ts          # モバイル判定フック
    styles/
      theme.ts               # スタイル定数
  __tests__/
    domain/
      services/              # サービステスト
      strategies/            # 戦略テスト
      entities/              # エンティティテスト
    application/
      game-loop/             # ゲームループテスト
      collision/             # 衝突処理テスト
      generators/            # ジェネレータテスト
    infrastructure/          # インフラ層テスト
    presentation/            # コンポーネント・フックテスト
    helpers/
      test-factories.ts      # テスト用エンティティファクトリ
      test-helpers.ts        # テストヘルパー
  e2e/
    non-brake-descent.spec.ts # E2E テスト
  index.ts                   # 公開 API の re-export
```

## 2. ドメイン層仕様

### 2.1 統合ゲーム状態

```typescript
// 現在: 25個以上の useState が分散
// 目標: 単一の GameState インターフェースに集約

interface GameWorld {
  readonly player: Player;
  readonly ramps: readonly Ramp[];
  readonly speed: number;
  readonly camY: number;
  readonly score: number;
  readonly speedBonus: number;
  readonly combo: ComboState;
  readonly effect: EffectState;
  readonly lastRamp: number;
  readonly nearMissCount: number;
  readonly dangerLevel: number;
}

interface ComboState {
  readonly count: number;
  readonly timer: number;
}

// UI は別の状態として管理（ドメインとプレゼンテーションの分離）
interface UIState {
  readonly particles: readonly Particle[];
  readonly jetParticles: readonly Particle[];
  readonly scorePopups: readonly ScorePopup[];
  readonly nearMissEffects: readonly NearMissEffect[];
  readonly clouds: readonly Cloud[];
  readonly shake: number;
  readonly transitionEffect: number;
}
```

### 2.2 ドメインイベント

```typescript
// 衝突・遷移等のドメインロジックが副作用を直接実行する代わりに、イベントを返却
type GameEvent =
  | { type: 'PLAYER_DIED'; deathType: DeathType }
  | { type: 'RAMP_CLEARED'; rampIndex: number; score: number; combo: number }
  | { type: 'ITEM_COLLECTED'; itemType: 'score' | 'reverse' | 'forceJ'; position: Position }
  | { type: 'ENEMY_KILLED'; position: Position }
  | { type: 'NEAR_MISS'; position: Position }
  | { type: 'PLAYER_BOUNCED'; velocity: number }
  | { type: 'GOAL_REACHED' }
  | { type: 'AUDIO'; sound: string }
  | { type: 'PARTICLE'; x: number; y: number; color: string; count: number }
  | { type: 'SCORE_POPUP'; x: number; y: number; text: string; color: string };
```

**設計意図**: ゲームループ内でオーディオ再生やパーティクル生成を直接呼び出す代わりに、イベントとして返却し、プレゼンテーション層で処理する。これにより、ドメインロジックのテスタビリティが大幅に向上する。

### 2.3 衝突ハンドラ Strategy パターン

```typescript
// 衝突結果を明確な型で表現（boolean | 'slow' の排除）
interface CollisionResult {
  readonly dead: boolean;
  readonly slowDown: boolean;
  readonly events: readonly GameEvent[];
  readonly obstacleUpdate?: ObstacleTypeValue;  // 障害物の状態変更（TAKEN/DEAD）
}

// 各障害物タイプごとのハンドラ
interface CollisionHandler {
  handle(context: CollisionContext): CollisionResult;
}

interface CollisionContext {
  readonly playerX: number;
  readonly obstacleX: number;
  readonly collision: CollisionCheckResult;
  readonly speedRank: SpeedRankValue;
  readonly godMode: boolean;
}
```

**設計意図**: `createCollisionHandlers` の `boolean | 'slow'` 戻り値を明確な `CollisionResult` 型に置換。新しい障害物タイプを追加する場合、ハンドラファイルを追加し、レジストリに登録するだけで対応可能（OCP 準拠）。

### 2.4 物理演算の DbC 強化

```typescript
// physics-service.ts
// 事前条件チェック付き

function applyMovement(player: Player, input: InputState, speed: number, dir: RampDirection): Player {
  // DbC: speed は正の有限数
  assertPositiveFinite(speed, 'speed');
  // DbC: dir は 1 または -1
  assertDirection(dir);
  // ... 既存ロジック
}

function applyJump(player: Player, input: InputState, effect: EffectState): JumpResult {
  // DbC: player.jumpCD >= 0
  assertNonNegative(player.jumpCD, 'jumpCD');
  // ... 既存ロジック
}
```

### 2.5 衝突レジストリ

```typescript
// collision-registry.ts
const registry = new Map<ObstacleTypeValue, CollisionHandler>();

function registerHandler(type: ObstacleTypeValue, handler: CollisionHandler): void;
function getHandler(type: ObstacleTypeValue): CollisionHandler | undefined;

// 初期登録
registerHandler(ObstacleType.HOLE_S, new HoleHandler('small'));
registerHandler(ObstacleType.HOLE_L, new HoleHandler('large'));
registerHandler(ObstacleType.ROCK, new RockHandler());
registerHandler(ObstacleType.ENEMY, new EnemyHandler());
registerHandler(ObstacleType.ENEMY_V, new EnemyHandler());
registerHandler(ObstacleType.SCORE, new ItemHandler('score'));
registerHandler(ObstacleType.REVERSE, new ItemHandler('reverse'));
registerHandler(ObstacleType.FORCE_JUMP, new ItemHandler('forceJ'));
```

## 3. アプリケーション層仕様

### 3.1 FrameProcessor

```typescript
interface FrameInput {
  readonly input: InputState;
  readonly frameCount: number;
}

interface FrameResult {
  readonly world: GameWorld;
  readonly ui: UIState;
  readonly events: readonly GameEvent[];
  readonly transition: 'none' | 'died' | 'cleared';
}

// 1フレーム処理（純粋関数、副作用なし）
function processFrame(
  world: GameWorld,
  ui: UIState,
  frameInput: FrameInput,
  ramps: readonly Ramp[],
): FrameResult;
```

**変更点**:
- 25個の `useState` を `GameWorld` + `UIState` に集約
- `setInterval` 内の副作用を排除し、イベント配列で返却
- `useReducer` パターンで React 側の更新を単一化

### 3.2 CollisionProcessor

```typescript
// 衝突処理全体のオーケストレーション
function processCollisions(
  world: GameWorld,
  ramp: Ramp,
  passedObstacles: ReadonlySet<string>,
): {
  readonly world: GameWorld;
  readonly events: readonly GameEvent[];
  readonly newPassedObstacles: ReadonlySet<string>;
  readonly dead: boolean;
};
```

### 3.3 ジェネレータの分離

既存の `generators.ts` を `application/generators/` に分離:
- `ramp-generator.ts`: ランプ生成ロジック
- `obstacle-generator.ts`: 障害物生成テーブルと生成ロジック
- `background-generator.ts`: 背景（雲・ビル）生成ロジック

## 4. インフラ層仕様

### 4.1 オーディオポート

```typescript
interface AudioPort {
  init(): void;
  play(sound: string): void;
  playMelody(name: string): void;
  playCombo(level: number): void;
  startBGM(): void;
  stopBGM(): void;
  cleanup(): void;
}

// 実装
function createWebAudioAdapter(): AudioPort;

// テスト用
function createNullAudioAdapter(): AudioPort;
```

**設計意図**: 現在の IIFE シングルトン `Audio` をインターフェースで抽象化し、テスト時にモック可能にする。

### 4.2 ストレージ

```typescript
// 既存の score-storage.ts のインターフェース抽出
interface ScoreRepository {
  getHighScore(key: string): Promise<number>;
  saveScore(key: string, score: number): Promise<void>;
}
```

## 5. プレゼンテーション層仕様

### 5.1 画面分割

| 画面 | ファイル | 責務 |
|------|---------|------|
| タイトル | `TitleScreen.tsx` | タイトル表示、操作説明、ハイスコア |
| プレイ | `PlayScreen.tsx` | ゲームエンティティ描画、HUD、エフェクト |
| リザルト | `ResultScreen.tsx` | スコア・ランク表示、リトライ/タイトル選択 |

### 5.2 ゲームエンジンフック

```typescript
function useGameEngine(config: {
  audio: AudioPort;
  scoreRepository: ScoreRepository;
}): {
  // 状態
  gameState: GameStateValue;
  world: GameWorld;
  ui: UIState;
  hiScore: number;
  isNewHighScore: boolean;
  clearAnim: ClearAnim;
  death: DeathState | undefined;
  countdown: number;

  // アクション
  startGame: () => void;
  goToTitle: () => void;

  // 入力
  handleKeyDown: (event: KeyboardEvent) => void;
  handleKeyUp: (event: KeyboardEvent) => void;
  touchKeys: React.MutableRefObject<TouchKeys>;
};
```

### 5.3 既存レンダラーの移行

既存の `renderers/` 内のコンポーネントは `presentation/components/` に移行。
各コンポーネントのインターフェースは原則維持し、内部のみリファクタリング。

## 6. テスト仕様

### 6.1 テストファクトリの作成

```typescript
// test-factories.ts
function buildPlayer(overrides?: Partial<Player>): Player;
function buildRamp(overrides?: Partial<Ramp>): Ramp;
function buildObstacle(overrides?: Partial<Obstacle>): Obstacle;
function buildParticle(overrides?: Partial<Particle>): Particle;
function buildScorePopup(overrides?: Partial<ScorePopup>): ScorePopup;
function buildGameWorld(overrides?: Partial<GameWorld>): GameWorld;
function buildUIState(overrides?: Partial<UIState>): UIState;
function buildCollisionContext(overrides?: Partial<CollisionContext>): CollisionContext;
```

### 6.2 テスト構造の統一

- すべてのテストで AAA パターン（Arrange / Act / Assert）を明示コメント
- `describe` のネストを「正常系」「異常系」「境界値」で統一
- テスト名は日本語で「何をしたら何が起きるか」を記述

### 6.3 追加テスト

| テスト対象 | テスト種別 | テスト内容 |
|-----------|----------|-----------|
| `physics-service.ts` | 単体 | 移動・ジャンプ・遷移 |
| `entities/*.ts` | 単体 | エンティティ生成・DbC |
| 衝突ハンドラ | 単体 | 各障害物タイプの衝突結果 |
| `frame-processor.ts` | 単体 | 1フレーム処理の結果 |
| `collision-processor.ts` | 単体 | 衝突処理の統合結果 |
| `generators/*.ts` | 単体 | ランプ・障害物生成 |
| `particles.ts` | 単体 | パーティクル更新 |
| `TitleScreen` | 統合 | タイトル表示 |
| `PlayScreen` | 統合 | HUD・エンティティ描画 |
| `ResultScreen` | 統合 | スコア・ランク表示 |
| `useGameEngine` | 統合 | 画面遷移フロー |

### 6.4 E2E テスト（最低限のハッピーパス）

アクションゲームの性質上、障害物がランダム生成されるためクリアまでの E2E テストは現実的でない。
無敵モード（チートコード）を使えば理論上可能だが、E2E の目的はゲームバランスではなく画面遷移の正常動作確認のため、最低限のハッピーパスに限定する。

```typescript
// non-brake-descent.spec.ts
describe('Non-Brake Descent ハッピーパス', () => {
  it('タイトル画面が表示される');
  it('Space キーでカウントダウンが始まる');
  it('カウントダウン後にプレイ画面に遷移する（HUD・スコア表示）');
});
```
```

### 6.5 テスト品質基準

| 対象 | 目標 |
|------|------|
| ドメインロジック | 90% 以上 |
| アプリケーション層 | 80% 以上 |
| プレゼンテーション層 | 70% 以上 |

## 7. DbC（契約による設計）仕様

### 7.1 既存の DbC（math-utils.ts）の活用

`math-utils.ts` に既に `ensureFinite` / `ensureRange` のアサーション関数が実装されている。
これを他のドメインサービスにも拡張適用する。

### 7.2 追加アサーション

```typescript
// domain/math-utils.ts に追加
function assertPositiveFinite(value: number, name: string): void;
function assertNonNegative(value: number, name: string): void;
function assertDirection(dir: number): asserts dir is 1 | -1;
```

### 7.3 適用箇所

- `physics-service.ts`: speed > 0、direction は ±1
- `collision-service.ts`: threshold > 0
- エンティティ生成: パラメータの範囲チェック
- `scoring-service.ts`: score >= 0

## 8. 移行戦略

- 既存のファイルは段階的に移行し、一度に全ファイルを変更しない
- 各 Phase の終了時に既存テストが全パスすることを確認
- 外部からの参照を壊さないよう re-export で後方互換性を維持
- `NonBrakeDescentGame.tsx` は最後に分割（テストが十分に揃ってから）
