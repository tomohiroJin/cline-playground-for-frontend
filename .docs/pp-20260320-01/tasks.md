# Picture Puzzle リファクタリング チェックリスト

## Phase 1: 基盤構築 + E2E テスト先行整備

### 1-1. 共有基盤の作成

- [x] `src/shared/utils/assert.ts` を作成
  - [x] `assert(condition, message)` 関数を実装
  - [x] `assertDefined<T>(value, message)` 型ガード関数を実装
  - [x] 単体テストを作成
- [x] `src/shared/constants/puzzle-constants.ts` を作成
  - [x] `MAX_BOARD_WIDTH = 600` を定義
  - [x] `DEFAULT_DIVISION = 4` を定義
  - [x] `VALID_DIVISIONS = [2, 3, 4, 5, 6, 8, 10, 16, 32]` を定義
  - [x] `DISSOLVE_DURATION = 1.0` を定義
  - [x] `SHUFFLE_FACTOR = 2` を定義
- [x] `src/shared/utils/format.ts` を作成
  - [x] `formatElapsedTime` を `puzzle-utils.ts` から移動
  - [x] 既存のインポート元を更新（後方互換エクスポートを一時的に維持）

### 1-2. E2E テスト基盤の整備

- [x] `e2e/picture-puzzle/` ディレクトリを作成
- [x] `e2e/picture-puzzle/helpers/puzzle-page.ts` ページオブジェクトを作成
  - [x] タイトル画面の操作メソッド
  - [x] セットアップ画面の操作メソッド（画像選択、難易度選択、開始）
  - [x] ゲーム画面の操作メソッド（ピース移動、ヒント、リセット）
  - [x] リザルト画面の操作メソッド（リトライ、戻る）
- [x] `e2e/picture-puzzle/game-flow.spec.ts` を作成
  - [x] タイトル画面表示テスト
  - [x] 画像選択 → 難易度選択 → ゲーム開始テスト
  - [x] ゲーム終了 → セットアップ画面に戻るテスト
- [x] `e2e/picture-puzzle/piece-movement.spec.ts` を作成
  - [x] ピースクリックで移動テスト
  - [x] 隣接しないピースは移動しないテスト
- [x] `e2e/picture-puzzle/hint-mode.spec.ts` を作成
  - [x] ヒント表示/非表示テスト
- [x] `e2e/picture-puzzle/completion.spec.ts` を作成
  - [x] デバッグモードでのパズル完成テスト
  - [x] リザルト画面表示テスト

### 1-3. 検証

- [x] 全既存単体テストがパスすることを確認
- [ ] E2E テストがパスすることを確認（ローカル環境でのサーバー起動が必要）
- [ ] PR を作成・レビュー

---

## Phase 2: ドメイン層の構築

### 2-1. 値オブジェクト

- [x] `src/domain/puzzle/value-objects/grid-position.ts` を作成
  - [x] `createGridPosition(row, col, division)` — バリデーション付きファクトリ
  - [x] `isPositionEqual(a, b)` — 等価判定
  - [x] `isAdjacent(a, b)` — 隣接判定
  - [x] `getAdjacentPositions(position, division)` — 隣接位置リスト取得
  - [x] 単体テスト（モックなし）
- [x] `src/domain/puzzle/value-objects/division.ts` を作成
  - [x] `createDivision(value)` — バリデーション付きファクトリ
  - [x] `calculateShuffleMoves(division)` — シャッフル回数計算
  - [x] `getDivisionMultiplier(division)` — 難易度倍率取得
  - [x] 単体テスト（モックなし）

### 2-2. エンティティ

- [x] `src/domain/puzzle/entities/puzzle-piece.ts` を作成
  - [x] `createPuzzlePiece(id, correctPosition, isEmpty)` — ファクトリ
  - [x] `isInCorrectPosition(piece)` — 正解位置判定
  - [x] `movePieceTo(piece, position)` — 位置更新（不変更新）
  - [x] 単体テスト（モックなし）

### 2-3. 集約

- [x] `src/domain/puzzle/aggregates/puzzle-board.ts` を作成
  - [x] `PuzzleBoardState` 型定義
  - [x] `createPuzzleBoard(division)` — ボード生成
  - [x] `movePiece(state, pieceId)` — ピース移動（DbC: 事前条件＋事後条件）
  - [x] `isCompleted(state)` — 完成判定
  - [x] `calculateCorrectRate(state)` — 正解率計算
  - [x] 単体テスト（モックなし、各 DbC 条件のテスト含む）

### 2-4. ドメインサービス

- [x] `src/domain/puzzle/services/shuffle-service.ts` を作成
  - [x] `shufflePuzzle(board, moves)` — シャッフルロジック
  - [x] 単体テスト（決定的テスト + ランダムテスト）
- [x] `src/domain/scoring/score-calculator.ts` を作成
  - [x] `SCORE_CONSTANTS` — スコア計算定数
  - [x] `calculateScore(input)` — スコア計算
  - [x] `determineRank(score)` — ランク判定
  - [x] 単体テスト（境界値テスト含む）
- [x] `src/domain/scoring/rank-evaluator.ts` を作成
  - [x] `RANK_THRESHOLDS` — ランク閾値定数
  - [x] 単体テスト（score-calculator.test.ts に含む）
- [x] `src/domain/theme/theme-unlock-service.ts` を作成
  - [x] `UnlockContext` 型定義
  - [x] `isThemeUnlocked(condition, context)` — アンロック判定
  - [x] Strategy パターンによる条件評価
  - [x] 単体テスト

### 2-5. テストヘルパー

- [x] `src/test-helpers/puzzle-factory.ts` を作成
  - [x] `createTestPiece(overrides?)` — テスト用ピース生成
  - [x] `createTestBoard(division)` — テスト用ボード生成
  - [x] `createCompletedBoard(division)` — 完成状態のボード生成
- [x] `src/domain/puzzle/index.ts` バレルエクスポートを作成
- [x] `src/domain/scoring/index.ts` バレルエクスポートを作成
- [x] `src/domain/theme/index.ts` バレルエクスポートを作成

### 2-6. 検証

- [x] ドメイン層の全テストがパスすることを確認（79テスト）
- [x] 既存テストに影響がないことを確認
- [x] ドメイン層に外部依存（React、Jotai 等）がないことを確認
- [ ] PR を作成・レビュー

---

## Phase 3: アプリケーション層の構築

### 3-1. ポート定義

- [x] `src/application/ports/storage-port.ts` を作成
  - [x] `PuzzleRecordStorage` インターフェース（read/write/recordScore）
  - [x] `TotalClearsStorage` インターフェース（get/increment）
  - [x] `ClearHistoryStorage` インターフェース（get/add）
- [x] `src/application/ports/timer-port.ts` を作成
  - [x] `TimerPort` インターフェース（start/stop/getElapsed）

### 3-2. ユースケース

- [x] `src/application/use-cases/initialize-puzzle.ts` を作成
  - [x] パズル生成 → シャッフル → 初期状態返却
  - [x] 単体テスト
- [x] `src/application/use-cases/move-piece.ts` を作成
  - [x] ドメイン集約の `movePiece` を呼び出し
  - [x] 完成判定結果を返却
  - [x] 単体テスト
- [x] `src/application/use-cases/complete-puzzle.ts` を作成
  - [x] スコア計算（ドメインサービス呼び出し）
  - [x] 記録保存（ストレージポート経由）
  - [x] ベストスコア判定
  - [x] クリア数インクリメント
  - [x] 単体テスト（ストレージモック使用）
- [x] `src/application/use-cases/reset-puzzle.ts` を作成
  - [x] リシャッフル処理
  - [x] 単体テスト

### 3-3. テストヘルパー

- [x] `src/test-helpers/mock-storage.ts` を作成
  - [x] `MockPuzzleRecordStorage` — インメモリ実装
  - [x] `MockTotalClearsStorage` — インメモリ実装
  - [x] `MockClearHistoryStorage` — インメモリ実装

### 3-4. 検証

- [x] アプリケーション層の全テストがパスすることを確認（10テスト）
- [x] 既存テストに影響がないことを確認
- [ ] PR を作成・レビュー

---

## Phase 4: インフラ層 + プレゼンテーション層のリファクタリング

### 4-1. インフラ層

- [x] `src/infrastructure/storage/local-storage-adapter.ts` を作成
  - [x] `readLocalStorage` / `writeLocalStorage` を移動
- [x] `src/infrastructure/storage/puzzle-records-store.ts` を作成
  - [x] `PuzzleRecordStorage` ポートの localStorage 実装
- [x] `src/infrastructure/storage/total-clears-store.ts` を作成
  - [x] `TotalClearsStorage` ポートの localStorage 実装
- [x] `src/infrastructure/timer/browser-timer.ts` を作成
  - [x] `TimerPort` の `Date.now()` ベース実装

### 4-2. 状態管理のリファクタリング

- [x] `src/presentation/store/puzzle-atoms.ts` を作成
  - [x] `puzzleBoardStateAtom` — パズルコア状態の統合 atom
  - [x] `derivedCorrectRateAtom` — 派生 atom
- [x] `src/presentation/store/game-atoms.ts` を作成
  - [x] `gamePhaseAtom` — ゲームフェーズ
  - [x] `selectedImageUrlAtom` / `selectedImageSizeAtom` — 選択画像
  - [x] `gameElapsedTimeAtom` — 経過時間
  - [x] `gameScoreAtom` — スコア
  - [x] `isBestScoreAtom` — ベストスコアフラグ
- [x] `src/presentation/store/ui-atoms.ts` を作成
  - [x] `hintModeEnabledAtom`
  - [x] `overlayVisibleAtom`
  - [x] `videoPlaybackAtom`
  - [x] `hintUsedAtom`
  - [x] `debugModeAtom`
  - [x] `emptyPanelClicksAtom`
- [x] 旧 `src/store/atoms.ts` からの移行
  - [x] atoms.ts を新 presentation/store/ への再エクスポートに変換
  - [x] useHintMode.ts → presentation/store/ui-atoms からインポート
  - [x] usePuzzleTimer.ts → presentation/store/game-atoms からインポート
  - [x] useCompletionOverlay.ts → presentation/store/ui-atoms からインポート
  - [x] useVideoPlayback.ts → presentation/store/ui-atoms からインポート
  - [x] useGameState.ts → presentation/store/ui-atoms からインポート

### 4-3. フックのリファクタリング

- [x] `src/presentation/hooks/usePuzzleGame.ts` を作成
  - [x] ドメイン集約の呼び出し → atom 更新
  - [x] `initialize` — ユースケース経由
  - [x] `move` — ユースケース経由
  - [x] `reset` — ユースケース経由
  - [x] `completeForDebug` — デバッグ用完成
- [x] `src/presentation/hooks/useGameFlow.ts` を作成
  - [x] ゲームフェーズ管理（開始・完成・リセット・終了）
  - [x] `handleStartGame`
  - [x] `handleEndGame`
  - [x] `handleResetGame`
  - [x] スコア計算・保存（ユースケース経由）
- [ ] 既存フックの移動と更新（Phase 6 で実施）
  - [ ] `usePuzzleTimer.ts` → `src/presentation/hooks/`
  - [ ] `useKeyboard.ts` → `src/presentation/hooks/`
  - [ ] `useSwipe.ts` → `src/presentation/hooks/`
  - [ ] `useHintMode.ts` → `src/presentation/hooks/`
  - [ ] `useCompletionOverlay.ts` → `src/presentation/hooks/`
  - [ ] `useVideoPlayback.ts` → `src/presentation/hooks/`

### 4-4. コンポーネントのリファクタリング

- [ ] `PuzzleBoard.tsx` のリファクタリング（Phase 6 で実施）
- [ ] `PuzzlePage.tsx` のリファクタリング（Phase 6 で実施）
- [ ] コンポーネントの移動（Phase 6 で実施）

### 4-5. 検証

- [x] 全テスト（単体）がパスすることを確認（128テスト）
- [ ] E2E テストがパスすることを確認（ローカル環境でのサーバー起動が必要）
- [ ] PR を作成・レビュー

**注**: 4-2〜4-4の既存コンポーネントへの移行は、新レイヤーが安定した後に Phase 6 のクリーンアップと合わせて実施する方針。現段階では新レイヤーの構築に集中し、既存コードへの破壊的変更を避ける。

---

## Phase 5: テストのリファクタリング

### 5-1. 単体テストのリファクタリング

- [x] ドメイン層テストの整備（Phase 2 で作成済みを拡充）
  - [x] `puzzle-board.test.ts` — 境界値テスト追加（連続移動、大規模ボード、空ボード）
  - [x] `score-calculator.test.ts` — 全ランクの境界値テスト
  - [x] `shuffle-service.test.ts` — 大規模分割のテスト（8×8）
  - [x] `theme-unlock-service.test.ts` — 全アンロック条件のテスト（複数テーマ）
- [x] アプリケーション層テストの整備
  - [x] ユースケースの正常系・異常系テスト
  - [x] ポートモックの正しい使用を検証
- [x] プレゼンテーション層テストの整備
  - [x] `usePuzzleGame.test.ts` — ドメイン層は実物使用、ストレージのみモック（9テスト）
  - [x] `useGameFlow.test.ts` — フロー遷移のテスト（10テスト）
  - [ ] `PuzzleBoard.test.tsx` — UI 表示に特化したテスト（Phase 6 で移行時に実施）
  - [ ] `PuzzlePage.test.tsx` — ページレベルのテスト（Phase 6 で移行時に実施）

### 5-2. テストヘルパーの整備

- [x] `src/test-helpers/render-with-providers.ts` を作成
  - [x] Jotai Provider + 初期値設定のラッパー
- [x] テストデータの共通化
  - [x] `src/test-helpers/puzzle-factory.ts` — 共通ピース・ボードデータ
  - [x] `src/test-helpers/mock-storage.ts` — ストレージモック

### 5-3. E2E テストの拡充

- [x] `e2e/picture-puzzle/keyboard.spec.ts` を作成
  - [x] 矢印キーでのピース移動テスト
  - [x] WASD キーでのピース移動テスト
  - [x] H キーでのヒントトグルテスト
  - [x] R キーでのリセットテスト
- [x] `e2e/picture-puzzle/scoring.spec.ts` を作成
  - [x] スコア表示テスト
  - [x] ランク表示テスト
- [x] `e2e/picture-puzzle/theme-unlock.spec.ts` を作成
  - [x] 初期テーマの表示テスト
  - [x] ロックされたテーマの表示テスト
- [x] `e2e/picture-puzzle/mobile.spec.ts` を作成
  - [x] スワイプでのピース移動テスト（モバイルエミュレーション）
  - [x] レスポンシブレイアウトテスト
- [x] `e2e/picture-puzzle/persistence.spec.ts` を作成
  - [x] ベストスコアの保存・復元テスト
  - [x] クリア履歴の保存テスト

### 5-4. 旧テストの削除（Phase 6 で実施）

- [ ] `src/utils/puzzle-utils.test.ts` を削除
- [ ] `src/hooks/usePuzzle.test.tsx` を削除
- [ ] `src/components/organisms/PuzzleBoard.test.tsx` を削除
- [ ] `src/components/molecules/PuzzlePiece.test.tsx` を移動・更新
- [ ] `src/pages/PuzzlePage.test.tsx` を移動・更新

### 5-5. コードレビュー指摘対応

- [x] `RANK_THRESHOLDS` をドメイン層（score-calculator.ts）に移動
- [x] `assert` を TypeScript assertion function に変更（`asserts condition`）
- [x] `PuzzlePiece` 型に `readonly` 追加
- [x] `shufflePuzzle` に `MAX_ATTEMPTS` ループ上限追加
- [x] `shufflePuzzle` の `isCompleted` を実際に計算するように変更
- [x] `DIVISION_MULTIPLIERS` を `Record<Division, number>` に変更（型安全）
- [x] `createGridPosition` に `Number.isInteger` チェック追加
- [x] `useGameFlow` のインフラ直接依存を DI パターンに修正
- [x] `useGameFlow` の `elapsedSeconds` を `gameElapsedTimeAtom` から取得に修正
- [x] `MockPuzzleRecordStorage.recordScore` のベストタイム/ベスト手数比較を追加
- [x] `completePuzzleUseCase` にクラス版（コンストラクタインジェクション）追加
- [x] `puzzle-utils.ts` を新ドメインコードへの委譲に書き換え（DRY 解消）
- [x] `readLocalStorage` に `validator` パラメータ追加（型安全性向上）
- [x] `BrowserTimer` に `running` フラグ追加
- [x] E2E テストを `waitForTimeout` から状態ベース待機に変更
- [x] `usePuzzleGame.ts` の stale state 問題をセッター関数パターンで修正
- [x] テストの不安定性修正（2×2 → 3×3 に変更）

### 5-6. 検証

- [x] 全テスト（単体）がパスすることを確認（6401テスト中 6401 パス）
- [ ] E2E テストがパスすることを確認（ローカル環境でのサーバー起動が必要）
- [ ] PR を作成・レビュー

---

## Phase 6: クリーンアップ

### 6-1. 旧コードの委譲ラッパー化

既存コンポーネント（PuzzlePage, PuzzleBoard 等）がまだ旧コードを参照しているため、
旧ファイルを完全削除する代わりに新ドメインコードへの委譲ラッパーに変換した。

- [x] `src/utils/puzzle-utils.ts` を新ドメインコードへの委譲に書き換え
- [x] `src/utils/score-utils.ts` を新ドメインコードへの委譲に書き換え
- [x] `src/utils/storage-utils.ts` の `extractImageName` を shared に移動・再エクスポート
- [ ] `src/utils/storage/` ディレクトリ — PuzzleBoard が直接参照中のため保持
- [ ] `src/hooks/usePuzzle.ts` — PuzzlePage が useGameState 経由で依存中のため保持
- [ ] `src/hooks/useGameState.ts` — PuzzlePage が直接依存中のため保持
- [x] `src/store/atoms.ts` — 新 presentation/store/ への再エクスポートに変換済み

### 6-2. インポートパスの整理

- [x] `PuzzleBoard.tsx` — formatElapsedTime を shared/utils/format に変更
- [x] `PuzzleBoard.tsx` — extractImageName を shared/utils/image-utils に変更
- [x] `PuzzleBoard.tsx` — addClearHistory を storage/clearHistory に直接インポート
- [x] `ResultScreen.tsx` — formatElapsedTime を shared/utils/format に変更
- [x] `ClearHistoryList.tsx` — formatElapsedTime を shared/utils/format に変更
- [x] `ClearHistoryList.tsx` — ClearHistory 型を storage/clearHistory から直接インポート
- [x] `useGameFlow.ts` — extractImageName を shared/utils/image-utils に変更
- [x] `PuzzleBoard.test.tsx` — モックパスを更新
- [x] `ClearHistoryList.test.tsx` — モックパスを更新
- [x] 新規コード: shared/utils/image-utils.ts を作成（extractImageName を移動）

### 6-3. コード品質チェック

- [x] `any` 型が新規コードで使用されていないことを確認
- [x] ドメイン層に外部依存（React、Jotai 等）がないことを確認
- [x] プレゼンテーション層からインフラ層への直接依存がないことを確認

### 6-4. 最終検証

- [x] 全テスト（491スイート、6420テスト）がパスすることを確認
- [ ] E2E テストがパスすることを確認（ローカル環境でのサーバー起動が必要）
- [x] ビルドが成功することを確認（warnings のみ、エラーなし）
- [ ] PR を作成・レビュー

**注**: 旧コード（usePuzzle, useGameState, atoms.ts）の完全削除は、既存コンポーネント
（PuzzlePage, PuzzleBoard 等）を新プレゼンテーション層に完全移行する際に実施する。
現段階では委譲ラッパー化により DRY 違反を解消し、ロジックの一元化を達成している。
