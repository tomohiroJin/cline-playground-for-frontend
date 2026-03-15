# Agile Quiz Sugoroku リファクタリング チェックリスト

> 各タスクは完了時にチェックを入れる。フェーズ完了条件: 全テストパス + typecheck パス

---

## フェーズ 0: 準備（安全網の構築）

### 0-1. 現状確認
- [x] `npm run ci`（lint + typecheck + test + build）が全パスすることを確認
- [x] テストカバレッジのベースラインを記録（`npm run test:coverage`）
- [x] 現在のファイル数・行数を記録

### 0-2. E2E テストスケルトン
- [x] `e2e/agile-quiz-sugoroku/` ディレクトリを作成
- [x] `e2e/helpers/aqs-helper.ts`（Page Object）のスケルトンを作成
- [x] `e2e/agile-quiz-sugoroku/smoke.spec.ts` を作成（タイトル画面表示のみ）
- [x] E2E テストがパスすることを確認

### 0-3. フェーズ 0 完了確認
- [x] `npm run ci` パス
- [x] `npm run test:e2e` パス（smoke テスト）
- [x] コミット作成

---

## フェーズ 1: 型定義の分割

### 1-1. ドメイン型ディレクトリの作成
- [x] `src/features/agile-quiz-sugoroku/domain/types/` ディレクトリを作成
- [x] `domain/types/game-types.ts` を作成（GamePhase, GameEvent, GameStats, SprintSummary, SaveState）
- [x] `domain/types/quiz-types.ts` を作成（Question, AnswerInput, AnswerResult, TagStats）
- [x] `domain/types/scoring-types.ts` を作成（Grade, DerivedStats, ClassifyStats, TeamType, SavedGameResult）
- [x] `domain/types/index.ts` を作成（全型を再エクスポート）

### 1-2. 後方互換の維持
- [x] 旧 `types.ts` を `domain/types/` からの再エクスポートに書き換え
- [x] 全テストがパスすることを確認

### 1-3. フェーズ 1 完了確認
- [x] `npm run ci` パス
- [x] 型の依存関係が正しいことを確認（domain 型に React import がない）
- [x] コミット作成

### 1-4. フェーズ 1 レビュー指摘事項（後続フェーズで対応）

> 以下はフェーズ1完了時のレビューで検出された改善提案。
> 現時点では修正不要だが、該当フェーズで忘れずに対応すること。

- [x] **scoring-types.ts の責務分割**（→ フェーズ 2 で対応済み）
  - `team-types.ts`（ClassifyStats, EngineerType, TeamType）、`achievement-types.ts`（実績型・ゲーム結果型・履歴型）、`scoring-types.ts`（スコアリング・難易度型）に分配
- [x] **game-types.ts → quiz-types.ts の依存方向の再検討**（→ フェーズ 2 で検討済み）
  - `SaveState` は game-types.ts に維持。quiz-types への依存は型レベルのみで許容
- [ ] **domain-types.test.ts のプレースホルダーテスト削除**（→ フェーズ 8 で対応）
  - 「domain 型に React import がないことの検証」テストが `expect(true).toBe(true)` のノーオペレーション
  - テストリファクタリング時に削除または実効性のある検証に置き換える

---

## フェーズ 2: ドメイン層の抽出

### 2-1. game サブドメイン
- [x] `domain/game/` ディレクトリを作成
- [x] `game-logic.ts` の `makeEvents` → `domain/game/event-generator.ts` に移動（`createEvents` に改名、`randomFn` 追加）
- [x] `game-logic.ts` の `createSprintSummary` → `domain/game/sprint.ts` に移動
- [x] 旧 `game-logic.ts` を再エクスポート用に維持
- [x] テストパス確認
- 注: `game-rules.ts`（CONFIG抽出）と `game-state.ts`（初期状態生成）はフェーズ6の定数分割で対応

### 2-2. quiz サブドメイン
- [x] `domain/quiz/` ディレクトリを作成
- [x] `game-logic.ts` の `pickQuestion` → `domain/quiz/question-picker.ts` に移動（`randomFn` 追加）
- [x] `answer-processor.ts` → `domain/quiz/answer-evaluator.ts` に移動
- [x] `combo-color.ts` → `domain/quiz/combo-calculator.ts` に移動
- [x] `tag-stats.ts` → `domain/quiz/tag-stats.ts` に移動
- [x] `study-question-pool.ts` → `domain/quiz/study-question-pool.ts` に移動（`shuffleArray` に `randomFn` 追加）
- [x] 旧ファイルを再エクスポート用に維持
- [x] テストパス確認

### 2-3. scoring サブドメイン
- [x] `domain/scoring/` ディレクトリを作成
- [x] `difficulty.ts` → `domain/scoring/difficulty.ts` に移動
- [x] テストパス確認
- 注: score-calculator, grade-classifier, debt-calculator はフェーズ6の constants.ts 分割で対応

### 2-4. team サブドメイン
- [x] `domain/team/` ディレクトリを作成
- [x] `engineer-classifier.ts` → `domain/team/team-classifier.ts` に移動
- [x] テストパス確認

### 2-5. achievement サブドメイン
- [x] `domain/achievement/` ディレクトリを作成
- [x] `achievements.ts` → `domain/achievement/achievement-checker.ts` に移動
- [x] テストパス確認

### 2-6. ドメイン層の純粋性検証（ランダム依存の除去を含む）
- [x] `domain/` 配下の全ファイルに `localStorage`、`Math.random` 直接呼出し、`React` import がないことを確認
- [x] ランダム依存関数に `randomFn: () => number` 引数を追加して純粋化
  - [x] `pickQuestion()`: 問題選択ロジック
  - [x] `createEvents()`（旧 `makeEvents`）: イベント生成・緊急対応判定
  - [x] `shuffleArray()`: シャッフル処理
- [x] 後方互換用のデフォルト引数 `= Math.random` により、呼び出し元の変更は不要
- [x] テストパス確認

### 2-7. フェーズ 1 レビュー指摘の対応
- [x] `scoring-types.ts` の型を各サブドメイン（`team-types.ts`, `achievement-types.ts`, `scoring-types.ts`）に分配
- [x] `SaveState` の配置はそのまま game-types.ts に維持（quiz-types への依存は型レベルのみで許容）

### 2-8. フェーズ 2 完了確認
- [x] `npm run ci` パス
- [x] テストパス確認（既存テスト33スイート598テスト全パス）
- [x] コミット作成（022e22f）

---

## フェーズ 3: DbC（Design by Contract）の導入

### 3-1. 契約ディレクトリの作成
- [x] `contracts/` ディレクトリを作成

### 3-2. ゲーム契約
- [x] `contracts/game-contracts.ts` を作成
  - [x] `assertValidGameStats`: ゲーム統計の不変条件（仕様の `assertValidGameState` を実際の型名 `GameStats` に合わせて命名）
  - [x] `assertCanStartSprint`: スプリント開始事前条件
  - [x] `assertValidSprintNumber`: スプリント番号の範囲検証
- [x] 契約テストの作成（20テスト）

### 3-3. クイズ契約
- [x] `contracts/quiz-contracts.ts` を作成
  - [x] `assertCanPickQuestion`: 問題選択事前条件
  - [x] `assertValidAnswerResult`: 回答結果事後条件
  - [x] `assertValidCombo`: コンボ値の不変条件
- [x] 契約テストの作成（12テスト）

### 3-4. スコア契約
- [x] `contracts/scoring-contracts.ts` を作成
  - [x] `assertValidGradeClassification`: グレード分類不変条件
  - [x] `assertValidDerivedStats`: 派生統計の事後条件
  - [x] `assertNonNegativeDebt`: 負債非負条件
- [x] 契約テストの作成（13テスト）

### 3-5. 共通基盤
- [x] `contracts/contract-error.ts` を作成（ContractViolationError, assertContract）
- [x] `contracts/index.ts` を作成（統一エクスポート）

### 3-6. フェーズ 3 完了確認
- [x] 型チェックパス（`npm run typecheck`）
- [x] 契約テスト全パス（3スイート45テスト）
- [x] 全テストパス（344スイート4468テスト、既存テスト影響なし）
- [x] `npm run ci` パス
- [x] コミット作成（b24bf2d）

---

## フェーズ 4: インフラ層の分離

### 4-1. Port インターフェースの定義
- [x] `infrastructure/storage/storage-port.ts` を作成（StoragePort インターフェース、has メソッド含む）
- [x] `infrastructure/audio/audio-port.ts` を作成（AudioPort インターフェース）
- [x] `infrastructure/random/random-port.ts` を作成（RandomPort インターフェース）

### 4-2. Storage Adapter の実装
- [x] `infrastructure/storage/local-storage-adapter.ts` を作成
- [x] テスト用 `InMemoryStorageAdapter` を作成
- [x] 共通テストスイートで両アダプターの StoragePort 準拠を検証（24テスト）

### 4-3. Repository パターンの実装
- [x] `infrastructure/storage/game-repository.ts`（result-storage.ts から移行、マイグレーション機能含む）
- [x] `infrastructure/storage/history-repository.ts`（history-storage.ts から移行）
- [x] `infrastructure/storage/achievement-repository.ts`（achievement-storage.ts から移行）
- [x] `infrastructure/storage/save-repository.ts`（save-manager.ts から移行、破損データ自動削除機能含む）
- [x] `infrastructure/storage/challenge-repository.ts`（challenge-storage.ts から移行）
- [x] `infrastructure/storage/daily-quiz-repository.ts`（daily-quiz.ts から移行）
- [x] マイグレーション処理は各リポジトリに内包（game-repository: 旧エンジニアタイプ変換、history-repository: 旧結果移行、save-repository: バージョン管理・破損データ削除）
- [x] 旧ストレージファイルを再エクスポート用に維持（6ファイル）
- [x] テストパス確認（6リポジトリ合計52テスト）

### 4-4. Audio Adapter の実装
- [x] `infrastructure/audio/tone-audio-adapter.ts`（audio/sound.ts に委譲）
- [x] `infrastructure/audio/silent-audio-adapter.ts`（テスト用）
- [x] 旧 audio ファイルを再エクスポート用に維持
- [x] テストパス確認

### 4-5. Random Adapter の実装
- [x] `infrastructure/random/abstract-random-adapter.ts` を作成（共通基底クラス、randomInt/shuffle の DRY 化）
- [x] `infrastructure/random/math-random-adapter.ts` を作成
- [x] テスト用 `SeededRandomAdapter` を作成（xorshift32 ベース、再現可能なテスト用）
- [x] テストパス確認

### 4-6. フェーズ 4 完了確認
- [x] `npm run ci` パス（353スイート4546テスト、ビルド成功）
- [x] インフラ層テスト全パス（9スイート76テスト）
- [x] `domain/` に `localStorage` や `Tone.js` の import がないことを確認
- [x] レビュー・リファクタリング実施
  - randomInt / shuffle の重複を AbstractRandomAdapter 基底クラスで解消
  - テストのインポートパスを `domain/types` に修正
  - StoragePort に `has` メソッドを追加し save-manager.ts の localStorage 直接参照を除去
  - SaveRepository に破損データ自動削除ロジックを追加
- [x] コミット作成（ffaf10a）

---

## フェーズ 5: アプリケーション層の構築

### 5-1. ユースケースの作成
- [x] `application/` ディレクトリを作成
- [x] `application/start-game.ts` を作成（ゲーム初期化ユースケース）
- [x] `application/answer-question.ts` を作成（回答処理ユースケース）
- [x] `application/advance-event.ts` を作成（イベント進行ユースケース）
- [x] `application/finish-sprint.ts` を作成（スプリント終了ユースケース）
- [x] `application/save-load-game.ts` を作成（セーブ/ロードユースケース）

### 5-2. ユースケーステスト
- [x] 各ユースケースの単体テストを作成（5スイート30テスト）
- [x] インフラ依存はモック（InMemoryStorage, SilentAudio, SeededRandom）で注入
- [x] テストパス確認

### 5-3. フェーズ 5 完了確認
- [x] `npm run ci` パス（358スイート4576テスト、ビルド成功）
- [x] レビュー・リファクタリング実施
  - start-game / advance-event の問題選択ロジックを `load-question.ts` に共通化（DRY）
  - SaveGameDeps / LoadGameDeps を SaveLoadDeps に統合
  - 型インポートを `import type` に整理
- [x] コミット作成（f6d794c）

---

## フェーズ 6: 定数の分割とデザイントークン化

### 6-1. constants.ts の分割
- [ ] `constants/game-config.ts` を作成（CONFIG, ゲーム設定）
- [ ] `constants/events.ts` を作成（EVENTS 定義）
- [ ] `constants/grades.ts` を作成（GRADES, getGrade, getSummaryText）
- [ ] `constants/index.ts` を作成（再エクスポート）
- [ ] 全定数に `Object.freeze` を適用
- [ ] 旧 `constants.ts` を再エクスポート用に維持
- [ ] テストパス確認

### 6-2. デザイントークンの作成
- [ ] `presentation/styles/design-tokens.ts` を作成
- [ ] COLORS 定数をデザイントークンに統合
- [ ] 既存スタイルファイルからデザイントークンを参照するように更新
- [ ] テストパス確認

### 6-3. フェーズ 6 完了確認
- [ ] `npm run ci` パス
- [ ] コミット作成

---

## フェーズ 7: プレゼンテーション層のリファクタリング

### 7-1. useGame の Reducer 化
- [ ] `presentation/hooks/useGameReducer.ts` を作成
  - [ ] GameAction 型の定義
  - [ ] gameReducer 関数の実装（純粋関数）
  - [ ] gameReducer のテスト作成
- [ ] `useGame.ts` を Reducer ベースに書き換え
  - [ ] 複数の `useState` → `useReducer` に統合
  - [ ] 副作用（Audio, Storage）はフック内で dispatch 後に実行
- [ ] 既存の useGame テストが全パスすることを確認

### 7-2. コンポーネント分割 - ResultScreen
- [ ] `presentation/components/screens/ResultScreen/` ディレクトリを作成
- [ ] `GradeDisplay.tsx` を抽出（グレード表示・アニメーション）
- [ ] `StatsPanel.tsx` を抽出（統計パネル）
- [ ] `ResultActions.tsx` を抽出（アクションボタン）
- [ ] `ResultScreen.tsx` を親コンポーネントとして再構成
- [ ] テストパス確認

### 7-3. コンポーネント分割 - GuideScreen
- [ ] `presentation/components/screens/GuideScreen/` ディレクトリを作成
- [ ] `GuideSection.tsx` を抽出
- [ ] `GuideNavigation.tsx` を抽出
- [ ] テストパス確認

### 7-4. コンポーネント分割 - QuizScreen
- [ ] タイマー表示を独立コンポーネントに分離
- [ ] 選択肢表示を独立コンポーネントに分離
- [ ] テストパス確認

### 7-5. コンポーネント分割 - TitleScreen
- [ ] 難易度選択を独立コンポーネントに分離
- [ ] テストパス確認

### 7-6. デザインパターンの適用
- [ ] Strategy パターン: 難易度設定のプラガブル化
- [ ] Observer パターン: 実績通知の疎結合化
- [ ] テストパス確認

### 7-7. プレゼンテーション層への移動
- [ ] `components/` → `presentation/components/` に移動
- [ ] `hooks/` → `presentation/hooks/` に移動
- [ ] `styles/` → `presentation/styles/` に移動
- [ ] 旧パスからの再エクスポート設定
- [ ] テストパス確認

### 7-8. フェーズ 7 完了確認
- [ ] `npm run ci` パス
- [ ] コンポーネントが 200 行以下に収まっていることを確認
- [ ] コミット作成

---

## フェーズ 8: テストリファクタリング

### 8-1. テスト構造の整理
- [ ] `domain/` 配下に各サブドメインの `__tests__/` を作成
- [ ] `infrastructure/` 配下に `__tests__/` を作成
- [ ] `application/` 配下に `__tests__/` を作成
- [ ] 旧 `__tests__/` のテストを新しい場所に移動
- [ ] `domain-types.test.ts` のプレースホルダーテスト（`expect(true).toBe(true)`）を削除または実効性のある検証に置換（フェーズ 1 レビュー指摘）
- [ ] テストパス確認

### 8-2. テストファクトリの作成
- [ ] テスト用データファクトリ（`createQuestion`, `createGameStats` 等）を作成
- [ ] テストヘルパー（`renderWithProviders` 等）を作成
- [ ] テストパス確認

### 8-3. ドメインテストの改善（ランダム要素の確定的テスト含む）
- [ ] AAA パターンの徹底（Arrange / Act / Assert のコメント統一）
- [ ] 境界値テストの追加（スコア 0, 最大スコア, 負債 0 等）
- [ ] game-state テストの追加
- [ ] **ランダム依存関数の確定的テスト追加**
  - [ ] `createEvents`: `randomFn` 注入で緊急対応の発生パスと非発生パスの両方を検証
  - [ ] `createEvents`: 緊急対応の挿入位置が `randomFn` で制御されることを検証
  - [ ] `pickQuestion`: 乱数固定で特定の問題が選択されることを検証
  - [ ] `pickQuestion`: 全問題使用済み時のリサイクル動作を検証
  - [ ] `shouldTriggerEmergency`: 負債量に応じた確率変動の境界値テスト
- [ ] テストパス確認

### 8-4. インフラテストの改善
- [ ] InMemoryStorageAdapter を使用したリポジトリテスト
- [ ] マイグレーションテストの統合
- [ ] SeededRandomAdapter の作成と動作確認テスト
- [ ] テストパス確認

### 8-5. コンポーネントテストの改善
- [ ] `getByRole` / `getByText` を優先使用に統一
- [ ] ユーザー操作フローのテスト追加
- [ ] 分割後のコンポーネントのテスト追加
- [ ] テストパス確認

### 8-6. フェーズ 8 完了確認
- [ ] `npm run ci` パス
- [ ] カバレッジが目標に達していることを確認
  - [ ] `domain/`: branches ≥ 70%, functions ≥ 85%, lines ≥ 85%
  - [ ] 全体: statements ≥ 50%, lines ≥ 50%
- [ ] コミット作成

---

## フェーズ 9: E2E テストの導入

> **方針**: ランダムな「内容」ではなく「構造」と「遷移」を検証する。
> 確率的要素（緊急対応の発生等）はフェーズ 8 のユニットテストで担保済み。
> primal-path の E2E パターン（複数パス許容、自動中間画面処理）を参考にする。

### 9-1. Page Object の完成
- [ ] `e2e/helpers/aqs-helper.ts` の完全実装
  - [ ] `navigateToGame()`: ゲーム画面への遷移 + 注意事項ダイアログの自動処理
  - [ ] `startGame(options?)`: ゲーム開始（難易度・スプリント数指定可能）
  - [ ] `answerAnyOption()`: 表示されている選択肢のうち任意の1つをクリック（順序に依存しない）
  - [ ] `waitForQuizScreen()`: クイズ画面待機（中間画面は自動スキップ）
  - [ ] `getCurrentPhase()`: 現在のフェーズを取得（複数のフェーズマーカーを監視）
  - [ ] `advanceToPhase(target, maxIterations?)`: 中間画面を自動処理しながら目的フェーズまで進行
  - [ ] `waitForResult()`: 結果画面待機
  - [ ] `getGrade()`: グレード取得
  - [ ] `goToStudyMode()`: 勉強会モードへ
  - [ ] `goToHistory()`: 履歴画面へ
  - [ ] `goToAchievements()`: 実績画面へ

### 9-2. 基本フローテスト（構造と遷移の検証）
- [ ] `e2e/agile-quiz-sugoroku/basic-flow.spec.ts`
  - [ ] タイトル画面の構成要素が存在する（タイトル、開始ボタン等）
  - [ ] ゲーム開始操作でスプリント開始画面に遷移する
  - [ ] クイズ画面に問題テキストと4つの選択肢が表示される（具体的な問題内容は検証しない）
  - [ ] 回答後に正解/不正解いずれかのフィードバックが表示される
  - [ ] ゲーム完走後（advanceToPhase で自動進行）に結果画面が表示される
  - [ ] 結果画面にグレード（S/A/B/C/D のいずれか）が存在する

### 9-3. ゲーミング機能テスト（画面遷移の検証）
- [ ] `e2e/agile-quiz-sugoroku/study-mode.spec.ts`
  - [ ] 勉強会モード: ジャンル選択画面が表示される
  - [ ] ジャンルを選択して勉強会を開始できる
  - [ ] 問題と選択肢が表示される（具体的な問題内容は検証しない）
  - [ ] 回答後に勉強会結果画面に到達する
- [ ] `e2e/agile-quiz-sugoroku/daily-quiz.spec.ts`
  - [ ] デイリークイズ画面が表示される（日付シード付きで安定動作）
  - [ ] 問題に回答でき、スコアが表示される
- [ ] `e2e/agile-quiz-sugoroku/screens.spec.ts`
  - [ ] 履歴画面に遷移でき、構成要素が表示される
  - [ ] 実績画面に遷移でき、構成要素が表示される
  - [ ] ガイド画面に遷移でき、構成要素が表示される

### 9-4. セーブ/ロードテスト
- [ ] `e2e/agile-quiz-sugoroku/save-load.spec.ts`
  - [ ] ゲーム途中でページリロードしても状態が復元される（具体的な問題内容は検証しない）
  - [ ] セーブデータの有無によるタイトル画面の表示切替

### 9-5. ストーリーテスト
- [ ] `e2e/agile-quiz-sugoroku/story.spec.ts`
  - [ ] ストーリー画面が表示され、スキップ操作で次に進める

### 9-6. E2E テストで検証しないことの確認
- [ ] 以下がテスト対象外であることをテストコード内にコメントで明記
  - 特定の問題が出題されること（ランダム）
  - 緊急対応イベントの発生/非発生（確率的 → ユニットテストで担保）
  - 特定のキャラクターコメントの内容（ランダム）
  - 特定のコンボ数やスコア値（ランダムな問題選択に依存）

### 9-7. フェーズ 9 完了確認
- [ ] `npm run test:e2e` パス（フレーキーテストがないことを3回連続実行で確認）
- [ ] CI 環境での E2E テスト実行確認
- [ ] コミット作成

---

## フェーズ 10: 最終検証とクリーンアップ

### 10-1. 後方互換の再エクスポート削除
- [ ] 旧 `types.ts` の再エクスポートを削除 → 直接 import に更新
- [ ] 旧 `game-logic.ts` の再エクスポートを削除
- [ ] 旧 `answer-processor.ts` の再エクスポートを削除
- [ ] 旧ストレージファイルの再エクスポートを削除
- [ ] 旧 `constants.ts` の再エクスポートを削除
- [ ] テストパス確認

### 10-2. 不要コードの削除
- [ ] 旧 `EngineerType` 関連コードの完全削除（`TEAM_TYPES` に統一済み）
- [ ] 未使用の import の削除
- [ ] 未使用の型・関数の削除
- [ ] テストパス確認

### 10-3. コード品質の最終確認
- [ ] 全ファイルが 200 行以下であることの確認（コンポーネント）
- [ ] 全関数が 30 行以下であることの確認
- [ ] マジックナンバーが残っていないことの確認
- [ ] `any` 型が使用されていないことの確認
- [ ] コメントが日本語で記述されていることの確認

### 10-4. 依存方向の最終確認
- [ ] `domain/` に `React`, `localStorage`, `Tone.js`, `Math.random` の直接参照がないことを確認
- [ ] `infrastructure/` に `React` の import がないことを確認
- [ ] `application/` に `React` の import がないことを確認
- [ ] 依存方向: presentation → application → domain ← contracts, application → infrastructure

### 10-5. 全テストの実行
- [ ] `npm run lint` パス
- [ ] `npm run typecheck` パス
- [ ] `npm run test` パス
- [ ] `npm run test:e2e` パス
- [ ] `npm run build` パス
- [ ] `npm run ci` パス

### 10-6. カバレッジの最終確認
- [ ] `domain/`: branches ≥ 70%, functions ≥ 85%, lines ≥ 85%, statements ≥ 85%
- [ ] 全体: branches ≥ 35%, functions ≥ 45%, lines ≥ 50%, statements ≥ 50%

### 10-7. ドキュメント・PR
- [ ] リファクタリング完了の概要ドキュメント作成
- [ ] PR 作成（変更内容のサマリー + テスト結果）
- [ ] コミット作成

---

## 進捗サマリー

| フェーズ | タスク数 | 完了数 | 状態 |
|---------|---------|--------|------|
| 0: 準備 | 10 | 10 | **完了** |
| 1: 型定義分割 | 13 | 10 | **完了**（レビュー指摘3件は後続フェーズで対応） |
| 2: ドメイン層抽出 | 39 | 39 | **完了** |
| 3: DbC 導入 | 21 | 21 | **完了** |
| 4: インフラ層分離 | 29 | 29 | **完了** |
| 5: アプリケーション層 | 11 | 0 | 未着手 |
| 6: 定数分割 | 13 | 0 | 未着手 |
| 7: プレゼンテーション層 | 34 | 0 | 未着手 |
| 8: テストリファクタリング | 32 | 0 | 未着手 |
| 9: E2E テスト | 40 | 0 | 未着手 |
| 10: 最終検証 | 30 | 0 | 未着手 |
| **合計** | **266** | **20** | **進行中** |
