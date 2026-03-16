# IPNE 大規模リファクタリング仕様書

## 1. アーキテクチャ仕様

### 1.1 レイヤードアーキテクチャ（目標構成）

```
ipne/
├── domain/                     # ドメイン層（ビジネスルール、外部依存なし）
│   ├── types/                  # 型定義（ドメインモデル）
│   │   ├── world.ts            # TileType, GameMap, Position, Direction, MazeConfig
│   │   ├── player.ts           # Player, PlayerClass, ClassConfig, PlayerStats
│   │   ├── enemy.ts            # Enemy, EnemyType, EnemyState
│   │   ├── gimmicks.ts         # Trap, TrapType, Wall, WallType
│   │   ├── items.ts            # Item, ItemType
│   │   ├── stage.ts            # StageNumber, StageConfig, StageRewardType
│   │   ├── game-state.ts       # GameState, ScreenState, CombatState, Rating
│   │   ├── feedback.ts         # FeedbackType, FeedbackEffect, TutorialState
│   │   ├── audio.ts            # AudioSettings, SoundEffectType, BgmType
│   │   └── index.ts            # barrel export
│   ├── entities/               # エンティティ（識別子を持つドメインオブジェクト）
│   │   ├── player.ts           # プレイヤー生成・状態変更（純粋関数）
│   │   ├── enemy.ts            # 敵生成・状態変更（純粋関数）
│   │   ├── trap.ts             # 罠生成・状態変更（純粋関数）
│   │   ├── wall.ts             # 壁生成・状態変更（純粋関数）
│   │   └── item.ts             # アイテム生成（純粋関数）
│   ├── valueObjects/           # 値オブジェクト（不変、識別子なし）
│   │   └── playerClass.ts      # 職業設定（WARRIOR, THIEF）
│   ├── services/               # ドメインサービス（エンティティ横断ロジック）
│   │   ├── combatService.ts    # 戦闘判定（攻撃範囲、ダメージ計算、ノックバック方向）
│   │   ├── collisionService.ts # 衝突判定（壁、敵、アイテム、罠）
│   │   ├── movementService.ts  # 移動ロジック（方向計算、速度適用）
│   │   ├── pathfinderService.ts # 経路探索（A*アルゴリズム）
│   │   ├── mazeGenerator.ts    # 迷路生成（BSP法）
│   │   ├── progressionService.ts # レベルアップ・能力値成長
│   │   ├── goalService.ts      # ゴール判定
│   │   ├── endingService.ts    # エンディング条件・評価計算
│   │   ├── comboService.ts     # コンボカウンター管理
│   │   ├── mapService.ts       # マップ管理
│   │   └── gimmickPlacement/   # ギミック配置（既存を維持・統合）
│   ├── policies/               # ドメインポリシー（戦略パターン）
│   │   └── enemyAi/            # 敵AIポリシー（既存を拡張）
│   │       ├── types.ts
│   │       ├── policies.ts
│   │       └── EnemyAiPolicyRegistry.ts
│   ├── config/                 # ドメイン定数
│   │   ├── stageConfig.ts      # 5ステージ設定データ
│   │   └── gameBalance.ts      # 全バランス定数（マジックナンバー集約先）
│   ├── ports/                  # ポート（依存性逆転用インターフェース）
│   │   ├── IdGenerator.ts      # ID 生成器インターフェース
│   │   ├── RandomProvider.ts   # 乱数プロバイダーインターフェース
│   │   └── ClockProvider.ts    # 時計プロバイダーインターフェース
│   └── contracts/              # DbC アサーション（shared/contracts から移動）
│       └── assertions.ts
│
├── application/                # アプリケーション層（ユースケース、ドメインの組み合わせ）
│   ├── engine/
│   │   └── tickGameState.ts    # ゲームティック（オーケストレーター）
│   ├── usecases/
│   │   ├── resolvePlayerDamage.ts    # ダメージ解決
│   │   ├── resolveItemPickupEffects.ts # アイテム取得効果
│   │   ├── resolveKnockback.ts       # ノックバック処理
│   │   ├── resolveTraps.ts           # 罠トリガー処理（新規）
│   │   ├── resolveRegen.ts           # リジェネ処理（新規）
│   │   ├── resolveEnemyUpdates.ts    # 敵更新・死亡フィルタ（新規）
│   │   ├── enemySpawner.ts           # 敵スポーン
│   │   └── autoMapping.ts            # オートマッピング
│   └── services/
│       └── timerService.ts           # ゲームタイマー
│
├── infrastructure/             # インフラ層（外部依存の実装）
│   ├── browser/
│   │   └── BrowserEnvProvider.ts
│   ├── clock/
│   │   └── ClockProvider.ts    # domain/ports/ClockProvider の実装
│   ├── random/
│   │   └── RandomProvider.ts   # domain/ports/RandomProvider の実装
│   ├── storage/
│   │   ├── StorageProvider.ts
│   │   └── recordStorage.ts    # 記録管理（localStorage）
│   ├── id/
│   │   └── SequentialIdGenerator.ts # domain/ports/IdGenerator の実装
│   └── debug/
│       └── debugService.ts
│
├── presentation/               # プレゼンテーション層（React UI）
│   ├── hooks/
│   │   ├── useGameState.ts     # 統合 Facade（薄いラッパー）
│   │   ├── useGameSetup.ts     # マップ生成・初期化
│   │   ├── useScreenTransition.ts # 画面遷移
│   │   ├── useStageManagement.ts  # ステージ進行
│   │   ├── useGameAudio.ts     # BGM/SE管理
│   │   ├── useGameLoop.ts      # ゲームループ
│   │   └── useEffectDispatcher.ts # エフェクトディスパッチ
│   ├── screens/
│   │   ├── Game.tsx            # メインコンポーネント
│   │   ├── GameCanvas.tsx      # Canvas 描画
│   │   ├── GameHUD.tsx         # HUD 表示
│   │   ├── GameControls.tsx    # 入力操作
│   │   ├── GameModals.tsx      # モーダル（レベルアップ等）
│   │   ├── Title.tsx           # タイトル画面
│   │   ├── Prologue.tsx        # プロローグ画面
│   │   └── Clear.tsx           # クリア画面
│   ├── effects/                # エフェクトシステム（既存を維持）
│   │   ├── effectTypes.ts
│   │   ├── effectManager.ts
│   │   ├── particleSystem.ts
│   │   └── ...
│   ├── services/
│   │   ├── tutorialService.ts
│   │   ├── feedbackService.ts
│   │   └── viewportService.ts
│   ├── state/
│   │   └── useSyncedState.ts
│   ├── config.ts
│   └── index.ts
│
├── audio/                      # 音声モジュール（既存を維持）
│   ├── bgm.ts
│   ├── soundEffect.ts
│   ├── audioContext.ts
│   ├── audioSettings.ts
│   └── index.ts
│
├── __tests__/                  # テスト
│   ├── builders/               # テストデータビルダー（新規）
│   │   ├── playerBuilder.ts
│   │   ├── enemyBuilder.ts
│   │   ├── mapBuilder.ts
│   │   └── gameStateBuilder.ts
│   ├── fixtures/               # テストフィクスチャ（新規）
│   │   └── testMaps.ts
│   ├── helpers/                # テストヘルパー（新規）
│   │   └── scenarioHelpers.ts  # SeededRandomProvider, createTestTickContext 等
│   ├── integration/            # 統合テスト（新規）
│   │   ├── gameEngine.test.ts  # ゲームエンジン結合テスト
│   │   └── screenTransition.test.ts # 画面遷移フローテスト
│   ├── scenarios/              # 決定的シナリオテスト（新規）
│   │   └── stagePlaythrough.test.ts # シード固定ゲームプレイテスト
│   ├── mocks/                  # テスト用モック（新規）
│   │   ├── MockIdGenerator.ts
│   │   ├── MockRandomProvider.ts
│   │   └── MockClockProvider.ts
│   ├── testUtils.ts            # 共通ユーティリティ（整理）
│   └── *.test.ts               # 既存テスト（リファクタリング）
│
├── index.ts                    # barrel export
└── types.ts                    # barrel re-export（後方互換）
```

### 1.2 レイヤー間の依存ルール

```
presentation → application → domain ← infrastructure
                                ↑
                            ports（インターフェース）
```

| 依存元 | 依存先 | 許可 | 禁止 |
|--------|--------|------|------|
| domain | なし | 自層内のみ | application, infrastructure, presentation |
| application | domain | ✅ | infrastructure（直接）, presentation |
| infrastructure | domain/ports | ✅ | application, presentation |
| presentation | application, domain/types | ✅ | infrastructure（直接） |

### 1.3 依存性逆転の適用箇所

| ポート（インターフェース） | 実装 | 用途 |
|--------------------------|------|------|
| `IdGenerator` | `SequentialIdGenerator` | エンティティ ID 生成 |
| `RandomProvider` | `MathRandomProvider` | 乱数生成 |
| `ClockProvider` | `DateClockProvider` | 現在時刻取得 |
| `StorageProvider` | `LocalStorageProvider` | データ永続化 |

---

## 2. 型定義仕様

### 2.1 分割方針

**原則**: 型はそれが属するドメイン概念ごとにファイルを分ける

| ファイル | 含む型 | 行数目安 |
|---------|--------|---------|
| `world.ts` | TileType, GameMap, Position, Direction, MazeConfig, Room, Corridor, Rectangle | ~80行 |
| `player.ts` | Player, PlayerClass, ClassConfig, PlayerStats, StatType, LevelUpChoice, StageCarryOver | ~100行 |
| `enemy.ts` | Enemy, EnemyType, EnemyState | ~60行 |
| `gimmicks.ts` | Trap, TrapType, TrapState, Wall, WallType, WallState | ~80行 |
| `items.ts` | Item, ItemType | ~30行 |
| `stage.ts` | StageNumber, StageConfig, GimmickPlacementConfig, StrategicPatternLimits, StageRewardType, StageRewardHistory, StoryScene, StorySceneSlide | ~80行 |
| `game-state.ts` | GameState, ScreenState, CombatState, Rating, EpilogueText, GameRecord, BestRecords | ~80行 |
| `feedback.ts` | FeedbackType, FeedbackEffect, TutorialStep, TutorialState, TimerState, GameTimer | ~70行 |
| `audio.ts` | AudioSettings, SoundEffectType, BgmType, SoundConfig, MelodyNote, StoryImageEntry, DEFAULT_AUDIO_SETTINGS | ~90行 |

### 2.2 barrel export 仕様

```typescript
// domain/types/index.ts
export * from './world';
export * from './player';
export * from './enemy';
export * from './gimmicks';
export * from './items';
export * from './stage';
export * from './game-state';
export * from './feedback';
export * from './audio';
```

```typescript
// ipne/types.ts（後方互換）
export * from './domain/types';
```

---

## 3. エンティティ仕様

### 3.1 純粋関数の設計原則

全エンティティ操作関数は以下の原則に従う：

1. **入力のみに基づいて出力を生成する**（副作用なし）
2. **既存オブジェクトを変更しない**（イミュータブル）
3. **外部状態を参照しない**（Math.random(), Date.now() 等の直接呼び出し禁止）
4. **必要な依存はすべて引数で受け取る**

### 3.2 Player エンティティ

```typescript
// domain/entities/player.ts

// 生成（IdGenerator 不要 — プレイヤーは1体のため）
export const createPlayer = (
  playerClass: PlayerClassValue,
  startPosition: Position,
  classConfig: ClassConfig
): Player;

// 状態変更（純粋関数 — 新しいオブジェクトを返す）
export const movePlayer = (player: Player, direction: DirectionValue, map: GameMap): Player;
export const damagePlayer = (player: Player, damage: number, currentTime: number): DamageResult;
export const healPlayer = (player: Player, amount: number): Player;
export const levelUpPlayer = (player: Player, stat: StatTypeValue): Player;

// 判定（純粋関数）
export const isPlayerInvincible = (player: Player, currentTime: number): boolean;
export const canPlayerAttack = (player: Player, currentTime: number, baseCooldown: number): boolean;
export const getEffectiveMoveSpeed = (player: Player, currentTime: number): number;

// DamageResult 型（参照同等性に依存しない明示的な結果型）
export interface DamageResult {
  player: Player;
  tookDamage: boolean;
  actualDamage: number;
}
```

### 3.3 Enemy エンティティ

```typescript
// domain/entities/enemy.ts

// 生成（IdGenerator を DI）
export const createEnemy = (
  type: EnemyTypeValue,
  x: number,
  y: number,
  idGenerator: IdGenerator
): Enemy;

// ファクトリ関数は createEnemy の第一引数を固定した部分適用
// 例: createPatrolEnemy = (x, y, idGen) => createEnemy('patrol', x, y, idGen)

// 状態変更
export const damageEnemy = (enemy: Enemy, damage: number): Enemy;
export const killEnemy = (enemy: Enemy, currentTime: number): Enemy;
export const moveEnemy = (enemy: Enemy, newPosition: Position): Enemy;

// ドロップ判定（RandomProvider を DI）
export const createDropItem = (
  enemy: Enemy,
  random: RandomProvider,
  idGenerator: IdGenerator
): Item | undefined;
```

### 3.4 Trap / Wall / Item エンティティ

同様のパターンで純粋関数化。IdGenerator を DI で受け取る。

---

## 4. ドメインサービス仕様

### 4.1 combatService

```typescript
// domain/services/combatService.ts

export interface CombatContext {
  player: Player;
  enemies: Enemy[];
  map: GameMap;
  walls: Wall[];
  currentTime: number;
  clock: ClockProvider;
}

// 攻撃判定 — 攻撃範囲内の敵を検出
export const findAttackTargets = (
  player: Player,
  enemies: Enemy[],
  map: GameMap,
  walls: Wall[]
): Enemy[];

// ダメージ適用 — 対象敵にダメージを与え、結果を返す
export interface AttackResult {
  updatedEnemies: Enemy[];
  killedEnemies: Enemy[];
  knockbackEffects: KnockbackEffect[];
}

export const resolvePlayerAttack = (
  player: Player,
  enemies: Enemy[],
  map: GameMap,
  walls: Wall[],
  currentTime: number
): AttackResult;
```

### 4.2 progressionService

```typescript
// domain/services/progressionService.ts

// レベルアップ判定
export const canLevelUp = (player: Player, maxLevel: number): boolean;

// レベルアップ選択肢の生成
export const generateLevelUpChoices = (player: Player): LevelUpChoice[];

// 能力値の上限チェック
export const isStatAtMax = (player: Player, stat: StatTypeValue): boolean;
```

### 4.3 gameBalance（定数集約）

```typescript
// domain/config/gameBalance.ts

export const GAME_BALANCE = {
  combat: {
    baseCooldownMs: 500,
    knockbackDistance: 1,
    invincibleDurationMs: 1000,
    deathAnimationMs: 300,
  },
  regen: {
    baseIntervalMs: 12000,
    bonusReductionPerLevel: 1000,
    minIntervalMs: 5000,
    baseHealAmount: 1,
  },
  movement: {
    baseMoveIntervalMs: 140,
    initialMoveDelayMs: 180,
  },
  enemyAi: {
    updateIntervalMs: 200,
    chaseTimeoutMs: 3000,
    returnTimeoutMs: 1000,
    forgetPlayerMs: 5000,
  },
  combo: {
    windowMs: 3000,
    minDisplay: 2,
    maxEffectMultiplier: 1.8,
    maxEffectCombo: 10,
  },
  player: {
    warrior: { initialHp: 20, attackCooldownMs: 600 },
    thief: { initialHp: 12, attackCooldownMs: 400 },
    maxAttackRange: 3,
    maxMoveSpeed: 8,
    minAttackCooldownMs: 500,
    maxHealBonus: 5,
  },
} as const;

export type GameBalance = typeof GAME_BALANCE;
```

---

## 5. ポート仕様（依存性逆転）

### 5.1 IdGenerator

```typescript
// domain/ports/IdGenerator.ts
export interface IdGenerator {
  generateEnemyId(): string;
  generateTrapId(): string;
  generateItemId(): string;
  generateFeedbackId(): string;
}
```

```typescript
// infrastructure/id/SequentialIdGenerator.ts
export class SequentialIdGenerator implements IdGenerator {
  private counters: Record<string, number> = {};

  private next(prefix: string): string {
    this.counters[prefix] = (this.counters[prefix] ?? 0) + 1;
    return `${prefix}-${this.counters[prefix]}`;
  }

  generateEnemyId(): string { return this.next('enemy'); }
  generateTrapId(): string { return this.next('trap'); }
  generateItemId(): string { return this.next('item'); }
  generateFeedbackId(): string { return this.next('feedback'); }

  /** テスト用リセット */
  reset(): void { this.counters = {}; }
}
```

### 5.2 RandomProvider

```typescript
// domain/ports/RandomProvider.ts
export interface RandomProvider {
  /** 0以上1未満の乱数を返す */
  random(): number;
  /** min以上max未満の整数を返す */
  randomInt(min: number, max: number): number;
  /** 配列からランダムに1要素を選択 */
  pick<T>(array: readonly T[]): T;
  /** 配列をシャッフルした新しい配列を返す */
  shuffle<T>(array: readonly T[]): T[];
}
```

### 5.3 ClockProvider

```typescript
// domain/ports/ClockProvider.ts
export interface ClockProvider {
  /** 現在時刻（ms）を返す */
  now(): number;
}
```

---

## 6. Application 層仕様

### 6.1 tickGameState（オーケストレーター）

```typescript
// application/engine/tickGameState.ts

export interface TickContext {
  currentTime: number;
  deltaTime: number;
  idGenerator: IdGenerator;
  random: RandomProvider;
  clock: ClockProvider;
}

export interface TickResult {
  gameState: GameState;
  effects: GameTickEffect[];
}

// 責務: 各ユースケースを順番に呼び出すだけ
export const tickGameState = (
  state: GameState,
  context: TickContext
): TickResult => {
  // 1. resolveEnemyUpdates
  // 2. resolvePlayerDamage
  // 3. resolveItemPickupEffects
  // 4. resolveRegen
  // 5. resolveTraps
  // 6. resolveProgression（レベルアップ判定）
  // 各ステップの結果を次のステップに渡す
};
```

### 6.2 新規ユースケース

#### resolveTraps

```typescript
// application/usecases/resolveTraps.ts
export interface TrapResult {
  player: Player;
  traps: Trap[];
  effects: GameTickEffect[];
  teleportPosition?: Position;
}

export const resolveTraps = (
  player: Player,
  traps: Trap[],
  map: GameMap,
  currentTime: number,
  random: RandomProvider
): TrapResult;
```

#### resolveRegen

```typescript
// application/usecases/resolveRegen.ts
export interface RegenResult {
  player: Player;
  healed: boolean;
  healAmount: number;
}

export const resolveRegen = (
  player: Player,
  currentTime: number
): RegenResult;
```

#### resolveEnemyUpdates

```typescript
// application/usecases/resolveEnemyUpdates.ts
export interface EnemyUpdateResult {
  enemies: Enemy[];
  removedEnemies: Enemy[];
  effects: GameTickEffect[];
}

export const resolveEnemyUpdates = (
  enemies: Enemy[],
  player: Player,
  map: GameMap,
  walls: Wall[],
  currentTime: number,
  policyRegistry: EnemyAiPolicyRegistry
): EnemyUpdateResult;
```

---

## 7. Presentation 層仕様

### 7.1 useGameState の分割

#### useGameSetup

```typescript
// presentation/hooks/useGameSetup.ts
export interface GameSetupActions {
  setupGameState: (stageNumber: StageNumber, carryOver?: StageCarryOver) => void;
  resetGame: () => void;
}

export const useGameSetup = (
  idGenerator: IdGenerator,
  random: RandomProvider
): GameSetupActions;
```

#### useScreenTransition

```typescript
// presentation/hooks/useScreenTransition.ts
export interface ScreenTransitionActions {
  handleStartGame: () => void;
  handleClassSelect: (playerClass: PlayerClassValue) => void;
  handleSkipPrologue: () => void;
  handleReturnToTitle: () => void;
  handleStageRewardSelect: (reward: StageRewardType) => void;
  handleNextStage: () => void;
  // ...
}

export const useScreenTransition = (
  screen: ScreenStateValue,
  setScreen: (screen: ScreenStateValue) => void,
  gameSetup: GameSetupActions,
  audioManager: GameAudioActions
): ScreenTransitionActions;
```

#### useGameAudio

```typescript
// presentation/hooks/useGameAudio.ts
export interface GameAudioActions {
  playBgm: (bgmType: BgmTypeValue) => void;
  stopBgm: () => void;
  playSe: (seType: SoundEffectTypeValue) => void;
  updateVolume: (settings: AudioSettings) => void;
  switchBgmForScreen: (screen: ScreenStateValue, stage?: StageNumber) => void;
}

export const useGameAudio = (): GameAudioActions;
```

### 7.2 Game.tsx の分割

#### GameCanvas

```typescript
// presentation/screens/GameCanvas.tsx
interface GameCanvasProps {
  map: GameMap;
  player: Player;
  enemies: Enemy[];
  items: Item[];
  traps: Trap[];
  walls: Wall[];
  autoMapState: AutoMapState;
  effectManager: EffectManager;
  stageNumber: StageNumber;
}

export const GameCanvas: React.FC<GameCanvasProps>;
```

#### GameHUD

```typescript
// presentation/screens/GameHUD.tsx
interface GameHUDProps {
  player: Player;
  stageNumber: StageNumber;
  isMapVisible: boolean;
  onToggleMap: () => void;
  timer: GameTimer;
  comboCount: number;
}

export const GameHUD: React.FC<GameHUDProps>;
```

#### GameControls

```typescript
// presentation/screens/GameControls.tsx
interface GameControlsProps {
  onMove: (direction: DirectionValue) => void;
  onAttack: () => void;
  isMobile: boolean;
}

export const GameControls: React.FC<GameControlsProps>;
```

#### GameModals

```typescript
// presentation/screens/GameModals.tsx
interface GameModalsProps {
  isLevelUpPending: boolean;
  levelUpChoices: LevelUpChoice[];
  onLevelUpSelect: (choice: LevelUpChoice) => void;
  tutorialState: TutorialState;
  onTutorialDismiss: () => void;
  isHelpVisible: boolean;
  onHelpClose: () => void;
}

export const GameModals: React.FC<GameModalsProps>;
```

---

## 8. DbC（Design by Contract）仕様

### 8.1 アサーション関数

```typescript
// domain/contracts/assertions.ts

// 事前条件
export const require = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`Precondition violated: ${message}`);
  }
};

// 事後条件
export const ensure = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`Postcondition violated: ${message}`);
  }
};

// 不変条件
export const invariant = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`Invariant violated: ${message}`);
  }
};
```

### 8.2 適用箇所

| エンティティ/サービス | 契約 | 内容 |
|---------------------|------|------|
| Player 生成 | 事前条件 | `hp > 0`, `maxHp >= hp`, `level >= 1` |
| Player ダメージ | 事後条件 | `resultHp >= 0`, `resultHp <= maxHp` |
| Enemy 生成 | 事前条件 | `x >= 0`, `y >= 0`, `hp > 0` |
| 迷路生成 | 事後条件 | ゴールまでの経路が存在する |
| レベルアップ | 事前条件 | `canLevelUp(player, maxLevel) === true` |
| 攻撃判定 | 不変条件 | 敵 HP は 0 未満にならない |

---

## 9. テスト仕様

### 9.1 テストデータビルダー

```typescript
// __tests__/builders/playerBuilder.ts
export class PlayerBuilder {
  private data: Player;

  constructor() {
    this.data = {
      x: 1, y: 1,
      hp: 20, maxHp: 20,
      direction: Direction.DOWN,
      isInvincible: false,
      invincibleUntil: 0,
      attackCooldownUntil: 0,
      playerClass: PlayerClass.WARRIOR,
      level: 1,
      killCount: 0,
      stats: { attackPower: 1, attackRange: 1, moveSpeed: 3, attackSpeed: 1, healBonus: 0 },
      slowedUntil: 0,
      hasKey: false,
      lastRegenAt: 0,
    };
  }

  at(x: number, y: number): this { this.data.x = x; this.data.y = y; return this; }
  withHp(hp: number, maxHp?: number): this {
    this.data.hp = hp;
    if (maxHp !== undefined) this.data.maxHp = maxHp;
    return this;
  }
  withClass(cls: PlayerClassValue): this { this.data.playerClass = cls; return this; }
  withLevel(level: number): this { this.data.level = level; return this; }
  withStats(stats: Partial<PlayerStats>): this {
    this.data.stats = { ...this.data.stats, ...stats };
    return this;
  }
  invincibleUntil(time: number): this {
    this.data.isInvincible = true;
    this.data.invincibleUntil = time;
    return this;
  }
  build(): Player { return { ...this.data }; }
}

export const aPlayer = (): PlayerBuilder => new PlayerBuilder();
```

```typescript
// __tests__/builders/enemyBuilder.ts
export class EnemyBuilder {
  private data: Enemy;

  constructor() {
    this.data = {
      id: 'enemy-test-1',
      x: 5, y: 5,
      type: EnemyType.PATROL,
      hp: 3, maxHp: 3,
      damage: 1, speed: 1,
      detectionRange: 5, attackRange: 1,
      attackCooldownUntil: 0,
      state: EnemyState.IDLE,
      homePosition: { x: 5, y: 5 },
    };
  }

  withId(id: string): this { this.data.id = id; return this; }
  at(x: number, y: number): this { this.data.x = x; this.data.y = y; return this; }
  withType(type: EnemyTypeValue): this { this.data.type = type; return this; }
  withHp(hp: number): this { this.data.hp = hp; this.data.maxHp = hp; return this; }
  build(): Enemy { return { ...this.data }; }
}

export const anEnemy = (): EnemyBuilder => new EnemyBuilder();
```

```typescript
// __tests__/builders/mapBuilder.ts
export class MapBuilder {
  private width: number;
  private height: number;
  private map: GameMap;

  constructor(width = 10, height = 10) {
    this.width = width;
    this.height = height;
    // 壁で囲まれた空の部屋を生成
    this.map = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) =>
        x === 0 || x === width - 1 || y === 0 || y === height - 1
          ? TileType.WALL
          : TileType.FLOOR
      )
    );
  }

  withWall(x: number, y: number): this { this.map[y][x] = TileType.WALL; return this; }
  withGoal(x: number, y: number): this { this.map[y][x] = TileType.GOAL; return this; }
  withStart(x: number, y: number): this { this.map[y][x] = TileType.START; return this; }
  build(): GameMap { return this.map.map(row => [...row]); }
}

export const aMap = (width?: number, height?: number): MapBuilder => new MapBuilder(width, height);
```

### 9.2 テスト構造規約

```typescript
// テストの命名規約
describe('combatService', () => {
  describe('findAttackTargets', () => {
    describe('正常系', () => {
      it('攻撃範囲内の敵を検出する', () => {
        // Arrange
        const player = aPlayer().at(5, 5).withStats({ attackRange: 2 }).build();
        const enemies = [
          anEnemy().at(6, 5).build(),  // 範囲内
          anEnemy().at(10, 10).build(), // 範囲外
        ];
        const map = aMap().build();

        // Act
        const targets = findAttackTargets(player, enemies, map, []);

        // Assert
        expect(targets).toHaveLength(1);
        expect(targets[0].x).toBe(6);
      });
    });

    describe('異常系', () => {
      it('敵がいない場合は空配列を返す', () => { ... });
    });

    describe('境界値', () => {
      it('攻撃範囲ちょうどの距離の敵を検出する', () => { ... });
    });
  });
});
```

### 9.3 モック方針

| 対象 | Phase 3 前 | Phase 3 後 |
|------|-----------|-----------|
| ID 生成 | `jest.mock` + `resetCounter` | テスト用 `SequentialIdGenerator` インスタンス |
| 乱数 | `Math.random = jest.fn()` | テスト用固定値 `RandomProvider` |
| 時計 | `Date.now = jest.fn()` | テスト用固定値 `ClockProvider` |
| localStorage | `jest.spyOn(Storage.prototype)` | テスト用 `InMemoryStorageProvider` |

---

## 10. 統合テスト・シナリオテスト仕様

### 10.1 E2E テストを採用しない理由

IPNE は Canvas 2D ベースのリアルタイムゲームであり、以下の理由から E2E テスト（Playwright）は費用対効果が低い：

- **Canvas 描画**: DOM 要素がなく、画面状態の検証にテスト専用コードの追加が必要
- **ランダム生成迷路**: 毎回異なるマップで再現性のあるシナリオが書けない
- **リアルタイム戦闘**: フレーム依存でテストがフレーキーになりやすい

代わりに、Jest ベースの統合テスト・決定的シナリオテストで品質を保証する。

### 10.2 テスト分類

| 分類 | 対象 | 目的 | テスト数目標 |
|------|------|------|------------|
| ゲームエンジン統合テスト | `tickGameState` 連続呼び出し | 複数ユースケースの結合動作を検証 | 5以上 |
| 決定的シナリオテスト | シード固定ゲームプレイ | 同一入力で同一結果を保証 | 3以上 |
| 画面遷移フックテスト | `useGameState` フック | 画面遷移フローの正しさを検証 | 4以上 |

### 10.3 ゲームエンジン統合テスト

`tickGameState` を連続呼び出しし、ユースケース間の相互作用を検証する。

```typescript
// __tests__/integration/gameEngine.test.ts
describe('ゲームエンジン統合テスト', () => {
  it('敵と接触してダメージを受け、無敵時間中は追加ダメージを受けない', () => {
    // Arrange
    const state = aGameState()
      .withPlayer(aPlayer().at(5, 5).withHp(10).build())
      .withEnemy(anEnemy().at(5, 6).withDamage(3).build())
      .build();
    const context = createTestTickContext({ currentTime: 1000 });

    // Act: 1ティック目 — ダメージ発生
    const result1 = tickGameState(state, context);
    expect(result1.gameState.player.hp).toBe(7);

    // Act: 2ティック目 — 無敵時間中
    const context2 = { ...context, currentTime: 1100 };
    const result2 = tickGameState(result1.gameState, context2);
    expect(result2.gameState.player.hp).toBe(7); // 変化なし
  });

  it('敵を撃破するとドロップアイテムが生成される', () => { ... });
  it('リジェネが基本間隔経過後に発動する', () => { ... });
  it('罠を踏むと種類に応じた効果が適用される', () => { ... });
  it('レベルアップ条件を満たすとフラグが立つ', () => { ... });
});
```

### 10.4 決定的シナリオテスト

`SeededRandomProvider` で乱数を固定し、ゲームプレイ全体の決定性を保証する。

```typescript
// __tests__/scenarios/stagePlaythrough.test.ts
describe('ステージ通しプレイ', () => {
  it('ステージ1で敵を倒してレベルアップし、ゴール到達でクリアになる', () => {
    // Arrange: 固定シードでマップ・敵配置を決定的に
    const random = new SeededRandomProvider(12345);
    const idGen = new SequentialIdGenerator();
    const clock = new MockClockProvider(0);
    const setup = setupStage(1, random, idGen);

    // Act: プレイヤー操作をシミュレーション
    let state = setup.initialState;
    state = applyPlayerMove(state, Direction.RIGHT, clock);
    clock.advance(150);
    state = applyPlayerAttack(state, clock);

    // Assert
    expect(state.player.killCount).toBeGreaterThan(0);
  });

  it('ステージ間引き継ぎでプレイヤー能力値が維持される', () => { ... });
  it('固定シードで同一入力なら同一結果になる（決定性の検証）', () => { ... });
});
```

### 10.5 画面遷移フックテスト

```typescript
// __tests__/integration/screenTransition.test.ts
describe('画面遷移フロー', () => {
  it('TITLE → CLASS_SELECT → PROLOGUE → GAME の正常フロー', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.screen).toBe(ScreenState.TITLE);
    act(() => result.current.handleStartGame());
    expect(result.current.screen).toBe(ScreenState.CLASS_SELECT);
    act(() => result.current.handleClassSelect(PlayerClass.WARRIOR));
    expect(result.current.screen).toBe(ScreenState.PROLOGUE);
    act(() => result.current.handleSkipPrologue());
    expect(result.current.screen).toBe(ScreenState.GAME);
  });

  it('GAME → DYING → GAME_OVER → TITLE の死亡フロー', () => { ... });
  it('STAGE_CLEAR → STAGE_REWARD → STAGE_STORY → GAME のステージ進行', () => { ... });
  it('FINAL_CLEAR 後にタイトルに戻れる', () => { ... });
});
```

### 10.6 テストヘルパー仕様

```typescript
// __tests__/helpers/scenarioHelpers.ts

/** 固定シード乱数プロバイダー（xorshift ベース） */
export class SeededRandomProvider implements RandomProvider {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  random(): number { /* xorshift で決定的な値を返す */ }
  randomInt(min: number, max: number): number { ... }
  pick<T>(array: readonly T[]): T { ... }
  shuffle<T>(array: readonly T[]): T[] { ... }
}

/** テスト用 TickContext 生成（デフォルト値付き） */
export const createTestTickContext = (overrides?: Partial<TickContext>): TickContext => ({
  currentTime: 0,
  deltaTime: 16,
  idGenerator: new SequentialIdGenerator(),
  random: new SeededRandomProvider(42),
  clock: new MockClockProvider(0),
  ...overrides,
});

/** プレイヤー移動のシミュレーション */
export const applyPlayerMove = (
  state: GameState,
  direction: DirectionValue,
  clock: ClockProvider
): GameState;

/** プレイヤー攻撃のシミュレーション */
export const applyPlayerAttack = (
  state: GameState,
  clock: ClockProvider
): GameState;

/** ステージ初期化（固定シード対応） */
export const setupStage = (
  stageNumber: StageNumber,
  random: RandomProvider,
  idGenerator: IdGenerator
): { initialState: GameState; map: GameMap };
```

---

## 11. 非機能要件

### 11.1 パフォーマンス

- コンポーネント分割時に `React.memo` を適用し、不要な再レンダリングを防止
- `useCallback` / `useMemo` の適切な使用
- 分割後もゲームループの FPS を 60fps 以上に維持

### 11.2 後方互換性

- `types.ts` は barrel re-export として維持し、既存 import パスを壊さない
- `index.ts` の public API を維持
- 段階的に移行し、deprecated な re-export は最終 Phase で削除

### 11.3 コードメトリクス目標

| メトリクス | 現状 | 目標 |
|-----------|------|------|
| ファイルあたり最大行数 | 1531行 | 300行以内 |
| 関数あたり最大行数 | 77行 | 30行以内 |
| 関数あたり最大パラメータ数 | 8+ | 3以内（オブジェクトでまとめる） |
| 循環的複雑度 | 不明 | 10以内 |
| テストカバレッジ（domain） | 推定50% | 85%以上 |
| テストカバレッジ（application） | 推定40% | 85%以上 |

---

## 12. Phase 間レビュー残課題

各 Phase のレビューで発見され、後続 Phase で対応すべき課題を記録する。

### 12.1 Phase 3 → Phase 4 への引き継ぎ

| ID | 重要度 | 内容 | 対応先タスク |
|-----|--------|------|------------|
| R3-1 | Medium | `resolvePlayerDamage` の戻り値に `actualDamage` が含まれない。`DamageResult.actualDamage` を呼び出し元に伝播させ、フィードバック表示（ダメージ数値）に使えるようにする | P4-4b-1 |
| R3-2 | Medium | 後方互換シングルトン `MATH_RANDOM_PROVIDER` / `SYSTEM_CLOCK_PROVIDER` が残存。`recordStorage.ts` を ClockProvider DI に変更後、不要なシングルトンを削除する | P4-4b-2 |
