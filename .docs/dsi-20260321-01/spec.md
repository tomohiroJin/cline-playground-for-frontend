# Deep Sea Interceptor リファクタリング仕様書

## 1. ディレクトリ構成（目標状態）

```
src/features/deep-sea-interceptor/
  domain/
    entities/
      position.ts          # Position 値オブジェクト（不変）
      player.ts            # Player エンティティ
      bullet.ts            # Bullet / EnemyBullet エンティティ
      enemy.ts             # Enemy エンティティ（ボス判定メソッド含む）
      item.ts              # Item エンティティ
      particle.ts          # Particle / Bubble エンティティ
      index.ts             # re-export
    services/
      collision-service.ts # 衝突判定サービス（純粋関数）
      damage-service.ts    # ダメージ計算サービス
      scoring-service.ts   # スコア・コンボ計算サービス
      spawn-service.ts     # スポーンロジック
      index.ts
    strategies/
      movement/
        movement-strategy.ts        # 移動戦略インターフェース
        straight-strategy.ts        # 直進
        sine-strategy.ts            # サイン波
        drift-strategy.ts           # ドリフト
        boss-strategy.ts            # ボス
        homing-strategy.ts          # ホーミング
        index.ts
      gimmick/
        gimmick-strategy.ts         # ギミック戦略インターフェース
        current-gimmick.ts          # Stage 1: 海流
        minefield-gimmick.ts        # Stage 2: 機雷原
        thermal-vent-gimmick.ts     # Stage 3: 熱水柱
        bioluminescence-gimmick.ts  # Stage 4: 発光
        pressure-gimmick.ts         # Stage 5: 水圧
        gimmick-registry.ts         # ギミック登録・ディスパッチ
        index.ts
      weapon/
        weapon-strategy.ts          # 武器戦略インターフェース
        torpedo-strategy.ts         # トーピード
        sonar-wave-strategy.ts      # ソナーウェーブ
        bio-missile-strategy.ts     # バイオミサイル
        weapon-registry.ts          # 武器登録・ディスパッチ
        index.ts
      enemy-ai/
        attack-pattern.ts           # 攻撃パターンインターフェース
        boss-patterns.ts            # ボス別攻撃パターン
        midboss-patterns.ts         # ミッドボス別攻撃パターン
        normal-pattern.ts           # 通常敵パターン
        enemy-ai-service.ts         # AI ディスパッチサービス
        index.ts
    events/
      game-events.ts       # ドメインイベント型定義
    types.ts               # ドメイン型定義（リファクタリング済み）
    constants.ts           # ドメイン定数（ゲームバランス値）
  application/
    game-loop/
      frame-processor.ts   # 1フレーム更新のオーケストレーション
      game-state-manager.ts # GameState のイミュータブル更新
    stages/
      stage-progression.ts # ステージ進行ロジック
      stage-config.ts      # ステージ設定
    achievements/
      achievement-checker.ts # 実績判定
      achievement-list.ts    # 実績定義
  infrastructure/
    audio/
      audio-system.ts      # オーディオシステム（Web Audio API）
      sound-definitions.ts # サウンド定義
    storage/
      score-repository.ts  # スコア永続化
      achievement-repository.ts # 実績永続化
    input/
      input-handler.ts     # 入力抽象化
      keyboard-adapter.ts  # キーボードアダプタ
      touch-adapter.ts     # タッチアダプタ
  presentation/
    screens/
      TitleScreen.tsx      # タイトル画面
      PlayScreen.tsx       # プレイ画面
      ResultScreen.tsx     # リザルト画面（ゲームオーバー/エンディング共通）
    components/
      PlayerSprite.tsx
      EnemySprite.tsx
      BulletSprite.tsx
      HUD.tsx
      TouchControls.tsx
      GimmickEffects.tsx   # ギミック視覚エフェクト
      ScreenOverlays.tsx   # WARNING、ボス撃破、ステージクリア等
    hooks/
      use-game-loop.ts     # ゲームループフック
      use-input.ts         # 入力フック
      use-audio.ts         # オーディオフック
      use-deep-sea-game.ts # 統合フック（薄いオーケストレーション層）
    styles/
      game-styles.ts       # styled-components 定義
      theme.ts             # カラーテーマ
  __tests__/
    domain/
      entities/            # エンティティテスト
      services/            # サービステスト
      strategies/          # 戦略テスト
    application/
      game-loop/           # ゲームループテスト
      stages/              # ステージ進行テスト
      achievements/        # 実績テスト
    infrastructure/        # インフラ層テスト
    presentation/          # コンポーネントテスト（統合テスト含む）
    helpers/
      test-helpers.ts      # テストヘルパー拡張
      test-factories.ts    # テスト用エンティティファクトリ
  index.ts                 # 公開 API の re-export
```

## 2. ドメイン層仕様

### 2.1 値オブジェクト: Position

```typescript
// 不変の座標値オブジェクト
interface Position {
  readonly x: number;
  readonly y: number;
}

// ファクトリ関数（事前条件チェック付き）
function createPosition(x: number, y: number): Position;

// 演算関数
function addPosition(a: Position, b: Position): Position;
function clampPosition(pos: Position, bounds: Bounds): Position;
function distanceBetween(a: Position, b: Position): number;
```

**DbC 契約**:
- 事前条件: `x`, `y` は有限数値（`Number.isFinite`）
- 事後条件: 返却値は不変オブジェクト

### 2.2 エンティティ: Enemy

```typescript
interface Enemy {
  readonly id: number;
  readonly position: Position;
  readonly enemyType: EnemyType;
  readonly hp: number;
  readonly maxHp: number;
  // ...
}

// ボス判定をエンティティのメソッドとして提供
function isBossType(type: EnemyType): boolean;
function isMidbossType(type: EnemyType): boolean;

// ダメージ適用（新しい Enemy を返す、イミュータブル）
function applyDamage(enemy: Enemy, damage: number): Enemy;
```

**DbC 契約**:
- 事前条件: `damage >= 0`
- 事後条件: `result.hp >= 0`、`result.hp <= enemy.hp`
- 不変条件: `enemy.hp <= enemy.maxHp`

### 2.3 型安全性強化

```typescript
// Before: Record<string, ...> で型制限なし
const EnemyConfig: Record<string, { ... }>;

// After: EnemyType ユニオンで制約
const EnemyConfig: Record<EnemyType, EnemyConfigEntry>;
```

`BossPatterns`、`MidbossPatterns` も同様に、キーを `EnemyType` のサブセットで制約する。

### 2.4 移動戦略インターフェース

```typescript
// Strategy パターンの導入
interface MovementStrategy<T extends Position> {
  move(entity: T): T;
}

// ギミック戦略
interface GimmickStrategy {
  apply(state: GameState, now: number): GameState;
}
```

**設計意図**: 新しい移動パターンやギミックを追加する際、既存コードを変更せずにファイル追加のみで対応可能（OCP 準拠）。

### 2.5 ギミックレジストリ

```typescript
// ギミック名とストラテジーの対応を動的に登録
const gimmickRegistry = new Map<string, GimmickStrategy>();

// ステージ設定からギミックを解決
function resolveGimmick(gimmickName: string): GimmickStrategy;
```

`game-logic.ts` の `switch` 文を排除し、レジストリパターンで置換する。

### 2.6 ドメインイベント

```typescript
// 型安全なイベント定義（ユニオン型）
type GameEvent =
  | { type: 'ENEMY_DESTROYED'; enemy: Enemy; score: number }
  | { type: 'BOSS_DEFEATED'; bossType: EnemyType }
  | { type: 'PLAYER_HIT'; livesRemaining: number }
  | { type: 'ITEM_COLLECTED'; itemType: ItemType }
  | { type: 'GRAZE'; count: number }
  | { type: 'STAGE_CLEARED'; stage: number; bonus: number }
  | { type: 'GAME_OVER'; finalScore: number }
  | { type: 'AUDIO'; soundName: string };
```

**設計意図**: `AudioEvent` を汎用的なドメインイベントに拡張し、Observer パターンでサウンド・演出・実績を疎結合に処理する。

## 3. アプリケーション層仕様

### 3.1 FrameProcessor

```typescript
interface FrameResult {
  readonly gameState: GameState;
  readonly uiState: UiState;
  readonly events: readonly GameEvent[];
  readonly screenEvent: 'none' | 'gameover' | 'stageCleared' | 'ending';
}

// 1フレーム処理（純粋関数、副作用なし）
function processFrame(
  gameState: GameState,
  uiState: UiState,
  now: number,
): FrameResult;
```

**変更点**:
- `GameState` のミューテーションを排除し、イミュータブルな更新に変更
- `audioPlay` コールバックを排除し、`events` 配列でイベントを返却
- 副作用（オーディオ再生、ストレージ保存）は呼び出し側で処理

### 3.2 GameStateManager

```typescript
// イミュータブルな状態更新ヘルパー
function updatePlayer(state: GameState, player: Position): GameState;
function addBullets(state: GameState, bullets: Bullet[]): GameState;
function removeDeadEnemies(state: GameState): GameState;
```

### 3.3 StageProgression

既存の `checkStageProgression` をそのまま維持しつつ、ステージ設定を分離。

## 4. インフラ層仕様

### 4.1 オーディオシステム

```typescript
interface AudioPort {
  play(soundName: string): void;
  init(): void;
}

// 実装
function createWebAudioSystem(): AudioPort;

// テスト用スタブ
function createNullAudioSystem(): AudioPort;
```

### 4.2 ストレージ

```typescript
interface ScoreRepository {
  getHighScore(key: string): Promise<number>;
  saveScore(key: string, score: number): Promise<void>;
}

interface AchievementRepository {
  load(): SavedAchievementData;
  save(data: SavedAchievementData): void;
}
```

### 4.3 入力ハンドラ

```typescript
interface InputState {
  readonly dx: number;
  readonly dy: number;
  readonly shoot: boolean;
  readonly chargeStart: boolean;
  readonly chargeEnd: boolean;
}

interface InputAdapter {
  getState(): InputState;
  attach(): void;
  detach(): void;
}
```

## 5. プレゼンテーション層仕様

### 5.1 画面分割

| 画面 | ファイル | 責務 |
|------|---------|------|
| タイトル | `TitleScreen.tsx` | 武器選択、難易度選択、ハイスコア表示 |
| プレイ | `PlayScreen.tsx` | ゲームエンティティ描画、HUD、タッチコントロール |
| リザルト | `ResultScreen.tsx` | スコア表示、ランク表示、実績表示、リトライ/タイトルボタン |

### 5.2 統合フック

```typescript
function useDeepSeaGame(): {
  screenState: ScreenState;
  uiState: UiState;
  gameData: React.RefObject<GameState>;
  actions: {
    startGame: () => void;
    returnToTitle: () => void;
  };
  input: {
    handleTouchMove: (dx: number, dy: number) => void;
    handleTouchShoot: () => void;
    handleCharge: (e: { type: string }) => void;
  };
  config: {
    selectedWeapon: WeaponType;
    setSelectedWeapon: (w: WeaponType) => void;
    selectedDifficulty: Difficulty;
    setSelectedDifficulty: (d: Difficulty) => void;
  };
  achievements: Achievement[];
};
```

### 5.3 スタイル統一

- すべてのインラインスタイルを styled-components またはテーマ定数に移行
- カラーパレットを `theme.ts` に集約
- マジックナンバー（フォントサイズ、パディング等）を定数化

## 6. テスト仕様

### 6.1 テストリファクタリング方針

#### テストヘルパーの拡張

```typescript
// test-factories.ts
function buildEnemy(overrides?: Partial<Enemy>): Enemy;
function buildBullet(overrides?: Partial<Bullet>): Bullet;
function buildEnemyBullet(overrides?: Partial<EnemyBullet>): EnemyBullet;
function buildItem(overrides?: Partial<Item>): Item;
function buildGameState(overrides?: Partial<GameState>): GameState;
function buildUiState(overrides?: Partial<UiState>): UiState;
```

#### テスト構造の統一

- すべてのテストで AAA パターン（Arrange / Act / Assert）を明示
- `describe` のネストを「正常系」「異常系」「境界値」で統一
- テスト名は日本語で「何をしたら何が起きるか」を明確に記述

### 6.2 追加テスト

| テスト対象 | テスト種別 | テスト内容 |
|-----------|----------|-----------|
| `achievements.ts` | 単体 | 各実績条件の判定、load/save |
| `audio.ts` | 単体 | AudioContext モック、サウンド再生 |
| ギミック戦略 | 単体 | 各ステージギミックの動作 |
| 武器戦略 | 単体 | 既存テストのリファクタリング |
| `TitleScreen` | 統合 | 武器選択、難易度選択、ゲーム開始 |
| `ResultScreen` | 統合 | リザルト表示、リトライ、タイトル戻り |
| `PlayScreen` | 統合 | HUD表示、エンティティ描画 |
| `useDeepSeaGame` | 統合 | 画面遷移フロー |

### 6.3 テスト品質基準

- ドメインロジック: 90% 以上のカバレッジ
- アプリケーション層: 80% 以上のカバレッジ
- プレゼンテーション層: 70% 以上のカバレッジ
- `Date.now()` の直接使用をゼロに（テスト時はタイムスタンプを注入）

## 7. DbC（契約による設計）仕様

### 7.1 アサーション関数

```typescript
// 共通アサーション
function assertFiniteNumber(value: number, name: string): void;
function assertNonNegative(value: number, name: string): void;
function assertInRange(value: number, min: number, max: number, name: string): void;

// 開発ビルドのみで有効（本番ビルドではノーオプション）
const IS_DEV = process.env.NODE_ENV !== 'production';
function assert(condition: boolean, message: string): asserts condition;
```

### 7.2 適用箇所

- エンティティ生成: パラメータの範囲チェック
- ダメージ計算: `damage >= 0`、結果の `hp >= 0`
- スコア計算: `scoreDelta >= 0`
- 座標更新: 画面範囲内

## 8. 移行戦略

- 既存のファイルは段階的に移行し、一度に全ファイルを変更しない
- 各 Phase の終了時に既存テストが全パスすることを確認
- `index.ts` の公開 API は変更せず、内部実装のみリファクタリング
- 既存の re-export パスを維持し、外部からの参照を壊さない
