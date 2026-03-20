# Picture Puzzle リファクタリング実装計画

## 概要

本計画は Picture Puzzle の大規模リファクタリングを **6 フェーズ** に分けて段階的に実施する。
各フェーズは独立してマージ可能な単位で設計し、既存機能を壊さずに進行する。

---

## Phase 1: 基盤構築 + E2E テスト先行整備

### 目的

- リファクタリングのセーフティネットとなる E2E テストを先に整備する
- ドメイン層の基盤（共有ユーティリティ、定数、DbC アサーション）を構築する

### 作業内容

#### 1-1. 共有基盤の作成

- `src/shared/utils/assert.ts` — DbC アサーションユーティリティ
- `src/shared/constants/puzzle-constants.ts` — マジックナンバーの定数化
  - `MAX_BOARD_WIDTH = 600`
  - `DEFAULT_DIVISION = 4`
  - `VALID_DIVISIONS`
  - `DISSOLVE_DURATION = 1.0`
- `src/shared/utils/format.ts` — `formatElapsedTime` を移動

#### 1-2. E2E テスト基盤の整備

- Playwright の Picture Puzzle 用設定
- ページオブジェクト `e2e/picture-puzzle/helpers/puzzle-page.ts` の作成
- 基本シナリオの E2E テスト作成:
  - ゲーム開始フロー
  - ピース移動操作
  - ヒントモード
  - パズル完成（デバッグモード利用）

### 成果物

- `src/shared/` ディレクトリ
- `e2e/picture-puzzle/` ディレクトリ（4シナリオ）
- 全既存テストが引き続きパスすること

### ブランチ

`refactor/pp-phase1-foundation`

---

## Phase 2: ドメイン層の構築

### 目的

- ビジネスロジックを純粋関数として `domain/` に抽出する
- 既存コードからロジックをコピーし、テスト付きで構築する（既存コードはまだ変更しない）

### 作業内容

#### 2-1. 値オブジェクト

- `src/domain/puzzle/value-objects/grid-position.ts`
  - `createGridPosition()` — バリデーション付きファクトリ
  - `isEqual()` — 位置の等価判定
  - `isAdjacent()` — 隣接判定
- `src/domain/puzzle/value-objects/division.ts`
  - `createDivision()` — バリデーション付きファクトリ
  - `calculateShuffleMoves()` — シャッフル回数計算

#### 2-2. エンティティ

- `src/domain/puzzle/entities/puzzle-piece.ts`
  - `createPuzzlePiece()` — ファクトリ
  - `isInCorrectPosition()` — 正解位置判定
  - `movePieceTo()` — 位置更新（純粋関数）

#### 2-3. 集約

- `src/domain/puzzle/aggregates/puzzle-board.ts`
  - `createPuzzleBoard()` — ボード初期化
  - `movePiece()` — ピース移動（DbC 付き）
  - `isCompleted()` — 完成判定
  - `calculateCorrectRate()` — 正解率計算

#### 2-4. ドメインサービス

- `src/domain/puzzle/services/shuffle-service.ts`
  - `shufflePuzzle()` — シャッフルロジック
- `src/domain/puzzle/services/adjacency-service.ts`
  - `getAdjacentPositions()` — 隣接位置取得（統一版）
  - `isAdjacent()` — 隣接判定（統一版）
- `src/domain/scoring/score-calculator.ts`
  - `calculateScore()` — スコア計算
  - `determineRank()` — ランク判定
- `src/domain/theme/theme-unlock-service.ts`
  - `isThemeUnlocked()` — アンロック判定

#### 2-5. テスト

- 各ドメインモジュールに対応する **モックなし** の単体テスト
- テストヘルパー `src/test-helpers/puzzle-factory.ts` の作成

### 成果物

- `src/domain/` ディレクトリ（全テスト付き）
- `src/test-helpers/` ディレクトリ
- 既存コードに変更なし

### ブランチ

`refactor/pp-phase2-domain`

---

## Phase 3: アプリケーション層の構築

### 目的

- ユースケースを作成し、ドメイン層とプレゼンテーション層の橋渡しを行う
- ストレージアクセスのポート（インターフェース）を定義する

### 作業内容

#### 3-1. ポート定義

- `src/application/ports/storage-port.ts`
  - `PuzzleRecordStorage` インターフェース
  - `TotalClearsStorage` インターフェース
  - `ClearHistoryStorage` インターフェース
- `src/application/ports/timer-port.ts`
  - `TimerPort` インターフェース

#### 3-2. ユースケース

- `src/application/use-cases/initialize-puzzle.ts`
  - パズルの生成 → シャッフル → 初期状態の返却
- `src/application/use-cases/move-piece.ts`
  - ピース移動 → 完成判定 → 新状態の返却
- `src/application/use-cases/complete-puzzle.ts`
  - スコア計算 → 記録保存 → ベスト判定
- `src/application/use-cases/reset-puzzle.ts`
  - パズルのリシャッフル

### 成果物

- `src/application/` ディレクトリ（全テスト付き）
- ストレージポートのモックを使用した統合テスト

### ブランチ

`refactor/pp-phase3-application`

---

## Phase 4: インフラ層 + プレゼンテーション層のリファクタリング

### 目的

- ストレージアクセスをポート経由に変更する
- コンポーネントとフックの責務を整理する
- Jotai atoms をグループ化する

### 作業内容

#### 4-1. インフラ層

- `src/infrastructure/storage/local-storage-adapter.ts`
  - `StoragePort` の localStorage 実装
- `src/infrastructure/storage/puzzle-records-store.ts`
  - `PuzzleRecordStorage` の実装
- `src/infrastructure/timer/browser-timer.ts`
  - `TimerPort` の実装

#### 4-2. 状態管理のリファクタリング

- `src/presentation/store/puzzle-atoms.ts` — パズルコア状態
  - `puzzleBoardStateAtom` にピース・空白位置・分割数・手数・完成フラグを統合
  - `correctRateAtom` を派生 atom として定義
- `src/presentation/store/game-atoms.ts` — ゲーム進行状態
  - `gamePhaseAtom`（title/setup/playing/result）
  - `selectedImageAtom`
  - `elapsedTimeAtom`
  - `scoreAtom`
- `src/presentation/store/ui-atoms.ts` — UI 状態
  - `hintModeEnabledAtom`
  - `overlayVisibleAtom`
  - `videoPlaybackAtom`

#### 4-3. フックのリファクタリング

- `usePuzzle.ts` → `usePuzzleGame.ts`
  - ドメイン層の集約を呼び出す形に変更
  - 状態更新は atom 経由のみ
- `useGameState.ts` → `useGameFlow.ts`
  - ゲームフロー（開始・完成・リセット・終了）に特化
  - スコア計算・保存はユースケース経由

#### 4-4. コンポーネントのリファクタリング

- `PuzzleBoard.tsx` からビジネスロジックを除去
  - クリア履歴保存 → ユースケース層に移動
  - `isAdjacentToEmpty` → ドメインサービスに移動
  - `calculateBoardAndPieceSizes` → `shared/utils/board-layout.ts` に移動
- `PuzzlePage.tsx` の整理
  - `migrateClearHistory` 呼び出しをアプリ初期化時に移動
  - ゲームフェーズ管理を `gamePhaseAtom` に統一

### 成果物

- `src/infrastructure/` ディレクトリ
- `src/presentation/` ディレクトリ（既存コンポーネントの移動とリファクタリング）
- 旧フック・旧 atoms からの移行完了
- 全テストがパスすること

### ブランチ

`refactor/pp-phase4-integration`

---

## Phase 5: テストのリファクタリング

### 目的

- 既存の単体テストを新しいアーキテクチャに合わせてリファクタリング
- E2E テストを拡充する

### 作業内容

#### 5-1. 単体テストのリファクタリング

- **ドメイン層テスト**: モックなしの純粋関数テストに統一
  - `puzzle-board.test.ts` — 集約のテスト
  - `score-calculator.test.ts` — スコア計算テスト
  - `shuffle-service.test.ts` — シャッフルテスト
  - `adjacency-service.test.ts` — 隣接判定テスト
  - `theme-unlock-service.test.ts` — アンロック判定テスト

- **アプリケーション層テスト**: ポートのみモック
  - `initialize-puzzle.test.ts`
  - `move-piece.test.ts`
  - `complete-puzzle.test.ts`

- **プレゼンテーション層テスト**: フック・コンポーネントのテスト
  - `usePuzzleGame.test.ts` — ドメイン層は実物使用
  - `PuzzleBoard.test.tsx` — UI 表示のテストに特化

- **旧テストの削除**
  - `src/utils/puzzle-utils.test.ts` → ドメイン層テストに移行
  - `src/hooks/usePuzzle.test.tsx` → `usePuzzleGame.test.ts` に移行
  - `src/components/organisms/PuzzleBoard.test.tsx` → UI テストとして再構築

#### 5-2. テストヘルパーの整備

- `src/test-helpers/puzzle-factory.ts` — テストデータ生成
- `src/test-helpers/mock-storage.ts` — ストレージポートのモック実装
- `src/test-helpers/render-with-providers.ts` — Jotai Provider 付きレンダーヘルパー

#### 5-3. E2E テストの拡充

- キーボード操作テスト
- スコア・ランク表示テスト
- テーマアンロックテスト
- スワイプ操作テスト（モバイルエミュレーション）
- ベストスコア更新テスト

### 成果物

- 新アーキテクチャに対応した全テスト
- E2E テスト（10シナリオ）
- テストカバレッジ 80% 以上

### ブランチ

`refactor/pp-phase5-tests`

---

## Phase 6: クリーンアップ

### 目的

- 旧コードの削除
- 後方互換エクスポートの削除
- ドキュメントの更新

### 作業内容

#### 6-1. 旧コードの削除

- `src/utils/puzzle-utils.ts` — ドメイン層に移行済み
- `src/utils/score-utils.ts` — ドメイン層に移行済み
- `src/utils/storage-utils.ts` — バレルエクスポート不要に
- `src/utils/storage/` — インフラ層に移行済み
- `src/hooks/usePuzzle.ts` — `usePuzzleGame.ts` に移行済み
- `src/hooks/useGameState.ts` — `useGameFlow.ts` に移行済み
- `src/store/atoms.ts` — グループ化された atoms に移行済み

#### 6-2. 後方互換の削除

- `atoms.ts` の型再エクスポート削除
- `storage-utils.ts` のバレル再エクスポート削除
- `PuzzleSections.tsx` のバレル再エクスポート整理

#### 6-3. インポートパスの整理

- 全ファイルのインポートパスを新しいディレクトリ構成に更新
- 不要な依存関係の削除

#### 6-4. ドキュメント更新

- `src/features/picture-puzzle/README.md` の更新
- アーキテクチャ図の更新

### 成果物

- クリーンなコードベース
- 全テストがパスすること
- E2E テストがパスすること

### ブランチ

`refactor/pp-phase6-cleanup`

---

## タイムライン

```
Phase 1 ─────┐
              ├── Phase 2 ─────┐
              │                 ├── Phase 3 ─────┐
              │                 │                 ├── Phase 4 ─────┐
              │                 │                 │                 ├── Phase 5 ─────┐
              │                 │                 │                 │                 ├── Phase 6
              ▼                 ▼                 ▼                 ▼                 ▼
    基盤+E2E          ドメイン層       アプリ層         統合         テスト整備     クリーンアップ
```

各フェーズは前のフェーズの完了を前提とする（Phase 2 は Phase 1 の成果物に依存）。

---

## リスク管理

| リスク | 確率 | 影響 | 対策 |
|-------|------|------|------|
| リグレッション発生 | 中 | 高 | E2E テストを Phase 1 で先行整備、各フェーズで全テスト実行 |
| atom 統合時の不整合 | 中 | 中 | Phase 4 で段階的に統合、派生 atom で互換性維持 |
| リファクタリング範囲の膨張 | 高 | 中 | 各フェーズのスコープを厳密に管理、Phase 外の改善は次回に回す |
| パフォーマンス劣化 | 低 | 中 | 大規模分割（32×32）でのベンチマークを Phase 4 で実施 |

---

## 成功基準

1. **全既存テストがパス** — 各フェーズ完了時
2. **E2E テスト 10 シナリオがパス** — Phase 5 完了時
3. **テストカバレッジ 80% 以上** — Phase 5 完了時
4. **ドメイン層が 100% 純粋関数** — Phase 2 完了時
5. **コンポーネントにビジネスロジックなし** — Phase 4 完了時
6. **後方互換エクスポートなし** — Phase 6 完了時
