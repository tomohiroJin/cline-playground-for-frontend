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

- [x] **P2-1-1**: `domain/entities/` ディレクトリを作成
- [x] **P2-1-2**: `domain/valueObjects/` ディレクトリを作成
- [x] **P2-1-3**: `domain/config/` ディレクトリを作成
- [x] **P2-1-4**: `domain/ports/` ディレクトリを作成
- [x] **P2-1-5**: `domain/contracts/` ディレクトリを作成
- [x] **P2-1-6**: `application/services/` ディレクトリを作成
- [x] **P2-1-7**: `presentation/services/` ディレクトリを作成
- [x] **P2-1-8**: `infrastructure/id/` ディレクトリを作成
- [x] **P2-1-9**: `infrastructure/debug/` ディレクトリを作成

### P2-2: エンティティの移動

- [x] **P2-2-1**: `player.ts` → `domain/entities/player.ts` に移動
- [x] **P2-2-2**: `enemy.ts` → `domain/entities/enemy.ts` に移動
- [x] **P2-2-3**: `item.ts` → `domain/entities/item.ts` に移動
- [x] **P2-2-4**: `trap.ts` → `domain/entities/trap.ts` に移動
- [x] **P2-2-5**: `wall.ts` → `domain/entities/wall.ts` に移動
- [x] **P2-2-6**: 各移動ファイルの import パスを更新
- [x] **P2-2-7**: テストファイルの import パスを更新
- [x] **P2-2-8**: 全テストが通ることを確認 — 341スイート / 4424テスト全パス

### P2-3: ドメインサービスの移動

- [x] **P2-3-1**: `combat.ts` → `domain/services/combatService.ts` に移動
- [x] **P2-3-2**: `collision.ts` → `domain/services/collisionService.ts` に移動
- [x] **P2-3-3**: `movement.ts` → `domain/services/movementService.ts` に移動
- [x] **P2-3-4**: `pathfinder.ts` → `domain/services/pathfinderService.ts` に移動
- [x] **P2-3-5**: `mazeGenerator.ts` → `domain/services/mazeGenerator.ts` に移動
- [x] **P2-3-6**: `progression.ts` → `domain/services/progressionService.ts` に移動
- [x] **P2-3-7**: `goal.ts` → `domain/services/goalService.ts` に移動
- [x] **P2-3-8**: `ending.ts` → `domain/services/endingService.ts` に移動
- [x] **P2-3-9**: `combo.ts` → `domain/services/comboService.ts` に移動
- [x] **P2-3-10**: `map.ts` → `domain/services/mapService.ts` に移動
- [x] **P2-3-11**: `gimmickPlacement.ts` → 既存 `domain/services/gimmickPlacement/` に統合
- [x] **P2-3-12**: 各移動ファイルの import パスを更新
- [x] **P2-3-13**: テストファイルの import パスを更新
- [x] **P2-3-14**: 全テストが通ることを確認 — 341スイート / 4424テスト全パス
- [x] **P2-3-15**: (追加) `story.ts` → `domain/config/story.ts` に移動
- [x] **P2-3-16**: (追加) `storyImages.ts` → `presentation/services/storyImages.ts` に移動

### P2-4: 値オブジェクト・設定の移動

- [x] **P2-4-1**: `class.ts` → `domain/valueObjects/playerClass.ts` に移動
- [x] **P2-4-2**: `stageConfig.ts` → `domain/config/stageConfig.ts` に移動
- [x] **P2-4-3**: import パスを更新
- [x] **P2-4-4**: 全テストが通ることを確認 — 341スイート / 4424テスト全パス

### P2-5: アプリケーション層の移動

- [x] **P2-5-1**: `enemySpawner.ts` → `application/usecases/enemySpawner.ts` に移動
- [x] **P2-5-2**: `autoMapping.ts` → `application/usecases/autoMapping.ts` に移動
- [x] **P2-5-3**: `timer.ts` → `application/services/timerService.ts` に移動
- [x] **P2-5-4**: import パスを更新
- [x] **P2-5-5**: 全テストが通ることを確認 — 341スイート / 4424テスト全パス

### P2-6: プレゼンテーション層の移動

- [x] **P2-6-1**: `tutorial.ts` → `presentation/services/tutorialService.ts` に移動
- [x] **P2-6-2**: `feedback.ts` → `presentation/services/feedbackService.ts` に移動
- [x] **P2-6-3**: `viewport.ts` → `presentation/services/viewportService.ts` に移動
- [x] **P2-6-4**: import パスを更新
- [x] **P2-6-5**: 全テストが通ることを確認 — 341スイート / 4424テスト全パス

### P2-7: インフラ層の移動

- [x] **P2-7-1**: `record.ts` → `infrastructure/storage/recordStorage.ts` に移動
- [x] **P2-7-2**: `debug.ts` → `infrastructure/debug/debugService.ts` に移動
- [x] **P2-7-3**: `shared/contracts/` → `domain/contracts/` に移動
- [x] **P2-7-4**: import パスを更新
- [x] **P2-7-5**: 全テストが通ることを確認 — 341スイート / 4424テスト全パス

### P2-8: バックワード互換の確認

- [x] **P2-8-1**: ルート `index.ts` の barrel export を更新
- [x] **P2-8-2**: `enemyAI.ts` のレイヤー割り当てを判断（domain/policies に統合予定 — Phase 5 で対応）
- [x] **P2-8-3**: ルート直下が `index.ts`, `types.ts`, `enemyAI.ts`（Phase 5 で削除予定）のみであることを確認
- [x] **P2-8-4**: `npm run typecheck` が通ることを確認
- [x] **P2-8-5**: `npm run lint` が通ることを確認（既存の未使用import警告6件は Phase 1 から存在、Phase 2 の変更とは無関係）
- [x] **P2-8-6**: `npm test` が通ることを確認 — 341スイート / 4424テスト全パス
- [x] **P2-8-7**: `npm run build` が通ることを確認（既存のwebpackエントリポイント問題はPhase 2の変更とは無関係）

### P2-9: レビュー・リファクタリング

- [x] **P2-9-1**: domain内部のimportパスを `domain/types` 直接参照に統一（`../../../types` → `../../types` 7ファイル修正）
- [x] **P2-9-2**: レイヤー間依存方向を確認（`endingService.ts` のアセット直接参照は Phase 3 以降で対応）
- [x] **P2-9-3**: ルート直下のテストファイルを `__tests__/` に移動（7ファイル）
- [x] **P2-9-4**: リファクタリング後の全テスト通過を確認 — 341スイート / 4424テスト全パス

---

## Phase 3: 副作用の除去と依存性注入

### P3-1: ポートインターフェースの定義

- [x] **P3-1-1**: `domain/ports/IdGenerator.ts` を作成
- [x] **P3-1-2**: `domain/ports/RandomProvider.ts` を作成
- [x] **P3-1-3**: `domain/ports/ClockProvider.ts` を作成
- [x] **P3-1-4**: `domain/ports/index.ts` を作成（barrel export）

### P3-2: インフラ実装の作成

- [x] **P3-2-1**: `infrastructure/id/SequentialIdGenerator.ts` を作成
- [x] **P3-2-2**: 既存 `infrastructure/random/RandomProvider.ts` を port 実装に更新
- [x] **P3-2-3**: 既存 `infrastructure/clock/ClockProvider.ts` を port 実装に更新
- [x] **P3-2-4**: テスト用 `__tests__/mocks/MockIdGenerator.ts` を作成
- [x] **P3-2-5**: テスト用 `__tests__/mocks/MockRandomProvider.ts` を作成
- [x] **P3-2-6**: テスト用 `__tests__/mocks/MockClockProvider.ts` を作成

### P3-3: グローバル ID カウンタの除去

- [x] **P3-3-1**: `domain/entities/enemy.ts` から `enemyIdCounter` を削除、`createEnemy` に `IdGenerator` 引数を追加
- [x] **P3-3-2**: `domain/entities/trap.ts` から `trapIdCounter` を削除、`createTrap` に `IdGenerator` 引数を追加
- [x] **P3-3-3**: `domain/entities/item.ts` から `itemIdCounter` を削除、`createItem` に `IdGenerator` 引数を追加
- [x] **P3-3-4**: `presentation/services/feedbackService.ts` から `feedbackIdCounter` を削除
- [x] **P3-3-5**: 全呼び出し箇所を更新（IdGenerator を渡すように）
- [x] **P3-3-6**: `testUtils.ts` の `resetEnemyIdCounter()` 等を削除
- [x] **P3-3-7**: テストを更新（MockIdGenerator を使用）
- [x] **P3-3-8**: 全テストが通ることを確認 — 67スイート / 1048テスト全パス

### P3-4: Math.random() の直接呼び出し除去

- [x] **P3-4-1**: `domain/entities/enemy.ts` の `createDropItem()` から `Math.random()` デフォルト引数を削除
- [x] **P3-4-2**: その他 `Math.random()` 直接呼び出し箇所を検索・修正（mazeGenerator, pathfinderService, placementDecision, candidateDetection, enemySpawner, item, trap）
- [x] **P3-4-3**: 全呼び出し箇所で `RandomProvider` を使用するように更新
- [x] **P3-4-4**: テストを更新（MockRandomProvider を使用）
- [x] **P3-4-5**: 全テストが通ることを確認 — 67スイート / 1048テスト全パス

### P3-5: DamageResult 型の導入

- [x] **P3-5-1**: `domain/entities/player.ts` に `DamageResult` 型を定義
- [x] **P3-5-2**: `damagePlayer()` の戻り値を `DamageResult` に変更
- [x] **P3-5-3**: `application/usecases/resolvePlayerDamage.ts` を更新（参照同等性チェックを削除）
- [x] **P3-5-4**: 全呼び出し箇所を更新（combatService.ts 含む）
- [x] **P3-5-5**: テストを更新
- [x] **P3-5-6**: 全テストが通ることを確認 — 67スイート / 1048テスト全パス

### P3-7: Phase 2 レビュー指摘事項の対応（レイヤー違反の修正）

- [x] **P3-7-1**: `domain/services/endingService.ts` のアセット直接importを分離
  - 画像/動画のimportを `presentation/services/endingAssetProvider.ts` に移動
  - domain層からアセットへの直接参照を完全に除去
- [x] **P3-7-2**: `domain/services/gimmickPlacement/candidateDetection.ts` の feature 外ユーティリティ参照を解消
  - `../../../../../utils/math-utils` の `shuffle` 関数を `RandomProvider.shuffle` 経由に変更
- [x] **P3-7-3**: 全テストが通ることを確認 — 67スイート / 1048テスト全パス

### P3-8: Phase 3 完了確認

- [x] **P3-8-1**: グローバル可変状態が0であることを確認（domain/application層に `let .*Counter` なし）
- [x] **P3-8-2**: `Math.random()` 直接呼び出しが0であることを確認（domain/application層）
- [x] **P3-8-3**: domain層から application/infrastructure/presentation への参照が0であることを確認
- [x] **P3-8-4**: domain層から feature 外モジュールへの直接参照が0であることを確認
- [x] **P3-8-5**: `npm run typecheck` が通ることを確認
- [x] **P3-8-6**: `npm test` が通ることを確認 — 67スイート / 1048テスト全パス

---

## Phase 4: 責務分離（SRP の適用）

### P4-1: useGameState.ts の分割

- [x] **P4-1-1**: `presentation/hooks/useGameSetup.ts` を抽出
  - `setupGameState()` とその関連ロジック
  - マップ生成・プレイヤー初期化・敵スポーン・ギミック配置
- [x] **P4-1-2**: `presentation/hooks/useScreenTransition.ts` を抽出
  - 画面遷移ハンドラー
- [x] **P4-1-3**: `presentation/hooks/useStageManagement.ts` を抽出
  - ステージ進行・報酬・引き継ぎロジック
- [x] **P4-1-4**: `presentation/hooks/useGameAudio.ts` を抽出
  - BGM/SE 管理・画面ごとの切り替え
- [x] **P4-1-5**: `useGameState.ts` を Facade フックに変更（上記フックを統合）
- [x] **P4-1-6**: useGameState の返り値の型を維持（後方互換性のため GameState interface を保持）
- [x] **P4-1-7**: 全テストが通ることを確認 — 346スイート / 4464テスト全パス

### P4-2: Game.tsx の分割

- [x] **P4-2-1**: `presentation/screens/GameCanvas.tsx` を抽出
  - Canvas要素ラッパーコンポーネント（React.memo 適用）
  - ※ Canvas描画useEffectはGameScreenに密結合のため残置
- [x] **P4-2-2**: `presentation/screens/GameHUD.tsx` を抽出
  - HP バー、レベル表示、マップ切替ボタン、タイマー、ステータス表示等
- [x] **P4-2-3**: `presentation/screens/GameControls.tsx` を抽出
  - モバイル十字キー、キーボード入力処理、連続移動ロジック
- [x] **P4-2-4**: `presentation/screens/GameModals.tsx` を抽出
  - ClassSelectScreen、LevelUpOverlayComponent、HelpOverlayComponent、EffectEvent型
- [x] **P4-2-5**: `Game.tsx` をメインコンポーネントに整理（上記を統合、re-export で後方互換維持）
- [x] **P4-2-6**: パフォーマンス検証（Canvas描画ロジックは変更なし、FPS影響なし）
- [x] **P4-2-7**: 全テストが通ることを確認 — 346スイート / 4464テスト全パス

### P4-3: tickGameState.ts の分割

- [x] **P4-3-1**: `application/usecases/resolveTraps.ts` を抽出
  - 罠トリガー処理（DI対応、テスト付き）
- [x] **P4-3-2**: `application/usecases/resolveRegen.ts` を抽出
  - リジェネ処理（定数エクスポート、テスト付き）
- [x] **P4-3-3**: `application/usecases/resolveEnemyUpdates.ts` を抽出
  - 敵更新・死亡フィルタ（テスト付き）
- [x] **P4-3-4**: `tickGameState.ts` をオーケストレーターに整理
  - 各ユースケースを順番に呼び出す薄いレイヤーに変更
  - 旧DI（getTrapAt等）を削除、resolveTraps内部に移行
- [x] **P4-3-5**: 全テストが通ることを確認 — 346スイート / 4464テスト全パス

### P4-4: useGameLoop.ts の責務分離

- [x] **P4-4-1**: `presentation/hooks/useEffectDispatcher.ts` を抽出
  - エフェクトディスパッチロジック（音声・表示・フローティングテキスト）
  - dispatchSoundEffect / dispatchDisplayEffect を分離
- [x] **P4-4-2**: `useGameLoop.ts` を整理（287行 → 107行）
- [x] **P4-4-3**: 全テストが通ることを確認 — 346スイート / 4464テスト全パス

### P4-4b: Phase 3 レビュー残課題の対応

- [x] **P4-4b-1**: `resolvePlayerDamage` の戻り値に `actualDamage` を追加
  - `DamageResult.actualDamage` を `ResolvePlayerDamageResult` に伝播
  - 無敵中は `actualDamage: 0`、ダメージ時は実際のダメージ量を返す
  - テスト追加（残りHP以下になるケース含む）
- [x] **P4-4b-2**: 後方互換シングルトン `MATH_RANDOM_PROVIDER` / `SYSTEM_CLOCK_PROVIDER` の整理
  - `recordStorage.ts` の `SYSTEM_CLOCK_PROVIDER` → `new DateClockProvider()` に変更
  - `MATH_RANDOM_PROVIDER` / `SYSTEM_CLOCK_PROVIDER` シングルトンを削除
  - `infrastructure/index.ts` と `ipne/index.ts` のエクスポートを整理

### P4-5: Phase 4 完了確認

- [x] **P4-5-1**: ファイル行数確認（一部200行超あり、下記注記参照）
  - Game.tsx: 990行（Canvas描画ロジック670行が密結合のため分割困難）
  - GameControls.tsx: 312行（JSXテンプレート部分が大半）
  - useGameState.ts: 228行（Facade のため統合インターフェース維持が必要）
  - その他の新規ファイルは概ね200行以内
- [x] **P4-5-2**: `npm run typecheck` が通ることを確認
- [x] **P4-5-3**: `npm run lint` が通ることを確認（既存のPhase 1由来の7件のみ）
- [x] **P4-5-4**: `npm test` が通ることを確認 — 346スイート / 4464テスト全パス
- [x] **P4-5-5**: `npm run build` が通ることを確認

---

## Phase 5: DRY 原則の適用とデザインパターン導入 ✅ 完了（2026-03-16）

### P5-1: マジックナンバーの集約 ✅

- [x] **P5-1-1**: `domain/config/gameBalance.ts` を作成
  - combat: baseCooldownMs, knockbackDistance, knockbackDurationMs, invincibleDurationMs, playerAttackDamage
  - regen: baseIntervalMs, reductionPerBonus, minIntervalMs, baseHealAmount
  - movement: baseMoveIntervalMs, initialMoveDelayMs
  - enemyAi: updateIntervalMs, chaseTimeoutMs, attackCooldownMs, bossAttackCooldownMs, rangedPreferredDistance, attackAnimDurationMs
  - combo: windowMs, minDisplay, maxEffectMultiplier, maxEffectCombo
  - player: warrior/thief 初期値, 能力上限, maxLevel
- [x] **P5-1-2**: `domain/services/combatService.ts` のマジックナンバーを定数参照に置換
- [x] **P5-1-3**: `domain/entities/player.ts` のマジックナンバーを定数参照に置換
- [x] **P5-1-4**: `application/usecases/resolveRegen.ts` のマジックナンバーを定数参照に置換
- [x] **P5-1-5**: `domain/services/movementService.ts` のマジックナンバーを定数参照に置換
- [x] **P5-1-6**: `enemyAI.ts`, `comboService.ts`, `progressionService.ts` のマジックナンバーを定数参照に置換
- [x] **P5-1-7**: 全テストが通ることを確認（1089テスト通過）

### P5-2: 敵AI の Strategy パターン統一 ✅

- [x] **P5-2-1**: `enemyAI.ts` の全AI関数を `domain/policies/enemyAi/enemyAiFunctions.ts` に移動
- [x] **P5-2-2**: `updatePatrolEnemy`, `updateChargeEnemy`, `updateRangedEnemy`, `updateFleeEnemy` を Policy 配下に統合
- [x] **P5-2-3**: ユーティリティ関数（detectPlayer, shouldChase等）も同時に移動
- [x] **P5-2-4**: `enemyAI.ts` を再エクスポートバレルに変換後、全呼び出し箇所を更新
- [x] **P5-2-5**: `enemyAI.ts` を削除
- [x] **P5-2-6**: `tickGameState.ts`, `index.ts`, テストファイルのインポートを更新
- [x] **P5-2-7**: 全テストが通ることを確認（1105テスト通過）

### P5-3: Factory パターンの統一 ✅

- [x] **P5-3-1**: `domain/factories/entityFactory.ts` に統一 `EntityFactory` を作成
  - `EntityFactory.createEnemy(type, x, y, idGen)` を統一エントリポイントに
  - `EntityFactory.createTrap(type, x, y, idGen)` を統一エントリポイントに
  - `EntityFactory.createWall(type, x, y, state?)` を統一エントリポイントに
  - `EntityFactory.createItem(type, x, y, idGen)` を統一エントリポイントに
- [x] **P5-3-2**: 既存の個別ファクトリ関数は後方互換のため維持
- [x] **P5-3-3**: テスト作成（全タイプの生成検証）
- [x] **P5-3-4**: 全テストが通ることを確認（1113テスト通過）

### P5-4: DbC の強化 ✅

- [x] **P5-4-1**: `domain/contracts/assertions.ts` に `require`, `ensure`, `invariant` を定義
- [x] **P5-4-2**: Enemy 生成に事前条件を追加（x >= 0, y >= 0）
- [x] **P5-4-3**: damagePlayer に事後条件を追加（resultHp >= 0, resultHp <= maxHp）
- [x] **P5-4-4**: テスト作成（事前条件・事後条件・不変条件の検証）
- [x] **P5-4-5**: 全テストが通ることを確認（1127テスト通過）

### P5-5: Phase 5 完了確認 ✅

- [x] **P5-5-1**: ルート直下に `index.ts`, `types.ts` のみ残っていることを確認（enemyAI.ts 削除済み）
- [x] **P5-5-2**: マジックナンバーが `gameBalance.ts` に集約されていることを確認
- [x] **P5-5-3**: `npx tsc --noEmit` が通ることを確認
- [x] **P5-5-4**: `npx eslint` が通ることを確認（既存の未使用型エラーのみ）
- [x] **P5-5-5**: `npm test` が通ることを確認（75スイート、1127テスト通過）
- [x] **P5-5-6**: `npm run build` が通ることを確認

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
- [ ] **P6-3-15**: (Phase 2 レビュー指摘) テストのimportパターンを統一（barrel export 経由 vs 直接参照の混在を解消）
- [ ] **P6-3-16**: (Phase 2 レビュー指摘) domain内テストの `__tests__/testUtils` への3階層依存を解消
  - `domain/policies/enemyAi/EnemyAiPolicyRegistry.test.ts` 等が `../../../__tests__/testUtils` を参照
  - テストユーティリティを共有層に配置するか、domain内にテスト用ヘルパーを配置

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

### F-4: Phase 2 レビュー残課題の最終確認

- [ ] **F-4-1**: `shared/index.ts` の役割を整理（`domain/contracts` を re-export しているが shared 層の役割が曖昧）
- [ ] **F-4-2**: domain層から外部レイヤーへの参照が完全に0であることを最終確認

---

## タスク統計

| Phase | タスク数 | 推定作業量 | 状態 |
|-------|---------|-----------|------|
| Phase 1: 型定義の分割 | 13 | 小 | ✅ 完了 |
| Phase 2: レイヤー移動 | 43 (+4 レビュー・リファクタリング) | 大 | ✅ 完了 |
| Phase 3: 副作用除去・DI | 28 (+6 レビュー指摘対応) | 中 | ✅ 完了 |
| Phase 4: 責務分離 | 19 | 大 | |
| Phase 5: DRY・パターン | 23 | 中 | |
| Phase 6: テスト改善 | 23 (+2 レビュー指摘対応) | 中 | |
| Phase 7: 統合・シナリオテスト | 18 | 中 | |
| 最終確認 | 13 (+2 レビュー残課題) | 小 | |
| **合計** | **180** | — | |
