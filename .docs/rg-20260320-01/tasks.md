# Racing Game リファクタリング タスクチェックリスト

> 文書ID: RG-20260320-01-TASKS
> 作成日: 2026-03-20
> 関連計画書: RG-20260320-01-PLAN
> 関連仕様書: RG-20260320-01-SPEC
> ステータス: フェーズ2 完了（2-6 定数分散配置を除く）

---

## 凡例

- [ ] 未着手
- [x] 完了
- 🔴 ブロッカー（他タスクの前提）
- 🟡 注意が必要
- 🟢 独立して実施可能

---

## フェーズ1: 基盤整備

### 1-1. ディレクトリ構造の作成 🔴

- [x] `domain/player/` ディレクトリ作成
- [x] `domain/race/` ディレクトリ作成
- [x] `domain/track/` ディレクトリ作成
- [x] `domain/card/` ディレクトリ作成
- [x] `domain/highlight/` ディレクトリ作成
- [x] `domain/shared/` ディレクトリ作成
- [x] `application/` ディレクトリ作成
- [x] `application/ports/` ディレクトリ作成
- [x] `infrastructure/renderer/` ディレクトリ作成
- [x] `infrastructure/audio/` ディレクトリ作成
- [x] `infrastructure/storage/` ディレクトリ作成
- [x] `infrastructure/input/` ディレクトリ作成
- [x] `presentation/` ディレクトリ作成
- [x] `presentation/hooks/` ディレクトリ作成
- [x] `presentation/components/` ディレクトリ作成
- [x] `__tests__/domain/` 配下のテストディレクトリ作成
- [x] `__tests__/application/` ディレクトリ作成
- [x] `__tests__/integration/` ディレクトリ作成

### 1-2. 共通ユーティリティの分離 🔴

- [x] `domain/shared/math-utils.ts` の作成（`utils.ts` から移行）
  - [x] `clamp` 関数の移行
  - [x] `normalizeAngle` 関数の移行
  - [x] `dist` → `distance` にリネームして移行
  - [x] `randInt` → `randomInt` にリネームして移行
  - [x] `randRange` → `randomRange` にリネームして移行
  - [x] `formatTime` 関数の移行
  - [x] `safeIndex` 関数の移行
  - [x] `min` 関数の移行
- [x] `domain/shared/assertions.ts` の作成
  - [x] `assert` 関数の実装
  - [x] `assertInRange` 関数の実装
  - [x] `assertPositive` 関数の実装
  - [x] `assertNonNegative` 関数の実装
  - [x] `assertDefined` 関数の実装
  - [x] `assertValidIndex` 関数の実装
  - [x] 本番ビルド時の Tree-shaking 対応
- [x] `domain/shared/types.ts` の作成
  - [x] `Point` 型の配置
  - [x] `Checkpoint` 型の配置
- [x] 旧 `utils.ts` を re-export に変更
- [x] 全参照先のインポートパス更新
- [x] テスト実行・パス確認

### 1-3. 共通型定義の整理 🔴

- [x] `domain/player/types.ts` の作成
  - [x] `Player` 型
  - [x] `PlayerIdentity` 型
  - [x] `PlayerState` 型
  - [x] `DriftState` 型
  - [x] `HeatState` 型
- [x] `domain/race/types.ts` の作成
  - [x] `GamePhase` 型
  - [x] `GameMode` 型
  - [x] `RaceConfig` 型
  - [ ] `RaceState` 型（フェーズ2-3 で実装）
- [x] `domain/track/types.ts` の作成
  - [x] `TrackInfo` 型
  - [x] `StartLine` 型
  - [x] `Course` 型
  - [x] `CourseEffect` 型
- [x] `domain/card/types.ts` の作成
  - [x] `Card` 型
  - [x] `CardEffect` 型
  - [x] `CardCategory` 型
  - [x] `CardRarity` 型
  - [x] `DeckState` 型
- [x] `domain/highlight/types.ts` の作成
  - [x] `HighlightType` 型
  - [x] `HighlightEvent` 型
  - [x] `HighlightTracker` 型
  - [x] `PlayerHighlightState` 型
- [x] エフェクト関連型の配置
  - [x] `Particle` 型（旧 types.ts に残留）
  - [x] `Spark` 型（旧 types.ts に残留）
  - [x] `Confetti` 型（旧 types.ts に残留）
  - [x] `Decoration` 型（旧 types.ts に残留）
- [x] 旧 `types.ts` を re-export に変更
- [x] 全参照先のインポートパス更新
- [x] TypeScript型チェック実行・パス確認

### 1-4. 既存テストのスナップショット取得 🟢

- [x] 現在の全テスト実行結果を記録（13スイート、192テスト全パス）
- [ ] テストカバレッジレポートの取得・保存
- [ ] CI パイプラインでの品質ゲート確認

### 1-5. スモークテストの作成 🟢

- [ ] `e2e/racing-game/` ディレクトリ作成
- [ ] `smoke.spec.ts` の作成（3〜5件に限定）
  - [ ] ページが正常に表示される（タイトル・Canvas の存在確認）
  - [ ] ゲーム開始でメニューが消える
  - [ ] P キーでポーズ画面が表示される
  - [ ] ESC キーでメニューに戻れる
- [ ] スモークテスト実行・パス確認

> **注意**: Canvas 内部の描画内容（車の位置、エフェクト等）は検証しない。
> ゲームロジックの正確性はフェーズ3の統合テスト（GameOrchestrator テスト）で担保する。

### フェーズ1 完了後の品質ゲート

- [x] `npm run typecheck` パス
- [x] `npm run lint` パス
- [x] `npm test` 全パス（既存テスト回帰なし）
- [ ] スモークテスト全パス（1-5 保留）
- [ ] `npm run build` 成功

---

## フェーズ2: ドメイン層リファクタリング

### 2-1. Player ドメインの構築 🔴

- [x] `domain/player/constants.ts` の作成
  - [x] `DRIFT` 定数の移行
  - [x] `HEAT` 定数の移行
  - [x] `PLAYER` 定数の追加（TURN_RATE, SPEED_RECOVERY）
- [x] `domain/player/drift.ts` の作成
  - [x] `createDriftState` の実装
  - [x] `startDrift` の実装（DbC アサーション付き）
  - [x] `updateDrift` の実装（DbC アサーション付き）
  - [x] `endDrift` の実装（ブースト付与）
  - [x] `cancelDrift` の実装（ブーストなし）
  - [x] `getDriftBoost` の実装
  - [x] `getDriftSpeedRetain` の実装
- [x] `domain/player/heat.ts` の作成
  - [x] `createHeatState` の実装
  - [x] `updateHeat` の実装（DbC アサーション付き）
  - [x] `getHeatBoost` の実装
- [ ] `domain/player/player.ts` の作成（フェーズ3で GameOrchestrator と共に実装）
  - [ ] `movePlayer` の実装（`game-logic.ts` から抽出）
  - [ ] 副作用の完全除去（SoundEngine 呼び出しを排除）
  - [ ] `MoveResult` 型の導入
- [x] `domain/player/player-factory.ts` の作成
  - [x] `createPlayer` の実装
  - [x] `createPlayers` の実装（モード別）
- [x] `domain/player/cpu-strategy.ts` の作成
  - [x] `CpuStrategy` インターフェース定義
  - [x] easy / normal / hard 難易度パラメータ
  - [x] `createCpuStrategy` ファクトリ関数
- [x] 旧 `drift.ts` / `heat.ts` を re-export に変更
- [x] テスト移行
  - [x] `drift.test.ts` → `domain/player/drift.test.ts`
  - [x] `heat.test.ts` → `domain/player/heat.test.ts`
  - [ ] `game-logic.test.ts` の Player 関連テスト → `domain/player/player.test.ts`
  - [x] CPU AI テスト → `domain/player/cpu-strategy.test.ts`
  - [x] テストの振る舞いベース化
  - [x] テスト用ファクトリの作成（`__tests__/helpers/test-factories.ts`）
- [x] 全テスト実行・パス確認

### 2-2. Track ドメインの構築 🟢

- [x] `domain/track/constants.ts` の作成
  - [x] トラック関連定数の移行（WALL定数）
- [x] `domain/track/track.ts` の作成
  - [x] `getTrackInfo` の実装
  - [x] `calculateStartLine` の実装
  - [x] `getWallNormal` の実装
- [x] `domain/track/wall-physics.ts` の作成
  - [x] `calculateWallPenalty` の実装
  - [x] `shouldWarp` の実装
  - [x] `calculateWarpDestination` の実装
  - [x] `calculateSlideVector` の実装
  - [x] `calculateSlideAngle` の実装
  - [x] `calculateWallSlidePosition` の実装
- [x] `domain/track/course-effect.ts` の作成
  - [x] `getCourseEffect` の実装
  - [x] `getSegmentFriction` の実装
  - [x] `getSegmentSpeedModifier` の実装
- [ ] `domain/track/course.ts` の作成（コースデータ移行は2-6で実施）
  - [ ] コースデータの定義（`constants.ts` から移行）
- [x] 旧 `track.ts` / `wall-physics.ts` / `course-effects.ts` を re-export に変更
- [x] テスト移行（新ドメインモジュールの直接テスト）
  - [x] `domain/track/track.test.ts`（新規作成）
  - [x] `domain/track/wall-physics.test.ts`（新規作成）
  - [x] `domain/track/course-effect.test.ts`（新規作成）
  - [x] テストの振る舞いベース化
- [x] 全テスト実行・パス確認

### 2-3. Race ドメインの構築 🟡

- [x] `domain/race/constants.ts` の作成
  - [x] レース関連定数の移行
- [x] `domain/race/game-phase.ts` の作成
  - [x] `VALID_TRANSITIONS` の定義
  - [x] `canTransition` の実装
  - [x] `transition` の実装（DbC 付き）
- [x] `domain/race/checkpoint.ts` の作成
  - [x] `updateCheckpoints` の実装（`game-logic.ts` から抽出）
  - [x] `allCheckpointsPassed` の実装
- [x] `domain/race/collision.ts` の作成
  - [x] `handleCollision` の実装（`game-logic.ts` から抽出）
  - [x] 衝突時のドリフトキャンセルロジック
- [x] `domain/race/lap-counter.ts` の作成
  - [x] ラップ完了判定ロジック
  - [x] ラップタイム計算
- [x] テスト作成
  - [x] `domain/race/game-phase.test.ts`（新規）
  - [x] `domain/race/checkpoint.test.ts`（game-logic.test.ts から移行）
  - [x] `domain/race/collision.test.ts`（game-logic.test.ts から移行）
  - [x] `domain/race/lap-counter.test.ts`（新規）
- [x] 全テスト実行・パス確認

### 2-4. Card ドメインの構築 🟢

- [x] `domain/card/deck.ts` 内に `MIN_POOL_SIZE`, `RARITY_ORDER`, `RARITY_PROB` 定数を定義
- [x] `domain/card/card-catalog.ts` の作成
  - [x] 15枚のカードマスターデータ定義（`draft-cards.ts` から移行）
- [x] `domain/card/deck.ts` の作成
  - [x] `createDeck` の実装
  - [x] `drawCards` の実装（DbC 付き）
  - [x] `selectCard` の実装
  - [x] `cpuSelectCard` の実装
  - [x] `clearActiveEffects` の実装
- [x] `domain/card/card-effect.ts` の作成
  - [x] `computeCardEffects` の実装
  - [x] `getCardMultiplier` の実装
- [x] 旧 `card-effects.ts` を re-export に変更
- [x] テスト移行
  - [x] `domain/card/deck.test.ts`（新規作成、11テスト）
  - [x] `domain/card/card-effect.test.ts`（新規作成）
  - [x] テストの振る舞いベース化
- [x] 全テスト実行・パス確認

### 2-5. Highlight ドメインの構築 🟢

- [x] `domain/highlight/constants.ts` の作成
  - [x] ハイライト関連定数の移行
- [x] `domain/highlight/highlight.ts` の作成
  - [x] `createTracker` の実装
  - [x] `getSummary` の実装
- [x] `domain/highlight/event-detector.ts` の作成
  - [x] `detectDriftBonus` の実装
  - [x] `detectHeatBoost` の実装
  - [x] `detectNearMiss` の実装
  - [x] `detectOvertake` の実装
  - [x] `detectFastestLap` の実装
  - [x] `detectPhotoFinish` の実装
- [x] 旧 `highlight.ts` を re-export に変更
- [x] テスト移行
  - [x] `domain/highlight/event-detector.test.ts`（新規作成）
  - [x] テストの振る舞いベース化
- [x] 全テスト実行・パス確認

### 2-6. 定数の分散配置 🟡

- [ ] `constants.ts` の各定数を対応するドメインへ移行
  - [ ] `Config.game` → 各ドメインの `constants.ts`（一部完了: turnRate, speedRecovery → PLAYER 定数）
  - [ ] `Config.canvas` → `infrastructure/renderer/` の定数
  - [ ] `Config.audio` → `infrastructure/audio/` の定数
  - [ ] `Config.timing` → `domain/race/constants.ts`（一部完了: RACE_TIMING）
  - [ ] `Colors` → `infrastructure/renderer/` の定数
  - [ ] `Options` → `presentation/` の定数
  - [ ] `Courses` → `domain/track/course.ts`
  - [x] `DRIFT` → `domain/player/constants.ts`
  - [x] `HEAT` → `domain/player/constants.ts`
  - [x] `WALL` → `domain/track/constants.ts`
  - [x] `HIGHLIGHT` → `domain/highlight/constants.ts`
- [ ] 旧 `constants.ts` を re-export に変更
- [ ] 全参照先のインポートパス更新
- [ ] 全テスト実行・パス確認

### 2-7. ドメインイベントの定義 🟢

- [x] `domain/events.ts` の作成
  - [x] `DomainEvent` ユニオン型の定義
  - [x] 各イベント型の定義（lap_completed, collision, drift_start 等）
- [ ] テスト作成（型レベルのテスト）

### フェーズ2 完了後の品質ゲート

- [x] ドメイン層が外部依存ゼロであることの確認（import 検証）
- [x] `npm run typecheck` パス
- [x] `npm run lint` パス（domain/ 対象）
- [x] `npm test` 全パス（27スイート、317テスト）
- [ ] スモークテスト全パス（1-5 保留）
- [ ] `npm run build` 成功
- [ ] ドメイン層テストカバレッジ 90% 以上

---

## フェーズ3: アプリケーション層リファクタリング

### 3-1. ポートインターフェースの定義 🔴

- [ ] `application/ports/renderer-port.ts` の作成
  - [ ] `RendererPort` インターフェース定義
- [ ] `application/ports/audio-port.ts` の作成
  - [ ] `AudioPort` インターフェース定義
  - [ ] `SfxType` 型定義
- [ ] `application/ports/storage-port.ts` の作成
  - [ ] `StoragePort` インターフェース定義
- [ ] `application/ports/input-port.ts` の作成
  - [ ] `InputPort` インターフェース定義
  - [ ] `InputState` 型定義
  - [ ] `DraftInput` 型定義
- [ ] TypeScript型チェック実行

### 3-2. GameOrchestrator の作成 🔴

- [ ] `application/game-orchestrator.ts` の作成
  - [ ] `GameOrchestratorConfig` 型定義
  - [ ] `GameOrchestratorState` 型定義
  - [ ] `createOrchestrator` の実装
  - [ ] `update` メソッドの実装（`RacingGame.tsx` の update 関数から抽出）
  - [ ] `draw` メソッドの実装（`RacingGame.tsx` の draw 関数から抽出）
  - [ ] 副作用の Port 経由化
  - [ ] カウントダウン → レース遷移ロジック
  - [ ] レース → リザルト遷移ロジック
  - [ ] レース → ドラフト遷移ロジック
- [ ] `RacingGame.tsx` から game-loop ロジックの段階的委譲
- [ ] テスト用モック Port の作成
  - [ ] `__tests__/helpers/mock-ports.ts` の作成
  - [ ] `createMockRenderer` の実装（呼び出し記録）
  - [ ] `createMockAudio` の実装（呼び出し記録）
  - [ ] `createMockStorage` の実装（インメモリ）
  - [ ] `createMockInput` の実装（プログラマブル入力）
- [ ] 統合テスト作成
  - [ ] `application/game-orchestrator.test.ts`
  - [ ] カウントダウン → レース遷移のテスト
  - [ ] ラップ完了 → ドラフト遷移のテスト
  - [ ] ドラフト → レース再開のテスト
  - [ ] レース完了 → リザルト遷移のテスト
  - [ ] ポーズ/リジュームのテスト
  - [ ] 壁衝突フローのテスト
  - [ ] ドリフト → ブーストのテスト
  - [ ] HEAT ブーストのテスト
  - [ ] カード効果適用のテスト
  - [ ] CPU カード自動選択のテスト
  - [ ] ハイライト検出のテスト
  - [ ] 勝者決定のテスト
- [ ] 全テスト実行・パス確認

### 3-3. InputProcessor の作成 🟢

- [ ] `application/input-processor.ts` の作成
  - [ ] `PlayerCommand` 型定義
  - [ ] `processInput` の実装
  - [ ] `collectPlayerInputs` の移行（`game-update.ts` から）
  - [ ] CPU AI の Strategy パターン統合
- [ ] テスト作成
  - [ ] `application/input-processor.test.ts`
  - [ ] 各入力パターンのテスト
  - [ ] CPU AI 入力のテスト
- [ ] 全テスト実行・パス確認

### 3-4. DraftProcessor の作成 🟢

- [ ] `application/draft-processor.ts` の作成
  - [ ] `DraftProcessorState` 型定義
  - [ ] `startDraft` の実装
  - [ ] `updateDraftTimer` の実装
  - [ ] `moveCursor` の実装
  - [ ] `confirmSelection` の実装
  - [ ] CPU 自動選択ロジック
- [ ] 旧 `draft-ui-logic.ts` の段階的委譲
- [ ] テスト作成
  - [ ] `application/draft-processor.test.ts`
  - [ ] タイマー管理のテスト
  - [ ] カード選択フローのテスト
- [ ] 全テスト実行・パス確認

### 3-5. GameEventBus の作成 🟢

- [ ] `application/game-event-bus.ts` の作成
  - [ ] `GameEventBus` インターフェース定義
  - [ ] `createEventBus` の実装
  - [ ] Subscribe/Publish メカニズム
  - [ ] イベントリスナーの解除機能
- [ ] テスト作成
  - [ ] `application/game-event-bus.test.ts`
  - [ ] Subscribe/Publish のテスト
  - [ ] 複数リスナーのテスト
  - [ ] リスナー解除のテスト
- [ ] 全テスト実行・パス確認

### フェーズ3 完了後の品質ゲート

- [ ] `npm run typecheck` パス
- [ ] `npm run lint` パス
- [ ] `npm test` 全パス
- [ ] スモークテスト全パス
- [ ] `npm run build` 成功
- [ ] アプリケーション層テストカバレッジ 80% 以上

---

## フェーズ4: インフラストラクチャ層リファクタリング

### 4-1. Renderer の分割 🟡

- [ ] `infrastructure/renderer/render-helpers.ts` の作成
  - [ ] `withContext` ヘルパー
  - [ ] `drawText` ヘルパー
  - [ ] `drawRoundedRect` ヘルパー
- [ ] `infrastructure/renderer/track-renderer.ts` の作成
  - [ ] `renderBackground` の実装
  - [ ] `renderTrack` の実装
  - [ ] `renderStartLine` の実装
  - [ ] `renderCheckpoints` の実装
  - [ ] `renderDecorations` の実装
  - [ ] `renderCourseEffect` の実装
- [ ] `infrastructure/renderer/kart-renderer.ts` の作成
  - [ ] `renderKart` の実装
  - [ ] 名前タグ描画
  - [ ] ブースト表示
- [ ] `infrastructure/renderer/hud-renderer.ts` の作成
  - [ ] `renderHud` の実装
  - [ ] HEAT ゲージ描画
  - [ ] ラップ情報描画
  - [ ] カウントダウン描画
  - [ ] CPU通知バナー描画
- [ ] `infrastructure/renderer/effect-renderer.ts` の作成
  - [ ] `renderParticles` の実装
  - [ ] `renderSparks` の実装
  - [ ] `renderConfetti` の実装
  - [ ] `renderFireworks` の実装
- [ ] `infrastructure/renderer/draft-renderer.ts` の作成
  - [ ] `renderDraftUI` の実装
- [ ] `infrastructure/renderer/canvas-renderer.ts` の作成
  - [ ] `RendererPort` の実装
  - [ ] Canvas コンテキスト管理
  - [ ] フレーム開始/終了
  - [ ] シェイク処理
- [ ] 旧 `renderer.ts` / `game-draw.ts` の段階的委譲
- [ ] 全テスト実行・パス確認
- [ ] 視覚的回帰テスト（手動確認）

### 4-2. Audio アダプターの整理 🟢

- [ ] `infrastructure/audio/sound-engine.ts` の作成
  - [ ] `AudioPort` の実装
  - [ ] 既存 `SoundEngine` のアダプター化
  - [ ] 効果音メソッドの型安全化
- [ ] `infrastructure/audio/audio-effects.ts` の作成
  - [ ] 効果音定義の分離
- [ ] 旧 `audio.ts` の段階的委譲
- [ ] 全テスト実行・パス確認

### 4-3. Storage リポジトリの作成 🟢

- [ ] `infrastructure/storage/score-repository.ts` の作成
  - [ ] `StoragePort` の実装
  - [ ] 既存 `score-storage` ユーティリティのアダプター化
- [ ] テスト作成
  - [ ] `infrastructure/storage/score-repository.test.ts`
- [ ] 全テスト実行・パス確認

### 4-4. Input アダプターの整理 🟢

- [ ] `infrastructure/input/keyboard-adapter.ts` の作成
  - [ ] `InputPort` の実装（キーボード）
  - [ ] キーマッピングの定義
  - [ ] モード別入力設定
- [ ] `infrastructure/input/touch-adapter.ts` の作成
  - [ ] `InputPort` の実装（タッチ）
- [ ] 旧 `hooks.ts` の入力部分を段階的委譲
- [ ] 全テスト実行・パス確認

### フェーズ4 完了後の品質ゲート

- [ ] `npm run typecheck` パス
- [ ] `npm run lint` パス
- [ ] `npm test` 全パス
- [ ] スモークテスト全パス
- [ ] `npm run build` 成功
- [ ] ゲームの動作確認（手動テスト）

---

## フェーズ5: プレゼンテーション層リファクタリング & テスト強化

### 5-1. RacingGame.tsx のスリム化 🟡

- [ ] `presentation/hooks/useGameLoop.ts` の作成
  - [ ] Canvas ref の管理
  - [ ] GameOrchestrator の初期化・破棄
  - [ ] requestAnimationFrame ループ管理
  - [ ] ゲーム状態の React ステートへの反映
- [ ] `presentation/hooks/useGameState.ts` の作成
  - [ ] メニュー設定ステートの管理
  - [ ] ベストタイムの管理
- [ ] `presentation/hooks/useIdle.ts` の移行
  - [ ] 既存 `hooks.ts` から移行
- [ ] `presentation/RacingGame.tsx` のリファクタリング
  - [ ] ゲームループロジックの削除（useGameLoop に委譲）
  - [ ] 設定ステートの削除（useGameState に委譲）
  - [ ] コンポーネントの組み合わせのみに
  - [ ] **目標: 200行以下**
- [ ] `presentation/components/` への移行
  - [ ] `MenuPanel.tsx` の移動
  - [ ] `ResultPanel.tsx` の移動
  - [ ] `VolumeControl.tsx` の移動
- [ ] 全テスト実行・パス確認

### 5-2. 旧ファイルの削除 🟡

- [ ] 旧 `utils.ts` の re-export 確認・削除
- [ ] 旧 `types.ts` の re-export 確認・削除
- [ ] 旧 `constants.ts` の re-export 確認・削除
- [ ] 旧 `drift.ts` の re-export 確認・削除
- [ ] 旧 `heat.ts` の re-export 確認・削除
- [ ] 旧 `track.ts` の re-export 確認・削除
- [ ] 旧 `wall-physics.ts` の re-export 確認・削除
- [ ] 旧 `course-effects.ts` の re-export 確認・削除
- [ ] 旧 `game-logic.ts` の re-export 確認・削除
- [ ] 旧 `draft-cards.ts` の re-export 確認・削除
- [ ] 旧 `card-effects.ts` の re-export 確認・削除
- [ ] 旧 `highlight.ts` の re-export 確認・削除
- [ ] 旧 `entities.ts` の re-export 確認・削除
- [ ] 旧 `renderer.ts` の re-export 確認・削除
- [ ] 旧 `audio.ts` の re-export 確認・削除
- [ ] 旧 `hooks.ts` の re-export 確認・削除
- [ ] 旧 `game-update.ts` の re-export 確認・削除
- [ ] 旧 `game-draw.ts` の re-export 確認・削除
- [ ] 旧 `draft-ui-logic.ts` の re-export 確認・削除
- [ ] `index.ts` の更新（新モジュールの re-export）
- [ ] 未使用のインポート・ファイルの最終確認
- [ ] 全テスト実行・パス確認

### 5-3. 単体テストの拡充・リファクタリング 🟢

- [x] テスト用ファクトリの作成
  - [x] `__tests__/helpers/test-factories.ts`
  - [x] `createTestPlayer` の実装
  - [x] `createTestDeck` の実装
  - [x] `createTestTrackPoints` の実装
  - [x] `createTestCard` の実装
- [ ] ドメイン層テストの最終確認
  - [ ] 全テストが振る舞いベースであること
  - [ ] AAA パターンの遵守
  - [ ] テスト名が日本語で意図が明確であること
  - [ ] DbC アサーションのテスト
- [ ] 不足テストの追加
  - [ ] エッジケースのテスト（境界値、null/undefined、空配列等）
  - [ ] 不変条件のテスト
  - [ ] 複合シナリオのテスト（ドリフト中の壁衝突 等）
- [ ] テストの重複排除
- [ ] カバレッジ確認
  - [ ] ドメイン層: 90% 以上
  - [ ] 全体: 80% 以上

### 5-4. レイヤー横断統合テストの作成 🟢

- [ ] `__tests__/integration/race-flow.test.ts` の作成
  - [ ] ソロレースの完全フロー（countdown → race → result）
  - [ ] CPU 対戦の完全フロー（countdown → race → draft → race → result）
  - [ ] 2P 対戦の入力分離テスト
- [ ] `__tests__/integration/draft-flow.test.ts` の作成
  - [ ] カード選択 → 効果適用 → ラップ終了でクリアの完全フロー
  - [ ] CPU 自動選択の動作
  - [ ] タイマー切れ時の自動選択
- [ ] `__tests__/integration/physics-flow.test.ts` の作成
  - [ ] ドリフト → ブースト → 速度回復の連続フロー
  - [ ] 壁接触 → ペナルティ → ワープの連続フロー
  - [ ] HEAT 蓄積 → ブースト発動の連続フロー
- [ ] 統合テスト全実行・パス確認

### 5-5. 旧テストの削除・整理 🟡

- [ ] `__tests__/drift.test.ts` の削除（移行済み確認後）
- [ ] `__tests__/heat.test.ts` の削除（移行済み確認後）
- [ ] `__tests__/game-logic.test.ts` の削除（移行済み確認後）
- [ ] `__tests__/track.test.ts` の削除（移行済み確認後）
- [ ] `__tests__/wall-physics.test.ts` の削除（移行済み確認後）
- [ ] `__tests__/course-effects.test.ts` の削除（移行済み確認後）
- [ ] `__tests__/draft-cards.test.ts` の削除（移行済み確認後）
- [ ] `__tests__/card-effects.test.ts` の削除（移行済み確認後）
- [ ] `__tests__/highlight.test.ts` の削除（移行済み確認後）
- [ ] `__tests__/utils.test.ts` の削除（移行済み確認後）
- [ ] `__tests__/entities.test.ts` の削除（移行済み確認後）
- [ ] 旧 `__tests__/` ディレクトリの削除

---

## 最終品質ゲート

### コード品質

- [ ] TypeScript `any` 使用数: 0個
- [ ] `npm run typecheck` パス
- [ ] `npm run lint` パス
- [ ] `npm run lint:ci` パス（warnings なし）

### テスト

- [ ] `npm test` 全パス
- [ ] スモークテスト全パス（Playwright 3〜5件）
- [ ] ドメイン層テストカバレッジ 90% 以上
- [ ] 全体テストカバレッジ 80% 以上
- [ ] 統合テストシナリオ 10 以上（GameOrchestrator テスト）

### アーキテクチャ

- [ ] `RacingGame.tsx` が 200行以下
- [ ] ドメイン層が外部依存ゼロ
- [ ] 最大ファイル行数が 300行以下
- [ ] 全ポートインターフェースが適切に実装されている

### ビルド

- [ ] `npm run build` 成功
- [ ] ビルドサイズ変動 ±5% 以内

### 動作確認

- [ ] ソロモードの動作確認
- [ ] CPU 対戦モードの動作確認
- [ ] 2P 対戦モードの動作確認
- [ ] デモモードの動作確認
- [ ] 全6コースでの動作確認
- [ ] ドラフトカードの動作確認
- [ ] ポーズ/リジュームの動作確認
- [ ] ベストタイム保存の動作確認
- [ ] 既知バグの状態確認（壁スタック、2Pカード）

---

## 付録: タスク依存関係

```
フェーズ1
  1-1 ──┐
  1-2 ──┼── フェーズ2 全体の前提
  1-3 ──┘
  1-4 ────── 独立（並行可能）
  1-5 ────── 独立（並行可能）

フェーズ2
  2-1 ──┐
  2-2 ──┤
  2-3 ──┼── 2-6 の前提（定数移行には各ドメインの受け入れ先が必要）
  2-4 ──┤
  2-5 ──┘
  2-7 ────── 独立（並行可能）

フェーズ3
  3-1 ──── 3-2, 3-3, 3-4 の前提（ポート定義が必要）
  3-2 ──── フェーズ4 の前提
  3-3 ──── 独立
  3-4 ──── 独立
  3-5 ──── 独立

フェーズ4
  4-1 ──┐
  4-2 ──┤
  4-3 ──┼── フェーズ5-1 の前提
  4-4 ──┘

フェーズ5
  5-1 ──── 5-2 の前提
  5-2 ──── 5-5 の前提
  5-3 ──── 独立（並行可能）
  5-4 ──── 独立（並行可能）
  5-5 ──── 最後に実施
```
