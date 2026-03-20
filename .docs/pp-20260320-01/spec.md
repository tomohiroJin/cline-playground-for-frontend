# Picture Puzzle リファクタリング仕様書

## 1. 概要

### 1.1 目的

Picture Puzzle の大規模リファクタリングを実施し、以下を実現する：

- **DDD（ドメイン駆動設計）** の導入によるドメイン境界の明確化
- **DRY 原則** によるコード重複の排除
- **DbC（契約による設計）** による関数の事前条件・事後条件の明確化
- **SOLID 原則** の適用による拡張性の向上
- **副作用の除去** による純粋関数化とテスタビリティの向上
- **E2E テスト** の導入と既存単体テストのリファクタリング

### 1.2 現状分析

#### 現在のアーキテクチャ

```
src/
├── pages/PuzzlePage.tsx          # ページ（状態管理＋表示が混在）
├── components/                    # Atomic Design ベース
│   ├── molecules/                 # PuzzlePiece, ThemeSelector 等
│   └── organisms/                 # PuzzleBoard（ビジネスロジック混在）
├── hooks/                         # カスタムフック（状態＋ロジック混在）
├── utils/                         # ユーティリティ（ドメインロジック散在）
├── types/                         # 型定義
├── data/                          # テーマデータ
└── store/                         # Jotai atoms（フラットな状態管理）
```

#### 主要な課題

| # | 課題 | 詳細 |
|---|------|------|
| 1 | ドメインロジックの散在 | パズル操作ロジックが `utils/puzzle-utils.ts`、`hooks/usePuzzle.ts`、`PuzzleBoard.tsx` に分散 |
| 2 | 隣接判定の重複実装 | `getAdjacentPositions`（utils）と `isAdjacentToEmpty`（PuzzleBoard）で類似ロジックが重複 |
| 3 | 副作用の混在 | `usePuzzle.ts` 内で状態更新（副作用）とビジネスロジックが混在 |
| 4 | 状態管理のフラット構造 | 16個の Jotai atom がフラットに並び、関連する状態のグルーピングがない |
| 5 | コンポーネント責務過剰 | `PuzzleBoard.tsx` が入力処理・表示・クリア履歴保存・動画再生を全て担当 |
| 6 | ストレージ層の直接呼び出し | コンポーネントから直接 `localStorage` 操作関数を呼び出している |
| 7 | テストでのモック過剰 | `usePuzzle.test.tsx` で全ユーティリティをモック化、実装との乖離リスク |
| 8 | E2E テスト未整備 | Picture Puzzle 用の E2E テストが存在しない |
| 9 | マジックナンバー | `maxBoardWidth = 600` 等が定数化されていない |
| 10 | 型の後方互換エクスポート | `atoms.ts` で型の再エクスポートが残存 |

---

## 2. ドメインモデル設計（DDD）

### 2.1 ドメイン概要

Picture Puzzle は「スライドパズルゲーム」ドメインに属する。以下の境界付きコンテキストを定義する。

### 2.2 境界付きコンテキスト

```
┌─────────────────────────────────────────────────────┐
│                    Puzzle Game                       │
├──────────────┬──────────────┬───────────────────────┤
│  Puzzle Core │  Scoring     │  Theme & Content      │
│  (パズル操作) │  (スコア計算) │  (テーマ・画像管理)    │
├──────────────┼──────────────┼───────────────────────┤
│  Game Flow   │  Persistence │  Presentation         │
│  (ゲーム進行) │  (永続化)     │  (UI 表示)            │
└──────────────┴──────────────┴───────────────────────┘
```

### 2.3 値オブジェクト（Value Objects）

#### GridPosition（既存を拡張）

```typescript
// 不変の値オブジェクト
interface GridPosition {
  readonly row: number;
  readonly col: number;
}

// ファクトリ関数 + バリデーション（DbC）
const createGridPosition = (row: number, col: number, division: number): GridPosition => {
  // 事前条件
  assert(row >= 0 && row < division, `row must be in [0, ${division})`);
  assert(col >= 0 && col < division, `col must be in [0, ${division})`);
  return Object.freeze({ row, col });
};
```

#### Division（新規）

```typescript
// 分割数の値オブジェクト
const VALID_DIVISIONS = [2, 3, 4, 5, 6, 8, 10, 16, 32] as const;
type Division = (typeof VALID_DIVISIONS)[number];

const createDivision = (value: number): Division => {
  assert(VALID_DIVISIONS.includes(value as Division), `Invalid division: ${value}`);
  return value as Division;
};
```

#### Score（新規）

```typescript
interface Score {
  readonly totalScore: number;
  readonly rank: PuzzleRank;
}
```

### 2.4 エンティティ

#### PuzzlePiece（リファクタリング）

```typescript
interface PuzzlePiece {
  readonly id: number;
  readonly correctPosition: GridPosition;
  readonly currentPosition: GridPosition;
  readonly isEmpty: boolean;
}

// ドメインメソッドを純粋関数として定義
const isInCorrectPosition = (piece: PuzzlePiece): boolean =>
  piece.correctPosition.row === piece.currentPosition.row &&
  piece.correctPosition.col === piece.currentPosition.col;

const movePieceTo = (piece: PuzzlePiece, position: GridPosition): PuzzlePiece =>
  ({ ...piece, currentPosition: position });
```

### 2.5 集約（Aggregates）

#### PuzzleBoard 集約（新規）

パズルの状態遷移を管理する集約ルート。**副作用を持たない純粋関数群**で構成する。

```typescript
// パズルボードの状態（不変）
interface PuzzleBoardState {
  readonly pieces: readonly PuzzlePiece[];
  readonly emptyPosition: GridPosition;
  readonly division: Division;
  readonly moveCount: number;
  readonly isCompleted: boolean;
}

// コマンド: ピースの移動（純粋関数）
const movePiece = (state: PuzzleBoardState, pieceId: number): PuzzleBoardState => {
  // 事前条件（DbC）
  assert(!state.isCompleted, 'Cannot move piece after completion');

  const pieceIndex = state.pieces.findIndex(p => p.id === pieceId);
  assert(pieceIndex !== -1, `Piece not found: ${pieceId}`);

  const piece = state.pieces[pieceIndex];
  assert(!piece.isEmpty, 'Cannot move empty piece');
  assert(
    isAdjacent(piece.currentPosition, state.emptyPosition),
    'Piece is not adjacent to empty position'
  );

  // ビジネスロジック
  const newPieces = state.pieces.map((p, i) => {
    if (i === pieceIndex) return movePieceTo(p, state.emptyPosition);
    if (p.isEmpty) return movePieceTo(p, piece.currentPosition);
    return p;
  });

  const isCompleted = newPieces.every(p => p.isEmpty || isInCorrectPosition(p));

  // 事後条件（DbC）
  assert(newPieces.length === state.pieces.length, 'Piece count must not change');

  return {
    ...state,
    pieces: newPieces,
    emptyPosition: piece.currentPosition,
    moveCount: state.moveCount + 1,
    isCompleted,
  };
};
```

### 2.6 ドメインサービス

#### ScoreCalculator（リファクタリング）

```typescript
// スコア計算は純粋関数のドメインサービス
interface ScoreInput {
  readonly actualMoves: number;
  readonly optimalMoves: number;
  readonly elapsedSeconds: number;
  readonly hintUsed: boolean;
  readonly division: Division;
}

const calculateScore = (input: ScoreInput): PuzzleScore => {
  // 事前条件
  assert(input.actualMoves >= 0, 'actualMoves must be non-negative');
  assert(input.elapsedSeconds >= 0, 'elapsedSeconds must be non-negative');

  // ... 計算ロジック
};
```

#### ThemeUnlockService（リファクタリング）

```typescript
interface UnlockContext {
  readonly totalClears: number;
  readonly records: readonly PuzzleRecord[];
  readonly themeImageIds: ReadonlyMap<ThemeId, readonly string[]>;
}

const isThemeUnlocked = (condition: UnlockCondition, context: UnlockContext): boolean => {
  // ...
};
```

---

## 3. ディレクトリ構成（リファクタリング後）

```
src/
├── domain/                          # ドメイン層（純粋関数のみ）
│   ├── puzzle/                      # パズルコアコンテキスト
│   │   ├── entities/
│   │   │   └── puzzle-piece.ts      # PuzzlePiece エンティティ
│   │   ├── value-objects/
│   │   │   ├── grid-position.ts     # GridPosition 値オブジェクト
│   │   │   └── division.ts          # Division 値オブジェクト
│   │   ├── aggregates/
│   │   │   └── puzzle-board.ts      # PuzzleBoard 集約
│   │   ├── services/
│   │   │   ├── shuffle-service.ts   # シャッフルロジック
│   │   │   └── adjacency-service.ts # 隣接判定ロジック
│   │   └── index.ts                 # バレルエクスポート
│   │
│   ├── scoring/                     # スコア計算コンテキスト
│   │   ├── score-calculator.ts      # スコア計算
│   │   ├── rank-evaluator.ts        # ランク判定
│   │   └── index.ts
│   │
│   └── theme/                       # テーマ管理コンテキスト
│       ├── theme-unlock-service.ts  # テーマアンロック判定
│       ├── theme-repository.ts      # テーマデータアクセス（インターフェース）
│       └── index.ts
│
├── application/                     # アプリケーション層
│   ├── use-cases/
│   │   ├── initialize-puzzle.ts     # パズル初期化ユースケース
│   │   ├── move-piece.ts            # ピース移動ユースケース
│   │   ├── complete-puzzle.ts       # パズル完成ユースケース
│   │   └── reset-puzzle.ts          # パズルリセットユースケース
│   └── ports/                       # ポート（インターフェース）
│       ├── storage-port.ts          # ストレージアクセスポート
│       └── timer-port.ts            # タイマーポート
│
├── infrastructure/                  # インフラ層
│   ├── storage/
│   │   ├── local-storage-adapter.ts # localStorage アダプタ
│   │   ├── puzzle-records-store.ts  # パズル記録ストア
│   │   └── total-clears-store.ts    # クリア数ストア
│   └── timer/
│       └── browser-timer.ts         # ブラウザタイマー実装
│
├── presentation/                    # プレゼンテーション層
│   ├── pages/
│   │   └── PuzzlePage.tsx
│   ├── components/
│   │   ├── molecules/
│   │   │   ├── PuzzlePiece.tsx
│   │   │   ├── ThemeSelector.tsx
│   │   │   ├── DifficultySelector.tsx
│   │   │   ├── ResultScreen.tsx
│   │   │   ├── ClearHistoryList.tsx
│   │   │   └── ShareButton.tsx
│   │   └── organisms/
│   │       ├── PuzzleBoard.tsx       # UIのみ（ロジック除去）
│   │       ├── ConfettiOverlay.tsx
│   │       └── VideoOverlay.tsx
│   ├── hooks/                        # プレゼンテーション用フック
│   │   ├── usePuzzleGame.ts          # ドメインとUIの橋渡し
│   │   ├── useGameFlow.ts            # ゲームフロー制御
│   │   ├── usePuzzleTimer.ts         # タイマーUI
│   │   ├── useKeyboard.ts            # キーボード操作
│   │   ├── useSwipe.ts               # スワイプ操作
│   │   └── useCompletionOverlay.ts   # オーバーレイ制御
│   ├── store/                        # 状態管理
│   │   ├── puzzle-atoms.ts           # パズル関連 atoms（グループ化）
│   │   ├── game-atoms.ts             # ゲーム進行 atoms
│   │   └── ui-atoms.ts               # UI 状態 atoms
│   └── styles/                       # スタイル定義
│       ├── PuzzlePage.styles.ts
│       ├── PuzzleBoard.styles.ts
│       └── PuzzlePiece.styles.ts
│
├── shared/                           # 共有
│   ├── types/
│   │   ├── puzzle.ts                 # 型定義
│   │   └── geometry.ts               # 幾何学型
│   ├── constants/
│   │   └── puzzle-constants.ts       # 定数定義
│   └── utils/
│       ├── assert.ts                 # DbC アサーション
│       └── format.ts                 # フォーマット関数
│
└── data/
    └── themes.ts                     # テーマデータ
```

---

## 4. 設計原則の適用

### 4.1 DRY 原則

| 対象 | 現状 | 改善後 |
|------|------|--------|
| 隣接判定 | `getAdjacentPositions`（utils）と `isAdjacentToEmpty`（PuzzleBoard）が重複 | `adjacency-service.ts` に統一 |
| ピース位置更新 | `updatePiecesWithMove`（usePuzzle）と `updateEmptyPiecePosition`（utils）が類似 | `PuzzleBoard` 集約内の `movePiece` に統一 |
| 完成判定 | `isPuzzleCompleted`（utils）と `setCompleted`（usePuzzle）が分散 | `PuzzleBoard` 集約の状態遷移として統一 |
| ボードサイズ計算 | `calculateBoardAndPieceSizes` がコンポーネント内に直書き | `shared/utils/board-layout.ts` として抽出 |

### 4.2 DbC（契約による設計）

すべてのドメイン関数に事前条件・事後条件を定義する。

```typescript
// shared/utils/assert.ts
export const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};

// 型付きアサーション（型ガードとして機能）
export function assertDefined<T>(value: T | undefined | null, message: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(`Assertion failed: ${message}`);
  }
}
```

#### 適用箇所

| 関数 | 事前条件 | 事後条件 |
|------|----------|----------|
| `createGridPosition` | `0 <= row < division`, `0 <= col < division` | 返り値が freeze されている |
| `createDivision` | `value ∈ VALID_DIVISIONS` | - |
| `movePiece` | 未完成、ピース存在、隣接 | ピース数不変、空白位置更新 |
| `calculateScore` | `moves >= 0`, `time >= 0` | `score >= 0` |
| `shufflePuzzlePieces` | `division > 0`, `pieces.length > 0` | ピース数不変 |

### 4.3 SOLID 原則

#### S — 単一責任原則（SRP）

| 現状のクラス/関数 | 責務 | 分割後 |
|------------------|------|--------|
| `PuzzleBoard.tsx` | UI表示 + 入力処理 + クリア履歴保存 + 動画再生 | `PuzzleBoard.tsx`（表示のみ）+ `usePuzzleInput.ts`（入力）+ ユースケース層（保存） |
| `usePuzzle.ts` | 状態管理 + ビジネスロジック + 副作用 | `PuzzleBoard` 集約（ロジック）+ `usePuzzleGame.ts`（状態管理のみ） |
| `useGameState.ts` | ゲームフロー + スコア計算 + ストレージ保存 | `useGameFlow.ts`（フロー）+ ユースケース（計算・保存） |

#### O — 開放閉鎖原則（OCP）

- **テーマアンロック**: `UnlockCondition` の型を Union Type で拡張可能に設計済み → Strategy パターンで各条件の評価ロジックを分離
- **スコア計算**: ペナルティ計算を `PenaltyStrategy` インターフェースで拡張可能に

```typescript
// Strategy パターンによるアンロック条件の拡張
interface UnlockStrategy {
  evaluate(context: UnlockContext): boolean;
}

const unlockStrategies: Record<UnlockCondition['type'], UnlockStrategy> = {
  always: { evaluate: () => true },
  clearCount: { evaluate: (ctx) => ctx.totalClears >= ctx.requiredCount },
  themesClear: { evaluate: (ctx) => /* ... */ },
};
```

#### L — リスコフの置換原則（LSP）

- 値オブジェクトのファクトリ関数は、バリデーション済みの値を返すことを保証
- ポートインターフェースの実装は、契約を満たすことを保証

#### I — インターフェース分離原則（ISP）

```typescript
// ストレージポート: 読み取りと書き込みを分離
interface ReadableStorage<T> {
  read(): T;
}

interface WritableStorage<T> {
  write(value: T): void;
}

interface StoragePort<T> extends ReadableStorage<T>, WritableStorage<T> {}
```

#### D — 依存性逆転原則（DIP）

```
ドメイン層 → ポート（インターフェース） ← インフラ層（実装）

domain/puzzle/aggregates/puzzle-board.ts
  → 純粋関数のみ。外部依存なし。

application/use-cases/complete-puzzle.ts
  → StoragePort を通じてデータ保存（具体実装に依存しない）

infrastructure/storage/local-storage-adapter.ts
  → StoragePort を実装
```

### 4.4 デザインパターン

| パターン | 適用箇所 | 目的 |
|---------|----------|------|
| **Strategy** | テーマアンロック条件の評価 | 新しいアンロック条件を追加時にコード変更不要 |
| **Repository** | ストレージアクセス | データ永続化の抽象化 |
| **Factory** | 値オブジェクト生成 | バリデーション付きオブジェクト生成の一元化 |
| **Adapter** | localStorage ↔ ドメインモデル変換 | インフラ層とドメイン層の結合度低減 |
| **Observer** | ゲーム完成イベント | スコア計算・履歴保存・紙吹雪表示のデカップリング |
| **State** | ゲームフロー（タイトル→セットアップ→プレイ→リザルト） | 状態遷移の明確化 |

---

## 5. 状態管理の再設計

### 5.1 Jotai atoms のグループ化

現在の16個のフラットな atom を、関心ごとにグループ化する。

#### puzzle-atoms.ts（パズルコア状態）

```typescript
// パズルボード状態を1つの atom にまとめる
export const puzzleBoardStateAtom = atom<PuzzleBoardState>({
  pieces: [],
  emptyPosition: null,
  division: 4,
  moveCount: 0,
  isCompleted: false,
});

// 派生 atom（読み取り専用）
export const correctRateAtom = atom(get => {
  const state = get(puzzleBoardStateAtom);
  return calculateCorrectRate(state.pieces);
});
```

#### game-atoms.ts（ゲーム進行状態）

```typescript
export const gamePhaseAtom = atom<'title' | 'setup' | 'playing' | 'result'>('title');
export const selectedImageAtom = atom<PuzzleImage | null>(null);
export const elapsedTimeAtom = atom<number>(0);
export const scoreAtom = atom<PuzzleScore | null>(null);
```

#### ui-atoms.ts（UI 状態）

```typescript
export const hintModeEnabledAtom = atom<boolean>(false);
export const overlayVisibleAtom = atom<boolean>(true);
export const videoPlaybackAtom = atom<{ enabled: boolean; url: string | null }>({
  enabled: false,
  url: null,
});
```

---

## 6. テスト戦略

### 6.1 テストピラミッド

```
          /\
         /E2E\          ← ユーザーシナリオテスト（Playwright）
        /------\
       / 結合   \        ← フック + ドメインの統合テスト
      /----------\
     /  ユニット   \      ← ドメインロジックの純粋関数テスト
    /--------------\
```

### 6.2 単体テストのリファクタリング方針

#### 現状の課題

1. **過剰なモック**: `usePuzzle.test.tsx` で `puzzle-utils` を全てモック → 実装変更時にテストが追従しない
2. **AAA パターン不統一**: 一部テストで Arrange / Act / Assert が不明確
3. **テスト名の不統一**: 日本語の記述レベルにばらつき
4. **重複セットアップ**: `setupCustomPuzzle` 等のヘルパーが各ファイルに散在

#### リファクタリング後の方針

| レイヤー | テスト対象 | モック方針 | テストフレームワーク |
|---------|-----------|-----------|-------------------|
| ドメイン層 | 純粋関数 | **モックなし**（純粋関数なので不要） | Jest |
| アプリケーション層 | ユースケース | ストレージポートのみモック | Jest |
| プレゼンテーション層 | フック | ドメイン層は実物使用、ストレージはモック | Jest + Testing Library |
| コンポーネント | UI 表示 | フックをモック | Jest + Testing Library |

#### テストヘルパーの共通化

```typescript
// test-helpers/puzzle-factory.ts
export const createTestPiece = (overrides?: Partial<PuzzlePiece>): PuzzlePiece => ({
  id: 0,
  correctPosition: { row: 0, col: 0 },
  currentPosition: { row: 0, col: 0 },
  isEmpty: false,
  ...overrides,
});

export const createTestBoard = (division: number): PuzzleBoardState => {
  // 実際のドメインロジックを使用（モックなし）
  const { pieces, emptyPosition } = generatePuzzlePieces(division);
  return { pieces, emptyPosition, division, moveCount: 0, isCompleted: false };
};
```

### 6.3 E2E テスト（Playwright）

#### テストシナリオ

| # | シナリオ | 操作 | 検証 |
|---|---------|------|------|
| 1 | ゲーム開始フロー | タイトル → 画像選択 → 難易度選択 → 開始 | パズルボードが表示される |
| 2 | ピース移動 | 空白に隣接するピースをクリック | ピースが移動し、手数がカウントされる |
| 3 | キーボード操作 | 矢印キーで操作 | 対応するピースが移動する |
| 4 | ヒントモード | ヒントボタンをクリック | ヒント画像が表示/非表示される |
| 5 | パズル完成 | 全ピースを正しい位置に配置 | リザルト画面が表示される |
| 6 | スコア表示 | パズル完成後 | スコア、ランク、ベストスコア更新が表示される |
| 7 | リトライ | リザルト画面で「もう一度」 | パズルがリシャッフルされる |
| 8 | セットアップに戻る | リザルト画面で「戻る」 | セットアップ画面に戻る |
| 9 | テーマアンロック | 累計クリア数を満たす | 新しいテーマが選択可能になる |
| 10 | スワイプ操作 | モバイルでスワイプ | ピースが移動する |

#### E2E ディレクトリ構成

```
e2e/
├── picture-puzzle/
│   ├── game-flow.spec.ts        # ゲームフロー全体
│   ├── piece-movement.spec.ts   # ピース移動操作
│   ├── keyboard.spec.ts         # キーボード操作
│   ├── hint-mode.spec.ts        # ヒントモード
│   ├── completion.spec.ts       # パズル完成・スコア
│   ├── theme-unlock.spec.ts     # テーマアンロック
│   └── helpers/
│       └── puzzle-page.ts       # ページオブジェクト
```

---

## 7. 移行戦略

### 7.1 段階的移行（Strangler Fig パターン）

既存コードを一度に書き換えるのではなく、新しいドメイン層を作成し、段階的に移行する。

```
Phase 1: ドメイン層の構築
  → 既存コードに影響なし。純粋関数としてドメインロジックを抽出・テスト。

Phase 2: アプリケーション層の構築
  → ユースケースを作成。既存フックからユースケース呼び出しに切り替え。

Phase 3: プレゼンテーション層のリファクタリング
  → コンポーネントとフックの責務整理。状態管理のグループ化。

Phase 4: インフラ層の整理
  → ストレージアクセスをポート経由に変更。

Phase 5: テストのリファクタリング
  → 単体テストの改善。E2E テストの追加。

Phase 6: クリーンアップ
  → 旧コードの削除。後方互換エクスポートの削除。
```

### 7.2 移行時のリスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| 既存機能のリグレッション | ユーザー影響大 | E2E テストを Phase 1 で先に整備 |
| 状態管理の atom 統合時の不整合 | ゲーム動作不良 | 段階的に atom を統合、各段階でテスト |
| 型定義の変更による広範な修正 | 開発速度低下 | 型エイリアスで後方互換を維持しつつ移行 |

---

## 8. 非機能要件

### 8.1 パフォーマンス

- 純粋関数化により React の再レンダリング最適化（メモ化しやすい）
- 大規模分割（32×32 = 1024ピース）でもスムーズな操作を維持
- atom のグループ化により不要な再レンダリングを削減

### 8.2 保守性

- ドメインロジックが純粋関数のため、フレームワーク非依存でテスト可能
- 明確なレイヤー分離により、変更影響範囲が限定的
- DbC により関数の使用法が自明

### 8.3 拡張性

- 新しいアンロック条件の追加: `UnlockCondition` 型と `unlockStrategies` に追加するだけ
- 新しいスコア計算ルール: `PenaltyStrategy` の追加で対応
- 新しい操作方法（ゲームパッド等）: `useGamepadInput.ts` を追加するだけ
