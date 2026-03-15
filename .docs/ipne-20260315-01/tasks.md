# IPNE 大規模リファクタリング — タスクチェックリスト

## Phase 1: 型定義の分割とドメインモデルの整理

### P1-1: 型ファイルの作成と分割

- [x] **P1-1-1**: `domain/types/world.ts` を作成
  - TileType, TileTypeValue, GameMap, Position, Direction, DirectionValue
  - MazeConfig, Rectangle, Room, Corridor
  - ExplorationState, ExplorationStateValue, AutoMapState（マップ関連のため追加）
- [x] **P1-1-2**: `domain/types/player.ts` を作成
  - Player, PlayerClass, PlayerClassValue, ClassConfig, VisibilityType
  - PlayerStats, StatType, StatTypeValue, LevelUpChoice
  - ※ StageCarryOver は stage.ts に配置（ステージ間引き継ぎのため）
- [x] **P1-1-3**: `domain/types/enemy.ts` を作成
  - Enemy, EnemyType, EnemyTypeValue, EnemyState, EnemyStateValue
- [x] **P1-1-4**: `domain/types/gimmicks.ts` を作成
  - Trap, TrapType, TrapTypeValue, TrapState, TrapStateValue
  - Wall, WallType, WallTypeValue, WallState, WallStateValue
- [x] **P1-1-5**: `domain/types/items.ts` を作成
  - Item, ItemType, ItemTypeValue
- [x] **P1-1-6**: `domain/types/stage.ts` を作成
  - StageNumber, StageConfig, GimmickPlacementConfig, StrategicPatternLimits
  - StageRewardType, StageRewardHistory, StageCarryOver, StoryScene, StorySceneSlide
- [x] **P1-1-7**: `domain/types/game-state.ts` を作成
  - GameState, ScreenState, ScreenStateValue, CombatState
  - Rating, RatingValue, EpilogueText, GameRecord, BestRecords
- [x] **P1-1-8**: `domain/types/feedback.ts` を作成
  - FeedbackType, FeedbackTypeValue, FeedbackEffect
  - TutorialStepType, TutorialStepTypeValue, TutorialStep, TutorialState
  - TimerState, TimerStateValue, GameTimer
- [x] **P1-1-9**: `domain/types/audio.ts` を作成
  - AudioSettings, DEFAULT_AUDIO_SETTINGS
  - SoundEffectType, SoundEffectTypeValue, BgmType, BgmTypeValue
  - SoundConfig, MelodyNote, StoryImageEntry

### P1-2: barrel export の設定

- [x] **P1-2-1**: `domain/types/index.ts` を作成（全型ファイルの re-export）
- [x] **P1-2-2**: 既存 `types.ts` を barrel re-export に変更（`export * from './domain/types'`）

### P1-3: import パスの更新

- [x] **P1-3-1**: 全ソースファイルの import パスを確認（既存 `types.ts` 経由で動作するか検証）
- [x] **P1-3-2**: TypeScript コンパイルが通ることを確認（`npm run typecheck`）
- [x] **P1-3-3**: 全テストが通ることを確認（`npm test`）— 341スイート / 4424テスト全パス

---

## Phase 2: ドメイン層への集約

### P2-1: ディレクトリ構造の作成

- [ ] **P2-1-1**: `domain/entities/` ディレクトリを作成
- [ ] **P2-1-2**: `domain/valueObjects/` ディレクトリを作成
- [ ] **P2-1-3**: `domain/config/` ディレクトリを作成
- [ ] **P2-1-4**: `domain/ports/` ディレクトリを作成
- [ ] **P2-1-5**: `domain/contracts/` ディレクトリを作成
- [ ] **P2-1-6**: `application/services/` ディレクトリを作成
- [ ] **P2-1-7**: `presentation/services/` ディレクトリを作成
- [ ] **P2-1-8**: `infrastructure/id/` ディレクトリを作成
- [ ] **P2-1-9**: `infrastructure/debug/` ディレクトリを作成

### P2-2: エンティティの移動

- [ ] **P2-2-1**: `player.ts` → `domain/entities/player.ts` に移動
- [ ] **P2-2-2**: `enemy.ts` → `domain/entities/enemy.ts` に移動
- [ ] **P2-2-3**: `item.ts` → `domain/entities/item.ts` に移動
- [ ] **P2-2-4**: `trap.ts` → `domain/entities/trap.ts` に移動
- [ ] **P2-2-5**: `wall.ts` → `domain/entities/wall.ts` に移動
- [ ] **P2-2-6**: 各移動ファイルの import パスを更新
- [ ] **P2-2-7**: テストファイルの import パスを更新
- [ ] **P2-2-8**: 全テストが通ることを確認

### P2-3: ドメインサービスの移動

- [ ] **P2-3-1**: `combat.ts` → `domain/services/combatService.ts` に移動
- [ ] **P2-3-2**: `collision.ts` → `domain/services/collisionService.ts` に移動
- [ ] **P2-3-3**: `movement.ts` → `domain/services/movementService.ts` に移動
- [ ] **P2-3-4**: `pathfinder.ts` → `domain/services/pathfinderService.ts` に移動
- [ ] **P2-3-5**: `mazeGenerator.ts` → `domain/services/mazeGenerator.ts` に移動
- [ ] **P2-3-6**: `progression.ts` → `domain/services/progressionService.ts` に移動
- [ ] **P2-3-7**: `goal.ts` → `domain/services/goalService.ts` に移動
- [ ] **P2-3-8**: `ending.ts` → `domain/services/endingService.ts` に移動
- [ ] **P2-3-9**: `combo.ts` → `domain/services/comboService.ts` に移動
- [ ] **P2-3-10**: `map.ts` → `domain/services/mapService.ts` に移動
- [ ] **P2-3-11**: `gimmickPlacement.ts` → 既存 `domain/services/gimmickPlacement/` に統合
- [ ] **P2-3-12**: 各移動ファイルの import パスを更新
- [ ] **P2-3-13**: テストファイルの import パスを更新
- [ ] **P2-3-14**: 全テストが通ることを確認

### P2-4: 値オブジェクト・設定の移動

- [ ] **P2-4-1**: `class.ts` → `domain/valueObjects/playerClass.ts` に移動
- [ ] **P2-4-2**: `stageConfig.ts` → `domain/config/stageConfig.ts` に移動
- [ ] **P2-4-3**: import パスを更新
- [ ] **P2-4-4**: 全テストが通ることを確認

### P2-5: アプリケーション層の移動

- [ ] **P2-5-1**: `enemySpawner.ts` → `application/usecases/enemySpawner.ts` に移動
- [ ] **P2-5-2**: `autoMapping.ts` → `application/usecases/autoMapping.ts` に移動
- [ ] **P2-5-3**: `timer.ts` → `application/services/timerService.ts` に移動
- [ ] **P2-5-4**: import パスを更新
- [ ] **P2-5-5**: 全テストが通ることを確認

### P2-6: プレゼンテーション層の移動

- [ ] **P2-6-1**: `tutorial.ts` → `presentation/services/tutorialService.ts` に移動
- [ ] **P2-6-2**: `feedback.ts` → `presentation/services/feedbackService.ts` に移動
- [ ] **P2-6-3**: `viewport.ts` → `presentation/services/viewportService.ts` に移動
- [ ] **P2-6-4**: import パスを更新
- [ ] **P2-6-5**: 全テストが通ることを確認

### P2-7: インフラ層の移動

- [ ] **P2-7-1**: `record.ts` → `infrastructure/storage/recordStorage.ts` に移動
- [ ] **P2-7-2**: `debug.ts` → `infrastructure/debug/debugService.ts` に移動
- [ ] **P2-7-3**: `shared/contracts/` → `domain/contracts/` に移動
- [ ] **P2-7-4**: import パスを更新
- [ ] **P2-7-5**: 全テストが通ることを確認

### P2-8: バックワード互換の確認

- [ ] **P2-8-1**: ルート `index.ts` の barrel export を更新
- [ ] **P2-8-2**: `enemyAI.ts` のレイヤー割り当てを判断（domain/policies に統合予定）
- [ ] **P2-8-3**: ルート直下が `index.ts`, `types.ts`, `enemyAI.ts`（Phase 5 で削除予定）のみであることを確認
- [ ] **P2-8-4**: `npm run typecheck` が通ることを確認
- [ ] **P2-8-5**: `npm run lint` が通ることを確認
- [ ] **P2-8-6**: `npm test` が通ることを確認
- [ ] **P2-8-7**: `npm run build` が通ることを確認

---

## Phase 3: 副作用の除去と依存性注入

### P3-1: ポートインターフェースの定義

- [ ] **P3-1-1**: `domain/ports/IdGenerator.ts` を作成
- [ ] **P3-1-2**: `domain/ports/RandomProvider.ts` を作成
- [ ] **P3-1-3**: `domain/ports/ClockProvider.ts` を作成
- [ ] **P3-1-4**: `domain/ports/index.ts` を作成（barrel export）

### P3-2: インフラ実装の作成

- [ ] **P3-2-1**: `infrastructure/id/SequentialIdGenerator.ts` を作成
- [ ] **P3-2-2**: 既存 `infrastructure/random/RandomProvider.ts` を port 実装に更新
- [ ] **P3-2-3**: 既存 `infrastructure/clock/ClockProvider.ts` を port 実装に更新
- [ ] **P3-2-4**: テスト用 `__tests__/mocks/MockIdGenerator.ts` を作成
- [ ] **P3-2-5**: テスト用 `__tests__/mocks/MockRandomProvider.ts` を作成
- [ ] **P3-2-6**: テスト用 `__tests__/mocks/MockClockProvider.ts` を作成

### P3-3: グローバル ID カウンタの除去

- [ ] **P3-3-1**: `domain/entities/enemy.ts` から `enemyIdCounter` を削除、`createEnemy` に `IdGenerator` 引数を追加
- [ ] **P3-3-2**: `domain/entities/trap.ts` から `trapIdCounter` を削除、`createTrap` に `IdGenerator` 引数を追加
- [ ] **P3-3-3**: `domain/entities/item.ts` から `itemIdCounter` を削除、`createItem` に `IdGenerator` 引数を追加
- [ ] **P3-3-4**: `presentation/services/feedbackService.ts` から `feedbackIdCounter` を削除（存在する場合）
- [ ] **P3-3-5**: 全呼び出し箇所を更新（IdGenerator を渡すように）
- [ ] **P3-3-6**: `testUtils.ts` の `resetEnemyIdCounter()` 等を削除
- [ ] **P3-3-7**: テストを更新（MockIdGenerator を使用）
- [ ] **P3-3-8**: 全テストが通ることを確認

### P3-4: Math.random() の直接呼び出し除去

- [ ] **P3-4-1**: `domain/entities/enemy.ts` の `createDropItem()` から `Math.random()` デフォルト引数を削除
- [ ] **P3-4-2**: その他 `Math.random()` 直接呼び出し箇所を検索・修正
- [ ] **P3-4-3**: 全呼び出し箇所で `RandomProvider` を使用するように更新
- [ ] **P3-4-4**: テストを更新（MockRandomProvider を使用）
- [ ] **P3-4-5**: 全テストが通ることを確認

### P3-5: DamageResult 型の導入

- [ ] **P3-5-1**: `domain/entities/player.ts` に `DamageResult` 型を定義
- [ ] **P3-5-2**: `damagePlayer()` の戻り値を `DamageResult` に変更
- [ ] **P3-5-3**: `application/usecases/resolvePlayerDamage.ts` を更新（参照同等性チェックを削除）
- [ ] **P3-5-4**: 全呼び出し箇所を更新
- [ ] **P3-5-5**: テストを更新
- [ ] **P3-5-6**: 全テストが通ることを確認

### P3-6: Phase 3 完了確認

- [ ] **P3-6-1**: グローバル可変状態が0であることを確認（`let .*Counter` の検索）
- [ ] **P3-6-2**: `Math.random()` 直接呼び出しが0であることを確認（テスト以外）
- [ ] **P3-6-3**: `npm run typecheck` が通ることを確認
- [ ] **P3-6-4**: `npm test` が通ることを確認

---

## Phase 4: 責務分離（SRP の適用）

### P4-1: useGameState.ts の分割

- [ ] **P4-1-1**: `presentation/hooks/useGameSetup.ts` を抽出
  - `setupGameState()` とその関連ロジック
  - マップ生成・プレイヤー初期化・敵スポーン・ギミック配置
- [ ] **P4-1-2**: `presentation/hooks/useScreenTransition.ts` を抽出
  - 11個の画面遷移ハンドラー
- [ ] **P4-1-3**: `presentation/hooks/useStageManagement.ts` を抽出
  - ステージ進行・報酬・引き継ぎロジック
- [ ] **P4-1-4**: `presentation/hooks/useGameAudio.ts` を抽出
  - BGM/SE 管理・画面ごとの切り替え
- [ ] **P4-1-5**: `useGameState.ts` を Facade フックに変更（上記フックを統合）
- [ ] **P4-1-6**: useGameState の返り値の型を整理（80+ → 小さい型に分割）
- [ ] **P4-1-7**: 全テストが通ることを確認

### P4-2: Game.tsx の分割

- [ ] **P4-2-1**: `presentation/screens/GameCanvas.tsx` を抽出
  - Canvas 描画ロジック
  - `React.memo` を適用
- [ ] **P4-2-2**: `presentation/screens/GameHUD.tsx` を抽出
  - HP バー、レベル表示、マップ切替ボタン、タイマー
- [ ] **P4-2-3**: `presentation/screens/GameControls.tsx` を抽出
  - モバイル十字キー、キーボード入力処理
- [ ] **P4-2-4**: `presentation/screens/GameModals.tsx` を抽出
  - レベルアップ選択 UI、チュートリアル、ヘルプオーバーレイ
- [ ] **P4-2-5**: `Game.tsx` をメインコンポーネントに整理（上記を統合）
- [ ] **P4-2-6**: パフォーマンス検証（FPS 60fps 以上を維持）
- [ ] **P4-2-7**: 全テストが通ることを確認

### P4-3: tickGameState.ts の分割

- [ ] **P4-3-1**: `application/usecases/resolveTraps.ts` を抽出
  - 罠トリガー処理（tickGameState 213-243行相当）
- [ ] **P4-3-2**: `application/usecases/resolveRegen.ts` を抽出
  - リジェネ処理（tickGameState 196-210行相当）
- [ ] **P4-3-3**: `application/usecases/resolveEnemyUpdates.ts` を抽出
  - 敵更新・死亡フィルタ（tickGameState 120-128行相当）
- [ ] **P4-3-4**: `tickGameState.ts` をオーケストレーターに整理
  - 各ユースケースを順番に呼び出すだけの薄いレイヤー
- [ ] **P4-3-5**: 全テストが通ることを確認

### P4-4: useGameLoop.ts の責務分離

- [ ] **P4-4-1**: `presentation/hooks/useEffectDispatcher.ts` を抽出
  - エフェクトディスパッチロジック（useGameLoop 101-200行相当）
- [ ] **P4-4-2**: `useGameLoop.ts` を整理
- [ ] **P4-4-3**: 全テストが通ることを確認

### P4-5: Phase 4 完了確認

- [ ] **P4-5-1**: 各ファイルが200行以内であることを確認
- [ ] **P4-5-2**: `npm run typecheck` が通ることを確認
- [ ] **P4-5-3**: `npm run lint` が通ることを確認
- [ ] **P4-5-4**: `npm test` が通ることを確認
- [ ] **P4-5-5**: `npm run build` が通ることを確認

---

## Phase 5: DRY 原則の適用とデザインパターン導入

### P5-1: マジックナンバーの集約

- [ ] **P5-1-1**: `domain/config/gameBalance.ts` を作成
  - combat: baseCooldownMs, knockbackDistance, invincibleDurationMs, deathAnimationMs
  - regen: baseIntervalMs, bonusReductionPerLevel, minIntervalMs, baseHealAmount
  - movement: baseMoveIntervalMs, initialMoveDelayMs
  - enemyAi: updateIntervalMs, chaseTimeoutMs, returnTimeoutMs, forgetPlayerMs
  - combo: windowMs, minDisplay, maxEffectMultiplier, maxEffectCombo
  - player: warrior/thief 初期値, 能力上限
- [ ] **P5-1-2**: `domain/services/combatService.ts` のマジックナンバーを定数参照に置換
- [ ] **P5-1-3**: `domain/entities/player.ts` のマジックナンバーを定数参照に置換
- [ ] **P5-1-4**: `application/engine/tickGameState.ts` のマジックナンバーを定数参照に置換
- [ ] **P5-1-5**: `domain/services/movementService.ts` のマジックナンバーを定数参照に置換
- [ ] **P5-1-6**: その他のマジックナンバーを検索・置換
- [ ] **P5-1-7**: 全テストが通ることを確認

### P5-2: 敵AI の Strategy パターン統一

- [ ] **P5-2-1**: `enemyAI.ts` の `updatePatrolEnemy()` を Policy に統合
- [ ] **P5-2-2**: `enemyAI.ts` の `updateChargeEnemy()` を Policy に統合
- [ ] **P5-2-3**: `enemyAI.ts` の `updateRangedEnemy()` を Policy に統合
- [ ] **P5-2-4**: `enemyAI.ts` の個別関数を削除
- [ ] **P5-2-5**: `enemyAI.ts` を `domain/policies/enemyAi/` に統合・削除
- [ ] **P5-2-6**: 全呼び出し箇所を更新
- [ ] **P5-2-7**: 全テストが通ることを確認

### P5-3: Factory パターンの統一

- [ ] **P5-3-1**: `domain/entities/enemy.ts` の Factory メソッドを整理
  - `createEnemy(type, x, y, idGen)` を統一エントリポイントに
  - `createPatrolEnemy` 等を `createEnemy(EnemyType.PATROL, ...)` の部分適用に
- [ ] **P5-3-2**: `domain/entities/trap.ts` の Factory メソッドを同様に整理
- [ ] **P5-3-3**: `domain/entities/wall.ts` の Factory メソッドを同様に整理
- [ ] **P5-3-4**: 全テストが通ることを確認

### P5-4: DbC の強化

- [ ] **P5-4-1**: `domain/contracts/assertions.ts` に `require`, `ensure`, `invariant` を定義
- [ ] **P5-4-2**: Player 生成に事前条件を追加（hp > 0, maxHp >= hp, level >= 1）
- [ ] **P5-4-3**: Enemy 生成に事前条件を追加（x >= 0, y >= 0, hp > 0）
- [ ] **P5-4-4**: damagePlayer に事後条件を追加（resultHp >= 0）
- [ ] **P5-4-5**: 迷路生成に事後条件を追加（ゴール到達可能性）
- [ ] **P5-4-6**: levelUpPlayer に事前条件を追加（canLevelUp チェック）
- [ ] **P5-4-7**: 全テストが通ることを確認

### P5-5: Phase 5 完了確認

- [ ] **P5-5-1**: ルート直下に `index.ts`, `types.ts` のみ残っていることを確認
- [ ] **P5-5-2**: マジックナンバーが `gameBalance.ts` に集約されていることを確認
- [ ] **P5-5-3**: `npm run typecheck` が通ることを確認
- [ ] **P5-5-4**: `npm run lint` が通ることを確認
- [ ] **P5-5-5**: `npm test` が通ることを確認
- [ ] **P5-5-6**: `npm run build` が通ることを確認

---

## Phase 6: テストのリファクタリング

### P6-1: テストデータビルダーの作成

- [ ] **P6-1-1**: `__tests__/builders/playerBuilder.ts` を作成
- [ ] **P6-1-2**: `__tests__/builders/enemyBuilder.ts` を作成
- [ ] **P6-1-3**: `__tests__/builders/mapBuilder.ts` を作成
- [ ] **P6-1-4**: `__tests__/builders/gameStateBuilder.ts` を作成
- [ ] **P6-1-5**: `__tests__/builders/index.ts` を作成（barrel export）

### P6-2: テストフィクスチャの整理

- [ ] **P6-2-1**: `__tests__/fixtures/testMaps.ts` を作成
  - 各テストで共通に使うマップパターンを定義
- [ ] **P6-2-2**: `__tests__/testUtils.ts` を整理
  - グローバル状態リセット関数を削除（Phase 3 で不要化済み）
  - ビルダーへの移行

### P6-3: 既存テストのリファクタリング

- [ ] **P6-3-1**: `__tests__/player.test.ts` をビルダー使用に更新
- [ ] **P6-3-2**: `__tests__/enemy.test.ts` をビルダー使用に更新
- [ ] **P6-3-3**: `__tests__/combat.test.ts` をビルダー使用に更新
- [ ] **P6-3-4**: `__tests__/collision.test.ts` をビルダー使用に更新
- [ ] **P6-3-5**: `__tests__/item.test.ts` をビルダー使用に更新
- [ ] **P6-3-6**: `__tests__/trap.test.ts` をビルダー使用に更新
- [ ] **P6-3-7**: `__tests__/wall.test.ts` をビルダー使用に更新
- [ ] **P6-3-8**: `__tests__/map.test.ts` をビルダー使用に更新
- [ ] **P6-3-9**: `__tests__/progression.test.ts` をビルダー使用に更新
- [ ] **P6-3-10**: `__tests__/goal.test.ts` をビルダー使用に更新
- [ ] **P6-3-11**: `__tests__/ending.test.ts` をビルダー使用に更新
- [ ] **P6-3-12**: その他のテストファイルをビルダー使用に更新
- [ ] **P6-3-13**: AAA パターンの統一を確認
- [ ] **P6-3-14**: テスト名の日本語記述を統一

### P6-4: テストカバレッジの向上

- [ ] **P6-4-1**: `domain/entities/` のテストカバレッジを 90% 以上に
- [ ] **P6-4-2**: `domain/services/` のテストカバレッジを 85% 以上に
- [ ] **P6-4-3**: `application/usecases/` のテストカバレッジを 85% 以上に
- [ ] **P6-4-4**: `application/engine/` のテストカバレッジを 80% 以上に
- [ ] **P6-4-5**: 新規追加分のテスト（resolveTraps, resolveRegen, resolveEnemyUpdates 等）
- [ ] **P6-4-6**: テストカバレッジレポートを出力して確認（`npm run test:coverage`）

### P6-5: Phase 6 完了確認

- [ ] **P6-5-1**: 全テストが通ることを確認
- [ ] **P6-5-2**: カバレッジ目標を達成していることを確認
- [ ] **P6-5-3**: テストの実行時間が許容範囲内であることを確認

---

## Phase 7: 統合テスト・シナリオテストの導入

### P7-1: テストヘルパーの作成

- [ ] **P7-1-1**: `__tests__/helpers/scenarioHelpers.ts` を作成
  - `SeededRandomProvider` — xorshift ベースの固定シード乱数プロバイダー
  - `createTestTickContext()` — テスト用 TickContext 生成（デフォルト値付き）
  - `applyPlayerMove()` — プレイヤー移動シミュレーション
  - `applyPlayerAttack()` — プレイヤー攻撃シミュレーション
  - `setupStage()` — ステージ初期化（固定シード対応）
- [ ] **P7-1-2**: `__tests__/builders/gameStateBuilder.ts` を拡張
  - `withPlayer()`, `withEnemy()`, `withEnemies()`, `withItems()`, `withTraps()` メソッド追加
  - ゲームエンジン統合テストで使いやすい形に

### P7-2: ゲームエンジン統合テストの実装

- [ ] **P7-2-1**: `__tests__/integration/gameEngine.test.ts` を作成
- [ ] **P7-2-2**: 「敵と接触してダメージを受け、無敵時間中は追加ダメージを受けない」テスト
- [ ] **P7-2-3**: 「敵を撃破するとドロップアイテムが生成される」テスト
- [ ] **P7-2-4**: 「リジェネが基本間隔経過後に発動する」テスト
- [ ] **P7-2-5**: 「罠を踏むと種類に応じた効果が適用される」テスト
- [ ] **P7-2-6**: 「レベルアップ条件を満たすとフラグが立つ」テスト

### P7-3: 決定的シナリオテストの実装

- [ ] **P7-3-1**: `__tests__/scenarios/stagePlaythrough.test.ts` を作成
- [ ] **P7-3-2**: 「ステージ1で敵を倒してレベルアップし、ゴール到達でクリアになる」テスト
- [ ] **P7-3-3**: 「ステージ間引き継ぎでプレイヤー能力値が維持される」テスト
- [ ] **P7-3-4**: 「固定シードで同一入力なら同一結果になる（決定性の検証）」テスト

### P7-4: 画面遷移フックテストの実装

- [ ] **P7-4-1**: `__tests__/integration/screenTransition.test.ts` を作成
- [ ] **P7-4-2**: 「TITLE → CLASS_SELECT → PROLOGUE → GAME の正常フロー」テスト
- [ ] **P7-4-3**: 「GAME → DYING → GAME_OVER → TITLE の死亡フロー」テスト
- [ ] **P7-4-4**: 「STAGE_CLEAR → STAGE_REWARD → STAGE_STORY → GAME のステージ進行」テスト
- [ ] **P7-4-5**: 「FINAL_CLEAR 後にタイトルに戻れる」テスト

### P7-5: Phase 7 完了確認

- [ ] **P7-5-1**: 統合テストが 5 シナリオ以上実装されていることを確認
- [ ] **P7-5-2**: 決定的シナリオテストが 3 シナリオ以上実装されていることを確認
- [ ] **P7-5-3**: 画面遷移テストが 4 シナリオ以上実装されていることを確認
- [ ] **P7-5-4**: 全テストが安定して通ることを確認（5回連続実行）
- [ ] **P7-5-5**: `npm test` で全テスト（単体＋統合＋シナリオ）が通ることを確認

---

## 最終確認

### F-1: 全体検証

- [ ] **F-1-1**: `npm run lint:ci` が通ることを確認
- [ ] **F-1-2**: `npm run typecheck` が通ることを確認
- [ ] **F-1-3**: `npm test` が通ることを確認
- [ ] **F-1-4**: `npm run build` が通ることを確認
- [ ] **F-1-5**: 統合テスト・シナリオテストが全て通ることを確認
- [ ] **F-1-6**: ゲームが正常に動作することを手動で確認

### F-2: コードメトリクス確認

- [ ] **F-2-1**: ルート直下のドメインファイルが 0 であることを確認
- [ ] **F-2-2**: 全ファイルが 300 行以内であることを確認
- [ ] **F-2-3**: グローバル可変状態が 0 であることを確認
- [ ] **F-2-4**: テストカバレッジが目標値に達していることを確認

### F-3: ドキュメント更新

- [ ] **F-3-1**: `README.md` のファイル構成を更新
- [ ] **F-3-2**: `types.ts` の分割について記載を追加

---

## タスク統計

| Phase | タスク数 | 推定作業量 |
|-------|---------|-----------|
| Phase 1: 型定義の分割 | 13 | 小 |
| Phase 2: レイヤー移動 | 39 | 大 |
| Phase 3: 副作用除去・DI | 22 | 中 |
| Phase 4: 責務分離 | 19 | 大 |
| Phase 5: DRY・パターン | 23 | 中 |
| Phase 6: テスト改善 | 21 | 中 |
| Phase 7: 統合・シナリオテスト | 18 | 中 |
| 最終確認 | 11 | 小 |
| **合計** | **166** | — |
