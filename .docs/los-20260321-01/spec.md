# Labyrinth of Shadows リファクタリング仕様書

## 1. ドメインモデル仕様

### 1.1 型定義（domain/types.ts）

```typescript
// 座標を表す値オブジェクト
interface Position {
  readonly x: number;
  readonly y: number;
}

// 難易度
type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

// 敵タイプ
type EnemyType = 'wanderer' | 'chaser' | 'teleporter';

// アイテムタイプ
type ItemType = 'key' | 'trap' | 'heal' | 'speed' | 'map';

// ゲームイベント（副作用のトリガー）
type GameEvent =
  | { type: 'SOUND_PLAY'; sound: SoundName; volume: number }
  | { type: 'SOUND_SPATIAL'; sound: SoundName; volume: number; pan: number }
  | { type: 'MESSAGE'; text: string; duration: number }
  | { type: 'GAME_END'; reason: 'victory' | 'gameover' | 'timeout' };
```

### 1.2 Player モデル（domain/models/player.ts）

**責務**: プレイヤーの状態と移動計算

```typescript
interface Player {
  readonly position: Position;
  readonly angle: number;
  readonly stamina: number;
  readonly isHiding: boolean;
  readonly isSprinting: boolean;
}

// 純粋関数
function movePlayer(player: Player, input: MoveInput, maze: Maze, dt: number, config: PlayerConfig): Player
function updateHiding(player: Player, wantHide: boolean, energy: number, dt: number, config: HidingConfig): { player: Player; energy: number }
function updateSprinting(player: Player, wantSprint: boolean, dt: number, config: StaminaConfig): Player
```

**事前条件（DbC）**:
- `dt >= 0`: デルタタイムは非負
- `stamina` は 0〜100 の範囲
- `energy` は 0〜100 の範囲

### 1.3 Enemy モデル（domain/models/enemy.ts）

**責務**: 敵の状態管理

```typescript
interface Enemy {
  readonly position: Position;
  readonly direction: number;
  readonly isActive: boolean;
  readonly activationTime: number;
  readonly lastSeenPlayer: Position | undefined;  // null → undefined（プロジェクト規約）
  readonly type: EnemyType;
  readonly path: readonly Position[];
  readonly pathRecalcTime: number;
  readonly teleportCooldown: number;
}
```

### 1.4 敵 AI Strategy（domain/services/enemy-strategy.ts）

**Strategy パターン**により、敵タイプごとの振る舞いを分離する。

```typescript
interface EnemyStrategy {
  /** 敵の次の状態を計算する（純粋関数） */
  update(params: EnemyUpdateParams): EnemyUpdateResult;
}

interface EnemyUpdateParams {
  readonly enemy: Enemy;
  readonly playerPosition: Position;
  readonly isPlayerHiding: boolean;
  readonly maze: Maze;
  readonly enemySpeed: number;
  readonly dt: number;
  readonly gameTime: number;
  readonly randomFn: () => number;  // DI 対応の乱数
}

interface EnemyUpdateResult {
  readonly enemy: Enemy;
  readonly events: readonly GameEvent[];
}
```

**実装クラス**:

| Strategy | 振る舞い |
|----------|---------|
| `WandererStrategy` | ランダム巡回。プレイヤーを追跡しない。壁に当たったら方向転換。 |
| `ChaserStrategy` | BFS パスファインディングでプレイヤーを追跡。視野内で加速。見失ったら最後の目撃位置へ移動後、ランダム巡回。 |
| `TeleporterStrategy` | クールダウン経過後にテレポート。短距離では直接追跡。 |

### 1.5 Maze モデル（domain/models/maze.ts）

**責務**: 迷路データの保持と判定

```typescript
interface Maze {
  readonly grid: readonly (readonly number[])[];
  readonly size: number;
}

// 純粋関数
function isWalkable(maze: Maze, x: number, y: number): boolean
function hasLineOfSight(maze: Maze, from: Position, to: Position): boolean
function getEmptyCells(maze: Maze, randomFn?: () => number): readonly Position[]
```

### 1.6 Item モデル（domain/models/item.ts）

**責務**: アイテムの状態とピックアップ処理

```typescript
interface Item {
  readonly position: Position;
  readonly type: ItemType;
  readonly isCollected: boolean;
}

interface ItemPickupResult {
  readonly item: Item;
  readonly stateChanges: Partial<GameStateChanges>;
  readonly events: readonly GameEvent[];
}

function processItemPickup(item: Item, gameContext: ItemPickupContext): ItemPickupResult
```

### 1.7 GameState モデル（domain/models/game-state.ts）

**責務**: ゲーム全体の状態管理

```typescript
interface GameState {
  readonly maze: Maze;
  readonly player: Player;
  readonly enemies: readonly Enemy[];
  readonly items: readonly Item[];
  readonly exit: Position;
  readonly score: number;
  readonly combo: number;
  readonly lastKeyTime: number;
  readonly collectedKeys: number;
  readonly requiredKeys: number;
  readonly remainingTime: number;
  readonly lives: number;
  readonly maxLives: number;
  readonly energy: number;
  readonly invincibilityTime: number;
  readonly speedBoostTime: number;
  readonly enemySpeed: number;
  readonly gameTime: number;
  readonly explored: ReadonlySet<string>;
  readonly difficulty: Difficulty;
}
```

**重要**: ゲームループ内ではパフォーマンスのため mutable な内部状態を使用し、ドメイン境界（テスト、イベント発行）では readonly 型にキャストする。

---

## 2. ドメインサービス仕様

### 2.1 迷路生成（domain/services/maze-generator.ts）

```typescript
interface MazeGenerator {
  generate(size: number, randomFn?: () => number): Maze;
}

class RecursiveBacktrackGenerator implements MazeGenerator { ... }
class PrimGenerator implements MazeGenerator { ... }
```

**事前条件**:
- `size` は奇数かつ 7 以上
- `randomFn` は 0〜1 の値を返す

### 2.2 パスファインディング（domain/services/pathfinding.ts）

```typescript
function bfsPath(maze: Maze, from: Position, to: Position): readonly Position[]
```

**事後条件**:
- 返却パスの各ポイントは `isWalkable` である
- 到達不能の場合は空配列

### 2.3 衝突判定（domain/services/collision.ts）

```typescript
// 定数化されたしきい値
const PLAYER_ITEM_PICKUP_DISTANCE = 0.5;
const PLAYER_EXIT_DISTANCE = 0.55;
const PLAYER_ENEMY_COLLISION_DISTANCE = 0.45;

function isPlayerNearItem(playerPos: Position, itemPos: Position): boolean
function isPlayerNearExit(playerPos: Position, exitPos: Position): boolean
function isPlayerCollidingEnemy(playerPos: Position, enemyPos: Position): boolean
```

### 2.4 スコア計算（domain/services/scoring.ts）

```typescript
interface ScoreConfig {
  readonly keyBase: number;
  readonly victoryBonus: number;
  readonly damagePenalty: number;
  readonly healFullBonus: number;
  readonly comboTimeWindow: number;
}

function calculateKeyScore(combo: number, config: ScoreConfig): number
function calculateVictoryScore(remainingTime: number, config: ScoreConfig): number
function calculateCombo(currentCombo: number, gameTime: number, lastKeyTime: number, config: ScoreConfig): number
```

---

## 3. アプリケーション層仕様

### 3.1 ゲームイベント（application/game-events.ts）

ドメイン層とインフラ層を分離するためのイベント型。

```typescript
type GameEvent =
  | { type: 'SOUND_PLAY'; sound: SoundName; volume: number }
  | { type: 'SOUND_SPATIAL'; sound: SoundName; volume: number; pan: number }
  | { type: 'BGM_UPDATE'; danger: number }
  | { type: 'MESSAGE'; text: string }
  | { type: 'GAME_END'; reason: 'victory' | 'gameover' | 'timeout' };
```

### 3.2 ゲームエンジン（application/game-engine.ts）

```typescript
interface GameTickResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
  readonly closestEnemyDistance: number;
}

function gameTick(
  state: GameState,
  input: PlayerInput,
  dt: number,
  config: GameConfig
): GameTickResult
```

**責務**:
1. プレイヤー状態の更新（隠れ、ダッシュ、移動）
2. アイテム収集判定
3. 出口判定
4. 敵 AI 更新・衝突判定
5. タイマー更新
6. イベントの収集と返却

**副作用**: なし（全てイベントとして返却）

### 3.3 入力ハンドラ（application/input-handler.ts）

```typescript
interface PlayerInput {
  readonly moveLeft: boolean;
  readonly moveRight: boolean;
  readonly moveForward: boolean;
  readonly moveBackward: boolean;
  readonly hide: boolean;
  readonly sprint: boolean;
}

function createPlayerInput(keys: Record<string, boolean>): PlayerInput
```

---

## 4. インフラ層仕様

### 4.1 AudioService（infrastructure/audio/audio-service.ts）

```typescript
interface IAudioService {
  play(sound: SoundName, volume: number): void;
  playSpatial(sound: SoundName, volume: number, pan: number): void;
  startBGM(): void;
  stopBGM(): void;
  updateBGM(danger: number): void;
}

class WebAudioService implements IAudioService { ... }
class NullAudioService implements IAudioService { ... }  // テスト用
```

### 4.2 Renderer（infrastructure/rendering/renderer.ts）

既存の描画ロジックはそのまま維持し、以下の分割のみ行う:

- `brick-texture.ts`: レンガテクスチャ計算（`getBrickColor`）
- `sprite-renderer.ts`: スプライト描画
- `effect-renderer.ts`: エフェクト描画（ダメージフラッシュ、ビネット等）
- `renderer.ts`: オーケストレータ（各描画関数を呼び出す）

### 4.3 スコアリポジトリ（infrastructure/storage/score-repository.ts）

```typescript
interface IScoreRepository {
  save(gameId: string, score: number, difficulty: string): Promise<void>;
  getHighScore(gameId: string, difficulty: string): Promise<number>;
}
```

---

## 5. プレゼンテーション層仕様

### 5.1 カスタムフック

#### useGameLoop

```typescript
function useGameLoop(params: {
  canvasRef: RefObject<HTMLCanvasElement>;
  minimapCanvasRef: RefObject<HTMLCanvasElement>;
  gameState: MutableRefObject<GameState | null>;
  paused: boolean;
  audioService: IAudioService;
  onGameEnd: (reason: string) => void;
}): {
  hud: HUDData;
}
```

#### useInput

```typescript
function useInput(): {
  keysRef: MutableRefObject<Record<string, boolean>>;
  getPlayerInput: () => PlayerInput;
}
```

#### useAudio

```typescript
function useAudio(): {
  audioService: IAudioService;
  processEvents: (events: readonly GameEvent[]) => void;
}
```

### 5.2 スタイルの移動

`src/pages/MazeHorrorPage.styles.ts` から feature 内の `presentation/styles/game.styles.ts` にスタイルをコピーし、段階的に参照を切り替える。

---

## 6. テスト仕様

### 6.1 テストヘルパー（__tests__/helpers/）

#### GameState ビルダー

```typescript
class GameStateBuilder {
  private state: GameState;

  static create(difficulty?: Difficulty): GameStateBuilder;
  withPlayer(overrides: Partial<Player>): this;
  withEnemy(type: EnemyType, overrides?: Partial<Enemy>): this;
  withItem(type: ItemType, position: Position): this;
  withMaze(maze: number[][]): this;
  build(): GameState;
}
```

**目的**: テストデータの生成を明示的にし、if ガードを不要にする

#### AudioContext モック共通化

```typescript
// __tests__/helpers/audio-mock.ts
function setupAudioContextMock(): void;
function createMockAudioService(): IAudioService;
```

### 6.2 ドメイン層テスト方針

| テスト対象 | カバレッジ目標 | テスト戦略 |
|-----------|-------------|-----------|
| collision.ts | 95% | 全パターン網羅（近い/遠い/境界値） |
| scoring.ts | 95% | 全計算パターン + コンボ組み合わせ |
| pathfinding.ts | 90% | 既知の迷路での到達可能/不能テスト |
| maze-generator.ts | 85% | 構造プロパティテスト（外壁、開始点、連結性） |
| enemy-strategy.ts | 90% | 各 Strategy の振る舞い検証 |
| player.ts | 90% | 移動、隠れ、ダッシュの状態遷移 |

### 6.3 既存テストのリファクタリング方針

| 現在の問題 | 対策 |
|-----------|------|
| `if (healItem) { ... }` ガード | GameStateBuilder で確実にアイテムを配置 |
| AudioContext モック重複 | 共通ヘルパーに統合 |
| `GameStateFactory.create` への依存 | テスト用ビルダーで明示的に状態構築 |
| 加速ブーストテストの不安定さ | 固定迷路 + 壁のない空間でテスト |
| 敵 AI テストのランダム性 | 乱数関数を DI して固定シードを使用 |

### 6.4 E2E テスト

**結論: 導入見送り**

Canvas ベースの 3D レンダリングゲームのため、画面遷移 E2E テストを試みたが CI 環境（GitHub Actions）で Canvas 描画の初期化待ちが不安定となり、タイムアウト・リトライで CI が長引く問題が発生した。単体テスト（177件）とブラウザ手動確認で品質を担保する方針とした。

---

## 7. 定数管理仕様

### 7.1 ドメイン定数（domain/constants.ts）

現在の `constants.ts` を以下のカテゴリに分類:

```typescript
// ゲームバランス定数
export const GAME_BALANCE = {
  player: {
    ROTATION_SPEED: 0.003,
    MOVE_SPEED: 0.0024,
    COLLISION_RADIUS: 0.2,
    SPRINT_MULTIPLIER: 1.5,
  },
  hiding: {
    ENERGY_DRAIN_RATE: 0.02,
    ENERGY_RECHARGE_RATE: 0.016,
    MIN_ENERGY_TO_HIDE: 5,
  },
  stamina: {
    DRAIN_RATE: 0.022,
    RECHARGE_RATE: 0.014,
  },
  collision: {
    ITEM_PICKUP_DISTANCE: 0.5,
    EXIT_DISTANCE: 0.55,
    ENEMY_COLLISION_DISTANCE: 0.45,
    ENEMY_KNOCKBACK_DISTANCE: 2.5,
  },
  enemy: {
    CHASE_RANGE: 8,
    MIN_SPAWN_DISTANCE: 5,
    PATH_RECALC_INTERVAL: 500,
    TELEPORT_COOLDOWN: 8000,
    TELEPORT_CHASE_RANGE: 4,
  },
  scoring: {
    KEY_BASE_SCORE: 100,
    VICTORY_BONUS: 500,
    DAMAGE_PENALTY: 50,
    HEAL_FULL_BONUS: 50,
    COMBO_TIME_WINDOW: 10000,
  },
  timing: {
    INVINCIBILITY_DURATION: 2500,
    MESSAGE_DURATION: 2000,
    TRAP_TIME_PENALTY: 12000,
    SPEED_BOOST_DURATION: 10000,
  },
  items: {
    SPEED_BOOST_MULTIPLIER: 1.3,
    MAP_REVEAL_RADIUS: 5,
  },
} as const;

// 難易度設定
export const DIFFICULTY_CONFIG = { ... } as const;
```

### 7.2 UI コンテンツ（presentation/content.ts）

ストーリーテキスト、アイテム表示名、デモスライド等の UI コンテンツはプレゼンテーション層に移動。

### 7.3 レンダリング設定（infrastructure/rendering/render-config.ts）

FOV、レイ数、最大描画距離等のレンダリング設定はインフラ層に配置。

---

## 8. 命名規約の改善

| 現在 | 変更後 | 理由 |
|------|--------|------|
| `g` | `state` or `gameState` | 可読性向上 |
| `e` | `enemy` | 可読性向上 |
| `d` | `dist` or `distance` | 意味の明確化 |
| `k` | `keys` or `pressedKeys` | 曖昧さの排除 |
| `dt` | `deltaTime` (引数名は `dt` 許容) | ゲーム開発の慣習として許容 |
| `W`, `H` | `canvasWidth`, `canvasHeight` | 意味の明確化 |
| `got` | `isCollected` | ブール変数の命名規則 |
| `actTime` | `activationTime` | 省略の排除 |
| `eSpeed` | `enemySpeed` | 省略の排除 |
| `gTime` | `gameTime` | 省略の排除 |
| `invince` | `invincibilityTime` | 省略の排除 |
| `msg` | `message` | 省略の排除 |
| `reqKeys` | `requiredKeys` | 省略の排除 |
