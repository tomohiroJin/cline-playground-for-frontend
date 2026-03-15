# 迷宮の残響 大規模リファクタリング — タスクチェックリスト

## 凡例

- **I**: 実施タスク (Implementation)
- **V**: 検証タスク (Verification)
- **前提**: そのタスクを開始するために必要な先行タスク
- **受入条件**: タスク完了と判断するための条件

---

## Phase 0: 準備（テスト基盤強化）

### I-0.1: テストヘルパーの整備

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/helpers/factories.ts` (新規)
- **前提**: なし
- **作業内容**:
  - テスト用ファクトリ関数の作成
    - `createTestPlayer(overrides?)`: Player オブジェクト生成
    - `createTestMeta(overrides?)`: MetaState オブジェクト生成
    - `createTestEvent(overrides?)`: GameEvent オブジェクト生成
    - `createTestFx(overrides?)`: FxState オブジェクト生成
    - `createTestDifficulty(overrides?)`: DifficultyDef オブジェクト生成
    - `createTestOutcome(overrides?)`: Outcome オブジェクト生成
  - 既存テストで使用されるモック（localStorage 等）の共通化
- **受入条件**:
  - [x] ファクトリ関数が TypeScript コンパイルに通る
  - [x] 各ファクトリが型安全にデフォルト値を提供する
  - [x] overrides パラメータで部分的な上書きが可能

### I-0.2: 既存単体テストの AAA パターンリファクタリング

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/*.test.ts(x)`
- **前提**: I-0.1
- **作業内容**:
  - 既存テストファイルの棚卸し（9 ファイル）
  - 各テストを AAA パターン（Arrange / Act / Assert）に統一
  - テスト用ファクトリ関数への置き換え
  - テスト名を日本語の「何をしたら何が起きるか」形式に統一
  - `describe / it` の階層を「正常系 / 異常系 / 境界値」に整理
- **受入条件**:
  - [x] 全既存テストが AAA パターンに従っている
  - [x] テスト用ファクトリ関数が使用されている
  - [x] 全テストがパスする（振る舞いの変更なし）

### I-0.3: テストカバレッジの現状計測

- **対象**: labyrinth-echo 全体
- **前提**: I-0.2
- **作業内容**:
  - `npm run test:coverage` で現状のカバレッジを計測
  - ファイル別のカバレッジレポートを記録
  - カバレッジが低いファイルを特定し、Phase 5 でのテスト追加計画に反映
- **受入条件**:
  - [x] ファイル別のカバレッジレポートが出力される（`.docs/LE-20260315-01/coverage-baseline.md`）
  - [x] カバレッジ目標との差分が明確

### I-0.4: E2E テスト基盤の構築

- **対象ファイル**: `e2e/labyrinth-echo/` (新規ディレクトリ)
- **前提**: なし
- **作業内容**:
  - `e2e/labyrinth-echo/helpers/le-page.ts` に Page Object Model を実装
    - 基本的なナビゲーション操作（goto, startGame, selectDifficulty）を実装
    - `injectSeededRng(seed)` メソッドを実装（`window.__LE_TEST_RNG__` に seed 固定乱数を注入）
  - `e2e/labyrinth-echo/helpers/seed-registry.ts` を作成
    - テスト用 seed 定数を定義（SEED_BASIC_FLOW, SEED_GAME_OVER, SEED_ENDING 等）
    - 各 seed で期待されるイベント列をコメントで記録
  - `e2e/labyrinth-echo/basic-flow.spec.ts` に最小限のスモークテストを作成
    - タイトル画面の表示確認
    - ゲーム開始フローの確認（seed 注入なし — UI 操作のみ）
- **受入条件**:
  - [ ] `npm run test:e2e` でスモークテストが通る（※ dev server 起動が必要なため CI 環境で検証）
  - [x] Page Object Model が基本操作 + `injectSeededRng` をカバー
  - [x] Playwright 設定が labyrinth-echo テストを認識する

### V-0.5: Phase 0 検証

- **前提**: I-0.1 〜 I-0.4
- **作業内容**:
  - 全既存テストがパスすることを確認
  - E2E スモークテストがパスすることを確認
  - `npm run ci` が成功することを確認
- **受入条件**:
  - [x] `npm test` 全テストパス（341スイート、4414テスト合格）
  - [ ] `npm run test:e2e` パス（※ dev server 起動が必要なため CI 環境で検証）
  - [x] `npm run ci` パス（lint + typecheck + test + build 全成功）

---

## Phase 1: ドメイン層の抽出

### I-1.1: ドメインディレクトリ構造の作成

- **対象**: `src/features/labyrinth-echo/domain/` (新規)
- **前提**: V-0.5
- **作業内容**:
  - ディレクトリ構造を作成:
    ```
    domain/
    ├── models/
    ├── events/
    ├── services/
    ├── contracts/
    └── constants/
    ```
  - `domain/contracts/invariants.ts` に `invariant` 関数を移動
  - barrel export（`domain/index.ts`）を作成
- **受入条件**:
  - [x] ディレクトリ構造が計画通り作成されている
  - [x] `invariant` 関数が新しい場所からエクスポートされている
  - [x] TypeScript コンパイルが通る

### I-1.2: 型定義の統合・刷新

- **対象ファイル**: `src/features/labyrinth-echo/domain/models/*.ts` (新規)
- **前提**: I-1.1
- **作業内容**:
  - `types.ts` と `game-logic.ts` の型定義を `domain/models/` に統合
  - 以下のモデルファイルを作成:
    - `player.ts`: Player, StatusEffectId
    - `difficulty.ts`: DifficultyId, DifficultyDef, DifficultyModifiers, DifficultyRewards
    - `meta-state.ts`: MetaState, LastRunInfo
    - `status-effect.ts`: StatusEffectDef, StatusEffectVisual, StatusEffectTick
    - `unlock.ts`: UnlockDef, UnlockCategory, FxState, UnlockEffectKey
    - `ending.ts`: EndingDef
    - `game-state.ts`: GamePhase (Discriminated Union), GameState, DeathCause, MenuScreen, LogEntry
  - `any` 型を全廃:
    - `GameEvent = any` → 具体的な型定義
    - `lastRun: any` → `LastRunInfo | null`
  - `eslint-disable @typescript-eslint/no-explicit-any` を除去
  - 省略命名を明確化（`st` → `statuses`, `sub` → `subtitle` 等）
- **受入条件**:
  - [x] `any` 型が domain 層に存在しない
  - [x] `eslint-disable` が domain 層に存在しない
  - [x] 全モデルファイルが TypeScript コンパイルに通る
  - [x] 既存テストに影響がない（旧ファイルからの re-export で互換性維持）

### I-1.3: 型定義のテスト作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/domain/models/*.test.ts` (新規)
- **前提**: I-1.2
- **作業内容**:
  - 値オブジェクトのファクトリ関数テスト
  - 不変条件（DbC アサーション）の検証テスト
  - 境界値テスト（HP=0, MN=maxMn 等）
- **受入条件**:
  - [x] 全モデルのファクトリ関数がテストされている
  - [x] 不変条件違反時のエラーがテストされている
  - [x] カバレッジ 90% 以上

### I-1.4: 条件評価システムの刷新

- **対象ファイル**: `src/features/labyrinth-echo/domain/events/condition.ts` (新規)
- **前提**: I-1.2
- **作業内容**:
  - `Condition` Discriminated Union 型を定義
  - `evaluateCondition` 純粋関数を実装
  - `parseCondition` 移行関数を実装（旧文字列形式 → 新型付き形式）
  - `evalCond` との後方互換ラッパーを提供
- **受入条件**:
  - [x] 新しい条件型で全既存条件パターンを表現可能
  - [x] `parseCondition` が全既存条件文字列を正しくパースする
  - [x] 既存の `evalCond` 呼び出しが互換ラッパー経由で動作する
  - [x] TypeScript の網羅性チェック（exhaustive switch）が有効

### I-1.5: 条件評価テストの作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/domain/events/condition.test.ts` (新規)
- **前提**: I-1.4
- **作業内容**:
  - `parseCondition` の全パターンテスト
  - `evaluateCondition` の正常系・異常系・境界値テスト
  - FX 効果（dangerSense, negotiator, mentalSense）適用時のテスト
- **受入条件**:
  - [x] 全条件パターンがテストされている
  - [x] FX 効果の条件緩和がテストされている
  - [x] 不正な条件文字列でエラーが投げられることがテストされている
  - [x] カバレッジ 90% 以上

### I-1.6: ドメイン定数の再編

- **対象ファイル**: `src/features/labyrinth-echo/domain/constants/*.ts` (新規)
- **前提**: I-1.2
- **作業内容**:
  - `config.ts`: `CFG` を移動
  - `floor-meta.ts`: `FLOOR_META` を移動
  - `difficulty-defs.ts`: `DIFFICULTY` を移動（新しい型に合わせてリファクタリング）
  - `unlock-defs.ts`: `UNLOCKS`, `UNLOCK_CATS` を移動
  - `ending-defs.ts`: `ENDINGS` を移動
  - `title-defs.ts`: `TITLES` を移動
  - `status-effect-defs.ts`: `STATUS_META` を移動
  - `FRESH_META`, `DEATH_FLAVORS`, `DEATH_TIPS` を適切なファイルに配置
  - barrel export を作成
- **受入条件**:
  - [x] 全定数が `domain/constants/` に移動されている
  - [x] 新しい型定義と整合している
  - [x] 旧ファイルからの re-export で互換性維持
  - [x] TypeScript コンパイルが通る

### I-1.7: ドメインサービスの抽出

- **対象ファイル**: `src/features/labyrinth-echo/domain/services/*.ts` (新規)
- **前提**: I-1.2, I-1.4, I-1.6
- **作業内容**:
  - `combat-service.ts`:
    - `applyModifiers` を移動・リファクタリング
    - `applyToPlayer` → `applyChangesToPlayer` にリネーム・リファクタリング
    - `computeDrain` を移動
    - `classifyImpact` を移動
    - `checkSecondLife` を新規作成
  - `unlock-service.ts`:
    - `computeFx` を移動
    - `createPlayer` を移動
    - `canPurchaseUnlock` を新規作成
    - `checkAutoUnlocks` を新規作成
  - `ending-service.ts`:
    - `determineEnding` を移動
    - `getDeathFlavor` を新規作成（DEATH_FLAVORS のロジックを関数化）
    - `getDeathTip` を新規作成（DEATH_TIPS のロジックを関数化）
  - `title-service.ts`:
    - `getUnlockedTitles` を移動
    - `getActiveTitle` を移動
  - 全サービス関数に DbC アサーション（事前条件・事後条件）を追加
- **受入条件**:
  - [x] 全ドメインサービスが純粋関数で実装されている
  - [x] DbC アサーションが事前条件・事後条件に設定されている
  - [x] 旧 `game-logic.ts` からの re-export で互換性維持
  - [x] TypeScript コンパイルが通る

### I-1.8: ドメインサービスのテスト作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/domain/services/*.test.ts` (新規)
- **前提**: I-1.7
- **作業内容**:
  - `combat-service.test.ts`:
    - 正常系: ダメージ計算、回復計算、ドレイン計算
    - FX 効果: healMult, hpReduce, mnReduce, bleedReduce, drainImmune
    - 難易度修正: dmgMult 適用
    - 状態異常: 呪いによる情報値半減
    - 境界値: HP=0, MN=0, 変更値=0
  - `unlock-service.test.ts`:
    - computeFx: 加算・乗算・ブール効果の集約
    - createPlayer: 初期ステータス計算
    - canPurchaseUnlock: 購入可否判定
    - checkAutoUnlocks: 自動解放判定
  - `ending-service.test.ts`:
    - 全11エンディングの判定テスト
    - 優先度順序のテスト
  - `title-service.test.ts`:
    - 称号解放条件のテスト
    - アクティブ称号の取得テスト
- **受入条件**:
  - [x] 全ドメインサービスのテストが作成されている
  - [x] 正常系・異常系・境界値がカバーされている
  - [x] カバレッジ 90% 以上

### I-1.9: 乱数ソースの抽象化

- **対象ファイル**: `src/features/labyrinth-echo/domain/events/random.ts` (新規)
- **前提**: I-1.2
- **作業内容**:
  - `RandomSource` インターフェースを定義（`random(): number`）
  - `DefaultRandomSource` を実装（`Math.random` ラッパー）
  - `SeededRandomSource` を実装（xorshift32 アルゴリズム、seed 固定で決定論的乱数）
  - `shuffleWith<T>(array, rng)` を実装（乱数注入可能な shuffle）
  - 既存の `shuffle` はデフォルト引数版として維持（後方互換）
- **受入条件**:
  - [x] `SeededRandomSource` が同一 seed で同一の乱数列を返す
  - [x] `shuffleWith` が `RandomSource` を受け取り、決定論的にシャッフル可能
  - [x] 既存の `shuffle` 呼び出しが互換で動作する
  - [x] TypeScript コンパイルが通る

### I-1.10: 乱数ソースのテスト作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/domain/events/random.test.ts` (新規)
- **前提**: I-1.9
- **作業内容**:
  - `SeededRandomSource`:
    - 同一 seed で同一の乱数列が返ることのテスト
    - 異なる seed で異なる乱数列が返ることのテスト
    - 生成値が 0 以上 1 未満であることのテスト
  - `shuffleWith`:
    - 固定 seed で同一の結果が返ることのテスト
    - 全要素が保持されることのテスト（要素の欠落・重複なし）
    - 空配列・1 要素配列の境界値テスト
- **受入条件**:
  - [x] 決定論的テストが全パス
  - [x] カバレッジ 95% 以上

### I-1.11: イベントドメインの整理（乱数注入対応）

- **対象ファイル**: `src/features/labyrinth-echo/domain/events/*.ts` (新規)
- **前提**: I-1.2, I-1.4, I-1.9
- **作業内容**:
  - `game-event.ts`: GameEvent インターフェースを新しい型定義で再定義
  - `outcome.ts`: Outcome, Choice の型定義
  - `event-selector.ts`: `pickEvent`, `findChainEvent` を移動
    - `pickEvent` に `RandomSource` パラメータを追加（デフォルト: `DefaultRandomSource`）
    - 内部の `shuffle` を `shuffleWith(weighted, rng)` に置換
  - `event-utils.ts` から `processChoice` を移動（ただし副作用分離後）
  - `validateEvents` を移動
- **受入条件**:
  - [x] イベント関連の型定義が domain 層に統合されている
  - [x] `pickEvent` が `RandomSource` を受け取り、決定論的テストが可能
  - [x] `RandomSource` を渡さない場合は `Math.random` を使用（後方互換）
  - [x] 旧ファイルからの re-export で互換性維持

### I-1.12: イベント選択の決定論的テスト作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/domain/events/event-selector.test.ts` (新規)
- **前提**: I-1.11
- **作業内容**:
  - `pickEvent` に `SeededRandomSource` を注入した決定論的テスト:
    - 同一 seed + 同一プール → 毎回同じイベントが選出されることのテスト
    - フロア・使用済み ID によるフィルタリングのテスト
    - chainOnly イベントが除外されることのテスト
    - metaCond によるフィルタリングのテスト
    - chainBoost による重み増加のテスト
    - 安息イベントの重み増加のテスト
    - プール空時の null 返却テスト
- **受入条件**:
  - [x] 全テストが決定論的（毎回同じ結果）
  - [x] フレーキーテストがゼロ
  - [x] カバレッジ 90% 以上

### V-1.13: Phase 1 検証

- **前提**: I-1.1 〜 I-1.12
- **作業内容**:
  - domain 層の全テストが通ることを確認
  - 既存テストが全てパスすることを確認（互換性）
  - `npm run ci` が成功することを確認
  - domain 層に副作用がないことをコードレビュー
  - `any` 型と `eslint-disable` が domain 層に存在しないことを確認
- **受入条件**:
  - [x] domain 層テスト全パス（10スイート、149テスト）
  - [x] 既存テスト全パス（351スイート、4563テスト）
  - [x] `npm run ci` パス（lint + typecheck + test + build 全成功）
  - [x] domain 層に副作用なし（コードレビュー実施済み）
  - [x] domain 層に `any` なし（grep確認済み）

---

## Phase 2: アプリケーション層の構築

### I-2.1: ポートインターフェースの定義

- **対象ファイル**: `src/features/labyrinth-echo/application/ports/*.ts` (新規)
- **前提**: V-1.13
- **作業内容**:
  - `storage-port.ts`:
    - `StoragePort` インターフェース定義
    - メソッド: saveMeta, loadMeta, resetMeta, saveAudioSettings, loadAudioSettings
  - `audio-port.ts`:
    - `AudioPort` インターフェース定義
    - `SfxType` 型定義
    - `EventMood` 型定義
    - メソッド: initialize, playSfx, startBgm, stopBgm, setMood, updateCrisis, setVolume
  - `random-port.ts`:
    - `RandomPort` インターフェース定義（`random(): number`）
    - ※ 実装は `domain/events/random.ts` の `DefaultRandomSource` / `SeededRandomSource` を使用
- **受入条件**:
  - [x] インターフェースが domain 層の型のみに依存している
  - [x] infrastructure 層への依存がない（DIP）
  - [x] `RandomPort` が定義されている
  - [x] TypeScript コンパイルが通る

### I-2.2: ユースケースの実装

- **対象ファイル**: `src/features/labyrinth-echo/application/use-cases/*.ts` (新規)
- **前提**: I-2.1
- **作業内容**:
  - `start-run.ts`:
    - `startRun(input: StartRunInput): StartRunOutput` を実装
    - FX 集約 → プレイヤー生成 → 状態初期化 → メタ更新
  - `process-choice.ts`:
    - `processChoice(input: ProcessChoiceInput): ProcessChoiceOutput` を実装
    - 選択解決 → 修正値計算 → 状態更新 → ドレイン → 死亡/脱出判定
    - `ChoiceFeedback` を生成（副作用は含まない）
  - `proceed-step.ts`:
    - `proceedStep(input: ProceedStepInput): ProceedStepOutput` を実装
    - 入力に `RandomPort` を含め、`pickEvent` に注入
    - 次イベント選出 → フロア遷移判定 → ボス判定
  - `manage-unlocks.ts`:
    - `purchaseUnlock(input: PurchaseUnlockInput): PurchaseUnlockOutput` を実装
    - 購入可否判定 → KP 減算 → アンロック追加
  - 全ユースケースを純粋関数として実装
- **受入条件**:
  - [x] 全ユースケースが純粋関数で実装されている
  - [x] ポートインターフェースにのみ依存している
  - [x] 入出力の型が明確に定義されている
  - [x] TypeScript コンパイルが通る

### I-2.3: ユースケースのテスト作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/application/use-cases/*.test.ts` (新規)
- **前提**: I-2.2
- **作業内容**:
  - `start-run.test.ts`:
    - 難易度ごとの初期ステータス計算
    - FX 効果の適用
    - メタデータの runs インクリメント
  - `process-choice.test.ts`:
    - 通常選択の結果計算
    - 死亡判定（HP=0, MN=0）
    - 脱出判定（escape フラグ）
    - SecondLife 発動
    - チェインイベント発火
    - ChoiceFeedback の正確性
  - `proceed-step.test.ts`:
    - 通常の次イベント選出
    - フロア遷移
    - ボス遭遇
    - イベント枯渇時のフォールバック
  - `manage-unlocks.test.ts`:
    - 正常購入
    - KP 不足時の拒否
    - 既購入アイテムの拒否
    - ゲート制限の検証
- **受入条件**:
  - [x] 全ユースケースのテストが作成されている
  - [x] 正常系・異常系・境界値がカバーされている
  - [x] カバレッジ 85% 以上

### V-2.4: Phase 2 検証

- **前提**: I-2.1 〜 I-2.3
- **作業内容**:
  - application 層の全テストが通ることを確認
  - 既存テストが全てパスすることを確認
  - `npm run ci` が成功することを確認
- **受入条件**:
  - [x] application 層テスト全パス（4スイート、38テスト）
  - [x] 既存テスト全パス（356スイート、4608テスト）
  - [x] `npm run ci` パス（lint + typecheck + test + build 全成功）

---

## Phase 3: インフラ層の分離

### I-3.1: LocalStorageAdapter の実装

- **対象ファイル**: `src/features/labyrinth-echo/infrastructure/storage/local-storage-adapter.ts` (新規)
- **前提**: V-2.4
- **作業内容**:
  - `LocalStorageAdapter` クラスが `StoragePort` を実装
  - キー定数の一元管理（`SAVE_KEY`, `AUDIO_SETTINGS_KEY`）
  - `safeAsync` の一元化（`contracts.tsx` と `storage.ts` の統合）
  - `loadMeta` にスキーマバリデーションを追加
  - 旧 `storage.ts` の `Storage` オブジェクトから新アダプターへの委譲
- **受入条件**:
  - [ ] `StoragePort` インターフェースを完全に実装している
  - [ ] エラーハンドリングが統一されている
  - [ ] キー定数が一元管理されている
  - [ ] 旧 `Storage` オブジェクトとの互換性が維持されている

### I-3.2: LocalStorageAdapter のテスト作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/infrastructure/local-storage-adapter.test.ts` (新規)
- **前提**: I-3.1
- **作業内容**:
  - 正常系: save → load の往復テスト
  - 異常系: localStorage 利用不可時のフォールバック
  - 異常系: 破損データの読み込み時のフォールバック
  - リセット: データ初期化の検証
  - オーディオ設定: save/load の往復テスト
- **受入条件**:
  - [ ] localStorage のモックを使用したテスト
  - [ ] エラーケースが網羅されている
  - [ ] カバレッジ 80% 以上

### I-3.3: AudioAdapter の実装

- **対象ファイル**: `src/features/labyrinth-echo/infrastructure/audio/audio-adapter.ts` (新規)
- **前提**: V-2.4
- **作業内容**:
  - `AudioAdapter` クラスが `AudioPort` を実装
  - `SfxType` から `AudioEngine.sfx.*` メソッドへのマッピング
  - 音声無効時のスキップ処理
  - `NullAudioAdapter`（テスト用ノーオプ実装）の作成
- **受入条件**:
  - [ ] `AudioPort` インターフェースを完全に実装している
  - [ ] 全 SfxType が対応する効果音メソッドにマッピングされている
  - [ ] NullAudioAdapter がテストで使用可能

### I-3.4: AudioAdapter のテスト作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/infrastructure/audio-adapter.test.ts` (新規)
- **前提**: I-3.3
- **作業内容**:
  - AudioEngine のモックを使用したテスト
  - 全 SfxType のマッピング検証
  - 音声無効時のスキップ検証
  - NullAudioAdapter の動作検証
- **受入条件**:
  - [ ] AudioEngine がモック化されている
  - [ ] カバレッジ 80% 以上

### V-3.5: Phase 3 検証

- **前提**: I-3.1 〜 I-3.4
- **作業内容**:
  - infrastructure 層の全テストが通ることを確認
  - 既存テストが全てパスすることを確認
  - `npm run ci` が成功することを確認
- **受入条件**:
  - [ ] infrastructure 層テスト全パス
  - [ ] 既存テスト全パス
  - [ ] `npm run ci` パス

---

## Phase 4: プレゼンテーション層のリファクタリング

### I-4.1: GameReducer の実装

- **対象ファイル**: `src/features/labyrinth-echo/presentation/hooks/use-game-orchestrator.ts` (新規)
- **前提**: V-3.5
- **作業内容**:
  - `GameAction` Discriminated Union 型を定義
  - `gameReducer` 純粋関数を実装
  - `useGameOrchestrator` フックを実装:
    - `useReducer(gameReducer, initialState)`
    - ユースケース関数の呼び出しをアクションにマッピング
    - 副作用を `useEffect` で分離
  - `GameContext` を作成し、状態とディスパッチを提供
- **受入条件**:
  - [ ] 20+ の `useState` が `useReducer` に統合されている
  - [ ] Reducer が純粋関数で副作用を含まない
  - [ ] GameAction の全アクションが処理されている
  - [ ] TypeScript コンパイルが通る

### I-4.2: GameReducer のテスト作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/presentation/hooks/use-game-orchestrator.test.ts` (新規)
- **前提**: I-4.1
- **作業内容**:
  - 全 GameAction の状態遷移テスト
  - フェーズ遷移の正確性テスト
  - 不正なアクションの処理テスト
- **受入条件**:
  - [ ] 全アクションの状態遷移がテストされている
  - [ ] カバレッジ 80% 以上

### I-4.3: 副作用フックの分離

- **対象ファイル**: `src/features/labyrinth-echo/presentation/hooks/*.ts` (新規・移動)
- **前提**: I-4.1
- **作業内容**:
  - `use-audio-effects.ts`:
    - `ChoiceFeedback` に応じた音声再生を実装
    - フェーズ変更時の BGM 制御
    - 危機状態の音響更新
  - `use-persistence-sync.ts`:
    - MetaState 変更時の自動保存
    - 初期ロード処理
  - `use-text-reveal.ts`: 既存フックを移動・リファクタリング
  - `use-visual-fx.ts`: 既存フックを移動
  - `use-keyboard-control.ts`: 既存フックを移動
  - `use-image-preload.ts`: 既存フックを移動
  - `eslint-disable react-hooks/exhaustive-deps` の除去（依存配列の修正）
- **受入条件**:
  - [ ] 各フックが 1 フック 1 責務を満たしている
  - [ ] `eslint-disable` が除去されている
  - [ ] 全フックがクリーンアップを適切に実行している

### I-4.4: 副作用フックのテスト作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/presentation/hooks/*.test.ts` (新規)
- **前提**: I-4.3
- **作業内容**:
  - `use-text-reveal.test.ts`:
    - テキスト逐次表示の進行テスト
    - スキップ機能のテスト
    - クリーンアップのテスト
  - `use-visual-fx.test.ts`:
    - シェイク効果のタイマーテスト
    - オーバーレイのタイマーテスト
  - `use-audio-effects.test.ts`:
    - ChoiceFeedback に応じた音声再生テスト（モック使用）
  - `use-persistence-sync.test.ts`:
    - 自動保存のテスト（モック使用）
- **受入条件**:
  - [ ] 全フックのテストが作成されている
  - [ ] タイマー・非同期処理が適切にテストされている
  - [ ] カバレッジ 75% 以上

### I-4.5: コンポーネントの整理

- **対象ファイル**: `src/features/labyrinth-echo/presentation/components/` (移動・リファクタリング)
- **前提**: I-4.1
- **作業内容**:
  - ディレクトリ構造を作成:
    ```
    presentation/components/
    ├── screens/        # 画面コンポーネント
    ├── overlays/       # オーバーレイ
    └── shared/         # 共有部品
    ```
  - 既存コンポーネントを新ディレクトリに移動
  - `EventResultScreen.tsx`（19KB）を `EventScreen.tsx` + `ResultScreen.tsx` に分割
  - `GameComponents.tsx`（21KB）を個別コンポーネントに分割
  - Props を最小限に整理（Context 経由でのデータ取得に変更）
  - 各コンポーネントを 200 行以内に収める
- **受入条件**:
  - [ ] 全コンポーネントが 200 行以内
  - [ ] ディレクトリ構造が計画通り
  - [ ] 既存の表示・操作が維持されている

### I-4.6: LabyrinthEchoGame の薄いシェル化

- **対象ファイル**: `src/features/labyrinth-echo/presentation/LabyrinthEchoGame.tsx` (リファクタリング)
- **前提**: I-4.1, I-4.3, I-4.5
- **作業内容**:
  - `GameInner` の 350+ 行のロジックを `useGameOrchestrator` に移動
  - フェーズルーティングを `GameRouter` コンポーネントに分離
  - `LabyrinthEchoGame` を `ErrorBoundary` + `GameProvider` + `GameRouter` のみに
  - 旧 `LabyrinthEchoGame.tsx` の互換性を維持（同一エクスポート）
- **受入条件**:
  - [ ] `LabyrinthEchoGame.tsx` が 50 行以内
  - [ ] ゲームの全機能が動作する（手動確認）
  - [ ] 既存テストがパスする

### I-4.7: コンポーネントのテスト作成

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/presentation/components/*.test.tsx` (新規)
- **前提**: I-4.5, I-4.6
- **作業内容**:
  - 既存のコンポーネントテストをリファクタリング
  - 新しいコンポーネント構造に合わせてテストを更新
  - `GameRouter` のフェーズ切り替えテスト
  - Testing Library の `getByRole`, `getByText` を優先使用
- **受入条件**:
  - [ ] 全画面コンポーネントのレンダリングテストが存在する
  - [ ] ユーザー操作のテストが含まれている
  - [ ] カバレッジ 70% 以上

### V-4.8: Phase 4 検証

- **前提**: I-4.1 〜 I-4.7
- **作業内容**:
  - 全テストが通ることを確認
  - ゲームの全機能を手動で確認
  - `npm run ci` が成功することを確認
  - パフォーマンスの劣化がないことを確認
- **受入条件**:
  - [ ] 全テストパス
  - [ ] `npm run ci` パス
  - [ ] 手動テストで機能退行なし

---

## Phase 5: テストリファクタリング・E2E テスト導入

### I-5.1: ドメイン層テストの拡充

- **対象ファイル**: `src/features/labyrinth-echo/__tests__/domain/**/*.test.ts`
- **前提**: V-4.8
- **作業内容**:
  - カバレッジギャップの埋め合わせ
  - エッジケースの追加（空配列、null、最大値、最小値）
  - プロパティベーステスト（可能であれば fast-check 導入）
- **受入条件**:
  - [ ] domain 層カバレッジ 90% 以上
  - [ ] エッジケースが網羅されている

### I-5.2: E2E テスト — 基本フロー（seed 固定）

- **対象ファイル**: `e2e/labyrinth-echo/basic-flow.spec.ts` (拡充)
- **前提**: V-4.8
- **作業内容**:
  - `injectSeededRng(SEED_BASIC_FLOW)` で乱数を固定
  - タイトル画面 → 難易度選択 → フロア紹介 → イベント → 結果 → 次イベント のフロー
  - seed により確定したイベントが表示されることの検証
  - 各フェーズでの表示確認（フロア名、イベントテキスト、ステータス変化）
  - テキスト表示の完了待ち
  - **[Phase 0 レビュー指摘]** `page.waitForTimeout(2000)` を UI 要素の出現を `waitFor` で待つパターンに置き換え（フレーキーテスト防止）
  - **[Phase 0 レビュー指摘]** `le-page.ts` の `PHASE_MARKERS` を改善 — `event: '選択肢'` / `result: '先に進む'` は他画面でも出現する可能性があるため、`data-testid` ベースの検出や複合条件への変更を検討
- **受入条件**:
  - [ ] 基本フローが自動テストで通る
  - [ ] seed 固定により毎回同じ結果（フレーキーテストなし）
  - [ ] 各フェーズの主要要素が検証されている
  - [ ] `waitForTimeout` が除去されている（UI 要素の待機に置き換え）
  - [ ] PHASE_MARKERS のフェーズ検出が誤検出しないこと

### I-5.3: E2E テスト — ゲームオーバーフロー（seed 固定）

- **対象ファイル**: `e2e/labyrinth-echo/game-over.spec.ts` (新規)
- **前提**: I-5.2
- **作業内容**:
  - `injectSeededRng(SEED_GAME_OVER)` で致死イベント列を確定
  - 修羅難度でのゲームオーバーシナリオ（HP or MN が 0 になるイベント列を seed で保証）
  - ゲームオーバー画面の表示確認（死因テキスト）
  - KP の加算確認
  - タイトルへの帰還後の周回数・KP 更新確認
- **受入条件**:
  - [ ] ゲームオーバーフローが自動テストで通る
  - [ ] seed 固定により毎回同じ死因で死亡

### I-5.4: E2E テスト — エンディング到達（seed 固定）

- **対象ファイル**: `e2e/labyrinth-echo/ending.spec.ts` (新規)
- **前提**: I-5.2
- **作業内容**:
  - `injectSeededRng(SEED_ENDING)` でクリア可能なイベント列を確定
  - 探索者難度で全フロアを進行し、脱出イベントに到達
  - エンディング画面の表示確認（エンディング名・説明）
  - KP クリア報酬の加算確認
  - タイトルに戻った後の周回情報更新確認
- **受入条件**:
  - [ ] エンディング到達フローが自動テストで通る
  - [ ] seed 固定により毎回同じエンディング

### I-5.5: E2E テスト — データ永続化

- **対象ファイル**: `e2e/labyrinth-echo/persistence.spec.ts` (新規)
- **前提**: I-5.2
- **作業内容**:
  - `injectSeededRng(SEED_BASIC_FLOW)` でゲームプレイ → リロード → データ保持の確認
  - アンロック状態の永続化確認
  - リセット機能の確認（全データ初期化）
- **受入条件**:
  - [ ] リロード後にデータが保持されている
  - [ ] リセット後にデータが初期化されている

### I-5.6: E2E テスト — キーボードナビゲーション（seed 固定）

- **対象ファイル**: `e2e/labyrinth-echo/keyboard-nav.spec.ts` (新規)
- **前提**: I-5.2
- **作業内容**:
  - `injectSeededRng(SEED_BASIC_FLOW)` で乱数を固定
  - 全画面でのキーボード操作テスト
  - 数字キーによる選択肢選択
  - ↑↓ キーによるナビゲーション（ハイライト移動の確認）
  - Enter / Escape キーの動作確認
  - スペースキーによるテキストスキップ
- **受入条件**:
  - [ ] 全画面でキーボード操作が機能する

### I-5.7: E2E テスト — アンロックシステム（seed 固定）

- **対象ファイル**: `e2e/labyrinth-echo/unlock-system.spec.ts` (新規)
- **前提**: I-5.3
- **作業内容**:
  - `injectSeededRng(SEED_GAME_OVER)` で死亡 → KP 獲得
  - アンロック画面遷移 → 購入操作 → KP 残高確認
  - `injectSeededRng(SEED_BASIC_FLOW)` 再注入 → ゲーム開始
  - アンロック効果の適用確認（初期 HP 増加等）
  - 購入不可条件の確認（KP 不足、ゲート制限）
- **受入条件**:
  - [ ] アンロックフローが自動テストで通る
  - [ ] アンロック効果がゲームプレイに反映されている

### V-5.8: Phase 5 検証

- **前提**: I-5.1 〜 I-5.7
- **作業内容**:
  - 全テスト（単体 + E2E）が通ることを確認
  - E2E テストがフレーキーでないことを確認（3 回連続実行で全パス）
  - カバレッジ目標の達成確認
  - `npm run ci` が成功することを確認
- **受入条件**:
  - [ ] domain 層カバレッジ 90% 以上
  - [ ] application 層カバレッジ 85% 以上
  - [ ] 全体カバレッジ 70% 以上
  - [ ] E2E テスト 6 シナリオ以上がパス
  - [ ] E2E テスト 3 回連続パス（フレーキーネス検証）
  - [ ] `npm run ci` パス

---

## Phase 6: 統合・最適化

### I-6.1: 旧ファイルの互換層除去

- **対象ファイル**: 旧ファイル群（`types.ts`, `game-logic.ts`, `storage.ts` 等）
- **前提**: V-5.8
- **作業内容**:
  - 旧ファイルからの re-export を除去
  - 新しいパスへのインポートに全て書き換え
  - 旧ファイルを削除（不要になったもの）
  - 未使用エクスポートの除去
- **受入条件**:
  - [ ] 旧ファイルの re-export が全て除去されている
  - [ ] 全インポートが新パスを使用している
  - [ ] 未使用コードが除去されている

### I-6.2: safeAsync / safeSync の一元化

- **対象ファイル**: `contracts.tsx`, `storage.ts` 関連
- **前提**: I-6.1
- **作業内容**:
  - `safeAsync` / `safeSync` を `domain/contracts/invariants.ts` に一元化
  - `contracts.tsx` から `ErrorBoundary` のみ残し、他を削除
  - 全ファイルが一元化された関数を使用するよう更新
- **受入条件**:
  - [ ] `safeAsync` / `safeSync` の定義が 1 箇所のみ
  - [ ] 全呼び出し元が更新されている

### I-6.3: 数学ユーティリティの整理

- **対象ファイル**: `game-logic.ts` の re-export 関連
- **前提**: I-6.1
- **作業内容**:
  - `clamp`, `shuffle`, `randomInt` の re-export を除去
  - 全呼び出し元が `utils/math-utils.ts` から直接インポートするよう更新
- **受入条件**:
  - [ ] 数学関数の定義が 1 箇所のみ（`utils/math-utils.ts`）
  - [ ] re-export が全て除去されている

### I-6.4: バンドルサイズの確認

- **対象**: ビルド出力
- **前提**: I-6.1 〜 I-6.3
- **作業内容**:
  - リファクタリング前後のバンドルサイズを比較
  - 不要なコードが含まれていないことを確認
  - Tree shaking が正しく機能していることを確認
- **受入条件**:
  - [ ] バンドルサイズがリファクタリング前と同等以下
  - [ ] 不要なコードが含まれていない

### V-6.5: Phase 6 最終検証

- **前提**: I-6.1 〜 I-6.4
- **作業内容**:
  - 全テスト（単体 + E2E）が通ることを確認
  - `npm run ci` が成功することを確認
  - ゲームの全機能を手動で確認
  - アーキテクチャの依存方向を確認（domain → application → infrastructure → presentation）
  - 最終カバレッジレポートの生成
- **受入条件**:
  - [ ] 全テストパス
  - [ ] `npm run ci` パス
  - [ ] 手動テストで機能退行なし
  - [ ] 依存方向が一方向（domain が他層に依存しない）
  - [ ] `any` 型ゼロ
  - [ ] `eslint-disable` ゼロ（labyrinth-echo 配下）
  - [ ] カバレッジ目標達成

---

## タスク依存関係図

```
Phase 0: 準備
  I-0.1 ─→ I-0.2 ─→ I-0.3
  I-0.4 ──────────────────── → V-0.5

Phase 1: ドメイン層
  I-1.1 ─→ I-1.2 ─→ I-1.3
                  ├→ I-1.4 ─→ I-1.5
                  ├→ I-1.6
                  ├→ I-1.7 ─→ I-1.8
                  └→ I-1.9 ─→ I-1.10
                         └→ I-1.11 ─→ I-1.12
                                            → V-1.13

Phase 2: アプリケーション層
  I-2.1 ─→ I-2.2 ─→ I-2.3 → V-2.4

Phase 3: インフラ層
  I-3.1 ─→ I-3.2
  I-3.3 ─→ I-3.4 → V-3.5

Phase 4: プレゼンテーション層
  I-4.1 ─→ I-4.2
       ├→ I-4.3 ─→ I-4.4
       └→ I-4.5 ─→ I-4.6 ─→ I-4.7 → V-4.8

Phase 5: テスト拡充・E2E
  I-5.1
  I-5.2 ─→ I-5.3 ─→ I-5.7
       ├→ I-5.4
       ├→ I-5.5
       └→ I-5.6 → V-5.8

Phase 6: 統合
  I-6.1 ─→ I-6.2
       └→ I-6.3
  I-6.4 → V-6.5
```

---

## 全タスク一覧（48 タスク）

| ID | Phase | 種別 | タスク名 | 前提 |
|----|-------|------|---------|------|
| I-0.1 | 0 | I | テストヘルパーの整備 | なし |
| I-0.2 | 0 | I | 既存テストの AAA パターンリファクタリング | I-0.1 |
| I-0.3 | 0 | I | テストカバレッジの現状計測 | I-0.2 |
| I-0.4 | 0 | I | E2E テスト基盤の構築（seed 注入対応） | なし |
| V-0.5 | 0 | V | Phase 0 検証 | I-0.1〜I-0.4 |
| I-1.1 | 1 | I | ドメインディレクトリ構造の作成 | V-0.5 |
| I-1.2 | 1 | I | 型定義の統合・刷新 | I-1.1 |
| I-1.3 | 1 | I | 型定義のテスト作成 | I-1.2 |
| I-1.4 | 1 | I | 条件評価システムの刷新 | I-1.2 |
| I-1.5 | 1 | I | 条件評価テストの作成 | I-1.4 |
| I-1.6 | 1 | I | ドメイン定数の再編 | I-1.2 |
| I-1.7 | 1 | I | ドメインサービスの抽出 | I-1.2, I-1.4, I-1.6 |
| I-1.8 | 1 | I | ドメインサービスのテスト作成 | I-1.7 |
| I-1.9 | 1 | I | 乱数ソースの抽象化 | I-1.2 |
| I-1.10 | 1 | I | 乱数ソースのテスト作成 | I-1.9 |
| I-1.11 | 1 | I | イベントドメインの整理（乱数注入対応） | I-1.2, I-1.4, I-1.9 |
| I-1.12 | 1 | I | イベント選択の決定論的テスト作成 | I-1.11 |
| V-1.13 | 1 | V | Phase 1 検証 | I-1.1〜I-1.12 |
| I-2.1 | 2 | I | ポートインターフェースの定義（RandomPort 含む） | V-1.13 |
| I-2.2 | 2 | I | ユースケースの実装（RandomPort 注入） | I-2.1 |
| I-2.3 | 2 | I | ユースケースのテスト作成 | I-2.2 |
| V-2.4 | 2 | V | Phase 2 検証 | I-2.1〜I-2.3 |
| I-3.1 | 3 | I | LocalStorageAdapter の実装 | V-2.4 |
| I-3.2 | 3 | I | LocalStorageAdapter のテスト作成 | I-3.1 |
| I-3.3 | 3 | I | AudioAdapter の実装 | V-2.4 |
| I-3.4 | 3 | I | AudioAdapter のテスト作成 | I-3.3 |
| V-3.5 | 3 | V | Phase 3 検証 | I-3.1〜I-3.4 |
| I-4.1 | 4 | I | GameReducer の実装 | V-3.5 |
| I-4.2 | 4 | I | GameReducer のテスト作成 | I-4.1 |
| I-4.3 | 4 | I | 副作用フックの分離 | I-4.1 |
| I-4.4 | 4 | I | 副作用フックのテスト作成 | I-4.3 |
| I-4.5 | 4 | I | コンポーネントの整理 | I-4.1 |
| I-4.6 | 4 | I | LabyrinthEchoGame の薄いシェル化 | I-4.1, I-4.3, I-4.5 |
| I-4.7 | 4 | I | コンポーネントのテスト作成 | I-4.5, I-4.6 |
| V-4.8 | 4 | V | Phase 4 検証 | I-4.1〜I-4.7 |
| I-5.1 | 5 | I | ドメイン層テストの拡充 | V-4.8 |
| I-5.2 | 5 | I | E2E テスト — 基本フロー（seed 固定） | V-4.8 |
| I-5.3 | 5 | I | E2E テスト — ゲームオーバーフロー（seed 固定） | I-5.2 |
| I-5.4 | 5 | I | E2E テスト — エンディング到達（seed 固定） | I-5.2 |
| I-5.5 | 5 | I | E2E テスト — データ永続化 | I-5.2 |
| I-5.6 | 5 | I | E2E テスト — キーボードナビゲーション（seed 固定） | I-5.2 |
| I-5.7 | 5 | I | E2E テスト — アンロックシステム（seed 固定） | I-5.3 |
| V-5.8 | 5 | V | Phase 5 検証（フレーキーネス検証含む） | I-5.1〜I-5.7 |
| I-6.1 | 6 | I | 旧ファイルの互換層除去 | V-5.8 |
| I-6.2 | 6 | I | safeAsync / safeSync の一元化 | I-6.1 |
| I-6.3 | 6 | I | 数学ユーティリティの整理 | I-6.1 |
| I-6.4 | 6 | I | バンドルサイズの確認 | I-6.1〜I-6.3 |
| V-6.5 | 6 | V | Phase 6 最終検証 | I-6.1〜I-6.4 |
