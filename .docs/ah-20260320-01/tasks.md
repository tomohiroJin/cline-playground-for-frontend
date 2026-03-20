# Air Hockey 大規模リファクタリング — タスクチェックリスト

## 進捗サマリー

| フェーズ | ステータス | タスク数 | 完了日 |
|---------|-----------|---------|--------|
| R1 ドメインモデル層の導入 | [x] 完了 | 28 | 2026-03-20 |
| R2 インフラ層の分離 | [x] 完了 | 22 | 2026-03-20 |
| R3 アプリケーション層の構築 | [ ] 未着手 | 16 | — |
| R4 プレゼンテーション層のリファクタリング | [ ] 未着手 | 14 | — |
| R5 テストリファクタリング + テスト強化 | [ ] 未着手 | 32 | — |

---

## Phase R1: ドメインモデル層の導入

### R1-1: 型定義の精査・Value Object 導入

- [x] `domain/` ディレクトリ構造を作成（`models/`, `services/`, `contracts/`, `constants/`, `events/`）
- [x] `core/types.ts` を精査し、ドメイン型とプレゼンテーション型に分類
- [x] `domain/types.ts` にドメイン型を移行（re-export で後方互換維持）
- [x] `domain/models/vector.ts`: Vector 値オブジェクトを作成
  - [x] 不変性（readonly プロパティ）
  - [x] ファクトリーメソッド（`create`, `zero`）
  - [x] 演算メソッド（`add`, `subtract`, `multiply`, `normalize`）
  - [x] クエリメソッド（`magnitude`, `distanceTo`）
  - [x] 等値比較（`equals`）
  - [x] 不変条件バリデーション（NaN/Infinity チェック）
- [x] `domain/constants/physics.ts`: 物理定数を `core/constants.ts` から分離
- [x] `domain/constants/fields.ts`: フィールド設定を `core/config.ts` から分離
- [x] `domain/constants/items.ts`: アイテム設定を `core/config.ts` から分離
- [x] `domain/constants/ai-presets.ts`: AI プリセットを `core/story-balance.ts` から分離

**テスト**:
- [x] `domain/models/vector.test.ts`: Vector の全メソッドテスト（不変性・等値比較含む）
- [x] 既存テスト全パス確認
- [x] `tsc --noEmit` で型エラーなし

### R1-2: ドメインサービスの移行

- [x] `domain/services/physics.ts`: `core/physics.ts` のロジックを移行（API 変更なし）
- [x] `domain/services/ai.ts`: `core/ai.ts` のロジックを移行
- [x] `domain/services/item-effect.ts`: Strategy パターンでアイテムエフェクトを実装
  - [x] `ItemEffectStrategy` インターフェース定義
  - [x] `SplitEffect` 実装
  - [x] `SpeedEffect` 実装
  - [x] `InvisibleEffect` 実装
  - [x] `ShieldEffect` 実装
  - [x] `MagnetEffect` 実装
  - [x] `BigEffect` 実装
  - [x] `ItemEffectRegistry` の実装
- [x] `domain/services/difficulty.ts`: `core/difficulty-adjust.ts` のロジックを移行
- [x] `domain/services/scoring.ts`: スコアリングロジックを抽出・集約
- [ ] 旧 `core/` ファイルから新パスへの re-export を設定

**テスト**:
- [x] `domain/services/physics.test.ts`: 既存 `physics.test.ts` の移行
- [x] `domain/services/ai.test.ts`: 既存 `ai.test.ts` の移行
- [x] `domain/services/item-effect.test.ts`: 各 Strategy の個別テスト + Registry テスト
- [x] 既存テスト全パス確認

### R1-3: エンティティ・集約ルートの導入

- [x] `domain/models/puck.ts`: Puck エンティティ（状態 + メソッド）
  - [x] `create` ファクトリー
  - [x] `applyVelocity`: 速度適用
  - [x] `applyFriction`: 摩擦適用
  - [x] `reflect`: 反射
  - [x] `speed`, `isMoving`, `isInGoal` クエリ
- [x] `domain/models/mallet.ts`: Mallet エンティティ
  - [x] `create` ファクトリー
  - [x] `moveTo`: 移動
  - [x] `clampToSide`: 自陣制限
- [x] `domain/models/match-stats.ts`: MatchStats 値オブジェクト
- [ ] `domain/models/game-state.ts`: GameState 集約ルート
  - [ ] `create` ファクトリー（フィールド・難易度から初期状態を生成）
  - [ ] `update`: 1フレーム更新（ドメインイベントを返す）
  - [ ] `startCountdown`, `startPlaying`, `pause`, `finish`: フェーズ遷移
  - [ ] `checkGoal`: スコア判定
  - [ ] 不変条件: スコアが負にならない、フェーズ遷移が有効

**テスト**:
- [x] `domain/models/puck.test.ts`: 各メソッドのテスト
- [x] `domain/models/mallet.test.ts`: 各メソッドのテスト
- [ ] `domain/models/game-state.test.ts`: 集約ルートの状態遷移テスト
- [x] 既存テスト全パス確認

### R1-4: ドメインイベントの定義

- [x] `domain/events/game-events.ts`: イベント型定義（`GameEvent` ユニオン型）
- [x] `domain/events/event-dispatcher.ts`: `GameEventDispatcher` の実装（game-events.ts に統合）
  - [x] `subscribe`: イベントハンドラの登録
  - [x] `dispatch`: イベントの発行
  - [x] `unsubscribe`: 購読解除（subscribe の戻り値で実現）

**テスト**:
- [x] `domain/events/event-dispatcher.test.ts`: 発行・購読・解除のテスト
- [x] 既存テスト全パス確認

---

## Phase R2: インフラ層の分離

### R2-1: ストレージポート定義 + Adapter 実装

- [x] `domain/contracts/storage.ts`: `GameStoragePort` インターフェース定義
- [x] `infrastructure/` ディレクトリ構造を作成（`storage/`, `audio/`, `renderer/`）
- [x] `infrastructure/storage/local-storage-adapter.ts`: localStorage アダプタ実装
  - [x] 実績の保存・読込
  - [x] ストーリー進行の保存・読込
  - [x] アンロック状態の保存・読込
  - [x] 図鑑進行の保存・読込
  - [x] オーディオ設定の保存・読込
  - [x] デイリーチャレンジ結果の保存・読込
  - [x] スコアの保存・読込
  - [x] 破損時フォールバック（try-catch + デフォルト値）
- [x] `__tests__/helpers/in-memory-storage.ts`: テスト用インメモリストレージ
- [ ] 既存モジュール（`achievements.ts`, `story.ts`, `unlock.ts`, `dex.ts`, `audio-settings.ts`, `daily-challenge.ts`）をアダプタ経由に変更

**テスト**:
- [x] `infrastructure/storage/local-storage-adapter.test.ts`: 各メソッドの保存・読込・フォールバック
- [x] 既存テスト全パス確認（モック設定の更新が必要な場合あり）

### R2-2: オーディオポート定義 + Adapter 実装

- [x] `domain/contracts/audio.ts`: `AudioPort` インターフェース定義
- [x] `infrastructure/audio/web-audio-adapter.ts`: Web Audio API アダプタ実装
  - [x] 現 `core/sound.ts` のロジックを移行
  - [x] 効果音生成（hit, wall, goal, item, countdown, whistle）
  - [x] BGM 制御（start, stop）
  - [x] 音量・ミュート設定
- [x] `__tests__/helpers/null-audio.ts`: テスト用 Null アダプタ（呼び出し記録付き）

**テスト**:
- [x] `__tests__/helpers/null-audio.test.ts`: Null アダプタの呼び出し記録テスト
- [x] 既存テスト全パス確認

### R2-3: レンダラー分割 + ポート定義

- [x] `domain/contracts/renderer.ts`: `GameRendererPort` インターフェース定義
- [x] `infrastructure/renderer/field-renderer.ts`: フィールド描画を分離
- [x] `infrastructure/renderer/entity-renderer.ts`: パック・マレット描画を分離
- [x] `infrastructure/renderer/effect-renderer.ts`: エフェクト描画を分離
- [x] `infrastructure/renderer/ui-renderer.ts`: UI 描画を分離
- [x] `infrastructure/renderer/canvas-renderer.ts`: 統合 Facade
- [ ] 旧 `renderer.ts` から新パスへの re-export を設定

**テスト**:
- [x] 各サブレンダラーの基本テスト（Canvas API 呼び出し検証）
- [x] 既存テスト全パス確認

---

## Phase R3: アプリケーション層の構築

### R3-1: ゲームループユースケースの抽出

- [ ] `application/` ディレクトリ構造を作成（`use-cases/`, `ports/`）
- [ ] `application/use-cases/game-loop.ts`: ゲームループユースケース
  - [ ] `GameLoopDependencies` 型定義（ストレージ・オーディオ・レンダラー・イベント）
  - [ ] `update`: 1フレーム更新（入力適用 → 物理演算 → 衝突判定 → AI → スコア判定）
  - [ ] `handleEvents`: ドメインイベントのハンドリング（音声・エフェクト）
- [ ] 現 `useGameLoop.ts` のゲームロジック部分を `GameLoopUseCase` に移行

**テスト**:
- [ ] `application/use-cases/game-loop.test.ts`: フレーム更新のフローテスト（モック依存注入）
- [ ] 既存テスト全パス確認

### R3-2: ストーリーモードユースケース

- [ ] `application/use-cases/story-mode.ts`: ストーリーモードユースケース
  - [ ] `loadProgress`: 進行読込
  - [ ] `getStageConfig`: ステージ設定取得
  - [ ] `completeStage`: ステージクリア処理
  - [ ] `resetProgress`: リセット
- [ ] 現 `AirHockeyGame.tsx` のストーリーロジック部分を移行

**テスト**:
- [ ] `application/use-cases/story-mode.test.ts`: フロー + 永続化テスト
- [ ] 既存テスト全パス確認

### R3-3: フリー対戦/デイリーチャレンジユースケース

- [ ] `application/use-cases/free-battle.ts`: フリー対戦ユースケース
- [ ] `application/use-cases/daily-challenge.ts`: デイリーチャレンジユースケース
- [ ] 現 `core/daily-challenge.ts` のロジック部分を移行

**テスト**:
- [ ] `application/use-cases/free-battle.test.ts`
- [ ] `application/use-cases/daily-challenge.test.ts`
- [ ] 既存テスト全パス確認

### R3-4: キャラクター図鑑ユースケース

- [ ] `application/use-cases/character-dex.ts`: 図鑑ユースケース
- [ ] 現 `core/dex.ts` + `hooks/useCharacterDex.ts` のロジック部分を移行

**テスト**:
- [ ] `application/use-cases/character-dex.test.ts`
- [ ] 既存テスト全パス確認

---

## Phase R4: プレゼンテーション層のリファクタリング

### R4-1: useGameLoop の薄いラッパー化

- [ ] `presentation/hooks/useGameLoop.ts`: requestAnimationFrame 管理 + React state 同期のみ
- [ ] ゲームロジックを `GameLoopUseCase` に委譲
- [ ] パラメータ数を 22 → 5 以下に削減
- [ ] 旧 `hooks/useGameLoop.ts` から re-export

**テスト**:
- [ ] `presentation/hooks/useGameLoop.test.ts`: フック動作テスト
- [ ] 既存テスト全パス確認

### R4-2: AirHockeyGame.tsx の責務分離

- [ ] `presentation/hooks/useScreenNavigation.ts`: 画面遷移管理フック
- [ ] `presentation/hooks/useGameMode.ts`: ゲームモード管理フック
- [ ] `presentation/AirHockeyGame.tsx`: 薄いラッパーに再構成（目標 200 行以下）
- [ ] 旧 `AirHockeyGame.tsx` から re-export

**テスト**:
- [ ] `presentation/hooks/useScreenNavigation.test.ts`
- [ ] `presentation/hooks/useGameMode.test.ts`
- [ ] 既存テスト全パス確認

### R4-3: コンポーネントの移動・整理

- [ ] `components/` → `presentation/components/` に移動
- [ ] `hooks/` → `presentation/hooks/` に移動
- [ ] `styles.ts` → `presentation/styles.ts` に移動
- [ ] 旧パスからの re-export を設定
- [ ] 全 import パスが正しいことを確認

**テスト**:
- [ ] 全テストパス確認
- [ ] ビルド成功確認

---

## Phase R5: テストリファクタリング + テスト強化

### R5-1: テストヘルパー・ファクトリーの統一

- [ ] `__tests__/helpers/factories.ts`: テストデータファクトリー
  - [ ] `createTestGameState()`: GameState 生成
  - [ ] `createTestPuck()`: Puck 生成
  - [ ] `createTestMallet()`: Mallet 生成
  - [ ] `createTestItem()`: Item 生成
  - [ ] `createTestFieldConfig()`: FieldConfig 生成
  - [ ] `createTestAiConfig()`: AiBehaviorConfig 生成
  - [ ] `createTestStoryProgress()`: StoryProgress 生成
  - [ ] `createTestMatchStats()`: MatchStats 生成
- [ ] `__tests__/helpers/mock-setup.ts`: 共通モック設定
  - [ ] `setupCanvasMock()`: Canvas API モック
  - [ ] `setupAudioMock()`: オーディオモック（NullAudioAdapter）
  - [ ] `setupStorageMock()`: ストレージモック（InMemoryStorageAdapter）
- [ ] `__tests__/helpers/game-runner.ts`: ゲームループランナー
  - [ ] `runFrames()`: 指定フレーム数の実行
  - [ ] `runUntil()`: 条件を満たすまで実行
  - [ ] `getEvents()` / `getEventsOfType()`: ドメインイベント収集
  - [ ] `setPuckPosition()` / `setPuckVelocity()`: テスト用状態操作
  - [ ] `spawnItem()`: テスト用アイテム配置
- [ ] 既存テストファイルのモック設定を共通化に置き換え

**テスト**:
- [ ] 全テストパス確認（モック共通化後）

### R5-2: 既存テストの振る舞いベース化

- [ ] テスト名を日本語の「何をしたら何が起きるか」形式に統一
- [ ] 実装詳細に依存するテストを振る舞いベースに書き換え
  - [ ] `getByTestId` → `getByRole`, `getByText` への置き換え
  - [ ] 内部状態の直接検証 → 外部から観測可能な振る舞いの検証
- [ ] 不要なスナップショットテストの削除
- [ ] テスト内のロジック（条件分岐・ループ）の排除

**テスト**:
- [ ] 全テストパス確認

### R5-3: ドメイン層の網羅的テスト

- [ ] Value Object テスト（不変性・等値比較・演算）
  - [ ] Vector テスト
  - [ ] FieldConfig テスト
  - [ ] AiBehaviorConfig テスト
- [ ] エンティティテスト（状態遷移・不変条件）
  - [ ] Puck テスト（作成・速度適用・摩擦・反射・ゴール判定）
  - [ ] Mallet テスト（作成・移動・自陣制限）
  - [ ] GameState テスト（作成・フレーム更新・フェーズ遷移・スコア判定）
- [ ] ドメインサービステスト
  - [ ] Physics テスト（衝突判定・反射・壁バウンス・摩擦）
  - [ ] AI テスト（ターゲット計算・行動設定別テスト）
  - [ ] ItemEffect テスト（各 Strategy の個別テスト）
- [ ] カバレッジ確認: ドメイン層 90% 以上

### R5-4: インフラ層のテスト

- [ ] ストレージアダプターテスト
  - [ ] 正常系: 各データ型の保存・読込
  - [ ] 異常系: JSON 破損時のフォールバック
  - [ ] 異常系: localStorage 容量超過時の動作
- [ ] オーディオアダプターテスト
  - [ ] NullAudioAdapter の呼び出し記録テスト
- [ ] レンダラーテスト
  - [ ] Canvas API 呼び出しの検証（各サブレンダラー）

### R5-5: ドメイン統合テスト（ゲームフロー検証）

> ゲームループを純粋関数として複数フレーム実行し、ドメインレベルでの正しさを検証する。
> Canvas や Audio の副作用なしにゲーム全体のフローを高速に検証可能。

- [ ] `__tests__/integration/game-flow.test.ts`: ゲームフロー統合テスト
  - [ ] パックがプレイヤー側ゴールに入るとCPUにスコアが加算される
  - [ ] パックがCPU側ゴールに入るとプレイヤーにスコアが加算される
  - [ ] ゴール後にパックが中央にリセットされる
  - [ ] マレットとパックが衝突するとパックが反射する
  - [ ] 壁に衝突するとパックが反射し WALL_BOUNCE イベントが発行される
  - [ ] 衝突時の速度に応じた COLLISION イベントが発行される
  - [ ] 勝利スコアに達するとフェーズが finished に遷移する
- [ ] `__tests__/integration/item-lifecycle.test.ts`: アイテムライフサイクル統合テスト
  - [ ] Split アイテム取得でパックが3つに分裂する
  - [ ] Speed エフェクトは8秒後に自動解除される
  - [ ] Invisible エフェクトは指定ヒット数で解除される
  - [ ] Shield は1回の失点で消費される
  - [ ] Magnet は5秒間パックを吸引する
  - [ ] Big エフェクトは8秒後に自動解除される
  - [ ] 複数パック（Split 後）の同時ゴールが正しく処理される
- [ ] `__tests__/integration/combo-fever.test.ts`: コンボ・フィーバー統合テスト
  - [ ] 連続ヒットでコンボカウントが増加する
  - [ ] コンボ閾値到達でフィーバーが発動する
  - [ ] フィーバー中のエフェクトが正しく適用される
- [ ] `__tests__/integration/obstacle.test.ts`: 障害物ライフサイクル統合テスト
  - [ ] パックが障害物に衝突するとHP が減少する
  - [ ] HP が0になると障害物が破壊される
  - [ ] 破壊された障害物がリスポーン時間後に復活する

### R5-6: ユースケース結合テスト（クロスモジュール検証）

> ユースケース層を通してストレージ・ドメインロジックが正しく連携することを検証する。
> InMemoryStorage を注入するため、localStorage に依存せず高速に実行可能。

- [ ] `__tests__/use-case/story-flow.test.ts`: ストーリーモード全フロー
  - [ ] ステージ 1-1 → 1-2 → 1-3 を順にクリアし全キャラアンロック
  - [ ] 敗北してもストーリー進行は保存されない
  - [ ] ストーリーリセットで全進行がクリアされる
  - [ ] ストーリー進行がストレージに正しく永続化される
- [ ] `__tests__/use-case/free-battle-flow.test.ts`: フリー対戦フロー
  - [ ] フリー対戦完了でスコアが保存される
  - [ ] ハイスコア更新時に正しく記録される
  - [ ] 実績条件を満たした場合に実績が解除される
  - [ ] フィールド・アイテムアンロック条件判定が連鎖する
- [ ] `__tests__/use-case/daily-challenge-flow.test.ts`: デイリーチャレンジフロー
  - [ ] 今日のチャレンジが日付ベースで一意に生成される
  - [ ] チャレンジ完了結果が保存される
  - [ ] 同日に再度アクセスすると同じチャレンジが返される
- [ ] `__tests__/use-case/unlock-chain.test.ts`: アンロック連鎖フロー
  - [ ] ステージクリア → キャラアンロック → 図鑑通知 → 既読処理の連鎖
  - [ ] フリー対戦勝利 → フィールドアンロック → 設定画面に反映の連鎖
  - [ ] 実績解除 → アイテムアンロックの連鎖
- [ ] `__tests__/use-case/achievement-chain.test.ts`: 実績連鎖フロー
  - [ ] 初勝利実績の判定
  - [ ] 連勝実績の判定
  - [ ] 最高速度実績の判定
  - [ ] 全実績の条件網羅テスト

---

## 各フェーズの共通完了条件

各フェーズ完了時に以下をすべて確認:

- [ ] `npm test` で全テストパス
- [ ] `tsc --noEmit` で型エラーなし
- [ ] `npm run lint:ci` で ESLint エラーなし
- [ ] `npm run build` でビルド成功
- [ ] レイヤー依存方向の確認（domain ← application ← infrastructure/presentation）
- [ ] domain 層に外部依存（React, localStorage, Canvas API）が含まれていないこと
