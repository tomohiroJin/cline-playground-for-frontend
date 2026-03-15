# 迷宮の残響 大規模リファクタリング計画

## 概要

テキスト探索型ローグライトRPG「迷宮の残響（Labyrinth Echo）」のコードベースに対して、大規模なリファクタリングを実施する。
DDD（ドメイン駆動設計）の導入、SOLID 原則・DRY 原則・DbC 原則の徹底、デザインパターンの適用により、将来の機能追加・カスタマイズに耐えうるアーキテクチャへ刷新する。
併せて、E2E テストの導入と既存単体テストのリファクタリングにより、品質保証体制を強化する。

---

## 現状分析

### アーキテクチャ上の課題

| # | 課題 | 深刻度 | 詳細 |
|---|------|--------|------|
| A1 | 型定義の重複・不整合 | **高** | `Player`, `DifficultyDef` 等が `types.ts` と `game-logic.ts` で二重定義。`GameEvent = any` が残存 |
| A2 | 副作用の混在 | **高** | `LabyrinthEchoGame.tsx` の `handleChoice` に音声再生・タイマー・状態更新・メタ更新が密結合 |
| A3 | ドメインロジックの分散 | **高** | ゲームロジックが `game-logic.ts`, `event-utils.ts`, `definitions.ts` に散在し境界が不明確 |
| A4 | 状態管理の肥大化 | **高** | `GameInner` コンポーネントに 20 以上の `useState`。関心の分離が不十分 |
| A5 | ストレージ層の重複 | **中** | `contracts.tsx` と `storage.ts` の `safeAsync` が二重定義。localStorage ラッパーが複数存在 |
| A6 | 条件評価の文字列パース | **中** | `evalCond` が `"hp>30"` 等の文字列を実行時パース。型安全性なし |
| A7 | `any` 型の残存 | **中** | `types.ts` に `eslint-disable @typescript-eslint/no-explicit-any`、`lastRun: any` 等 |
| A8 | オーディオエンジンのシングルトン | **低** | `AudioEngine` が即時実行関数でグローバル状態を保持。テスト困難 |
| A9 | 乱数のハードコード依存 | **中** | `pickEvent` が `shuffle`（内部で `Math.random`）に直接依存。イベント選択の決定論的テストが不可能 |

### テスト上の課題

| # | 課題 | 深刻度 | 詳細 |
|---|------|--------|------|
| T1 | E2E テストの欠如 | **高** | labyrinth-echo 用の E2E テストが存在しない |
| T2 | テストの AAA パターン不徹底 | **中** | Arrange / Act / Assert の分離が不明確なテストが散見 |
| T3 | エッジケーステストの不足 | **中** | 境界値・null・空配列等のテストが不足 |
| T4 | モック戦略の不統一 | **中** | localStorage のモック化が一部のテストでのみ実施 |
| T5 | テストヘルパーの欠如 | **低** | テスト用のファクトリ関数・ビルダーが未整備 |

---

## リファクタリング戦略

### 設計方針

1. **DDD レイヤー分割**: Domain / Application / Infrastructure / Presentation の 4 層に責務を分離
2. **副作用の境界外追放**: ドメイン層を完全な純粋関数で構成し、副作用を Infrastructure / Presentation 層に閉じ込める
3. **型安全性の完全担保**: `any` 型を全廃し、Discriminated Union + 型ガードで型の網羅性を保証
4. **デザインパターンの適用**: Strategy / Factory / Repository / Observer パターンで拡張性を確保
5. **テストファースト**: 各リファクタリングステップでテストを先行し、振る舞いの保全を保証
6. **乱数の注入可能化**: ランダム性を持つ関数（`pickEvent`, `shuffle`）に乱数ソースを外部注入可能にし、E2E テストでの決定論的再現を実現

### DDD レイヤー構成（目標）

```
src/features/labyrinth-echo/
├── domain/                     # ドメイン層（純粋関数・値オブジェクト・エンティティ）
│   ├── models/                 # 値オブジェクト・エンティティ
│   │   ├── player.ts           # Player 値オブジェクト
│   │   ├── game-state.ts       # GameState 集約ルート
│   │   ├── meta-state.ts       # MetaState 集約ルート
│   │   ├── difficulty.ts       # Difficulty 値オブジェクト
│   │   ├── status-effect.ts    # StatusEffect 値オブジェクト
│   │   ├── unlock.ts           # Unlock エンティティ
│   │   └── ending.ts           # Ending 値オブジェクト
│   ├── events/                 # イベントドメイン
│   │   ├── game-event.ts       # GameEvent エンティティ
│   │   ├── condition.ts        # Condition 値オブジェクト（文字列パース廃止）
│   │   ├── outcome.ts          # Outcome 値オブジェクト
│   │   ├── event-selector.ts   # イベント選択戦略（乱数注入対応）
│   │   └── random.ts           # RandomSource 型・デフォルト実装・seed 固定実装
│   ├── services/               # ドメインサービス（純粋関数）
│   │   ├── combat-service.ts   # ダメージ計算・回復・ドレイン
│   │   ├── unlock-service.ts   # アンロック判定・FX 集約
│   │   ├── ending-service.ts   # エンディング判定
│   │   └── title-service.ts    # 称号判定
│   ├── contracts/              # DbC アサーション
│   │   └── invariants.ts       # 不変条件定義
│   └── constants/              # ドメイン定数
│       ├── config.ts           # CFG（ゲーム設定値）
│       ├── floor-meta.ts       # フロアメタ情報
│       ├── difficulty-defs.ts  # 難易度定義
│       ├── unlock-defs.ts      # アンロック定義
│       ├── ending-defs.ts      # エンディング定義
│       └── title-defs.ts       # 称号定義
│
├── application/                # アプリケーション層（ユースケース）
│   ├── use-cases/
│   │   ├── start-run.ts        # ラン開始ユースケース
│   │   ├── process-choice.ts   # 選択処理ユースケース
│   │   ├── proceed-step.ts     # ステップ進行ユースケース
│   │   └── manage-unlocks.ts   # アンロック管理ユースケース
│   └── ports/                  # ポート（インターフェース）
│       ├── storage-port.ts     # ストレージポート
│       └── audio-port.ts       # オーディオポート
│
├── infrastructure/             # インフラ層（外部依存）
│   ├── storage/
│   │   └── local-storage-adapter.ts  # localStorage アダプター
│   └── audio/
│       ├── audio-engine.ts     # AudioEngine（Web Audio API）
│       └── audio-adapter.ts    # AudioPort 実装
│
├── presentation/               # プレゼンテーション層（React）
│   ├── hooks/
│   │   ├── use-game-orchestrator.ts  # ゲーム全体の状態管理
│   │   ├── use-text-reveal.ts        # テキスト逐次表示
│   │   ├── use-visual-fx.ts          # ビジュアルエフェクト
│   │   ├── use-keyboard-control.ts   # キーボード操作
│   │   └── use-image-preload.ts      # 画像プリロード
│   ├── components/             # UI コンポーネント（既存を移動）
│   │   ├── screens/            # 画面単位コンポーネント
│   │   ├── overlays/           # オーバーレイ
│   │   └── shared/             # 共有UI部品
│   └── LabyrinthEchoGame.tsx   # エントリーポイント（薄いシェル）
│
├── __tests__/                  # テスト
│   ├── domain/                 # ドメイン層テスト
│   ├── application/            # アプリケーション層テスト
│   ├── infrastructure/         # インフラ層テスト
│   └── presentation/           # プレゼンテーション層テスト
│
└── index.ts                    # barrel export
```

### 適用する原則・パターン

| 原則/パターン | 適用箇所 | 効果 |
|--------------|---------|------|
| **DRY** | 型定義の一元化、safeAsync の統合、数学関数の共通化 | 変更箇所の局所化 |
| **DbC** | ドメインモデルの不変条件、事前条件・事後条件の明示 | バグの早期検出 |
| **SRP** | GameInner の分割、handleChoice の責務分離 | 理解容易性・テスト容易性 |
| **OCP** | Strategy パターンによる条件評価の拡張 | 新条件追加時の既存コード非変更 |
| **LSP** | AudioPort / StoragePort のインターフェース準拠 | テスト時のモック容易性 |
| **ISP** | ポートインターフェースの最小化 | 不要な依存の排除 |
| **DIP** | ドメイン層がインフラ層に依存しない（ポート経由） | テスト容易性・交換可能性 |
| **Strategy** | `evalCond` → `ConditionEvaluator` 戦略 | 条件の型安全な拡張 |
| **Factory** | `createPlayer` → `PlayerFactory` | 生成ロジックの一元化 |
| **Repository** | `Storage` → `MetaStateRepository` | 永続化の抽象化 |
| **Observer** | アンロック通知 → `UnlockObserver` | イベント伝達の疎結合化 |
| **Reducer** | `GameInner` の 20+ useState → `useReducer` | 状態遷移の予測可能性 |
| **DI (乱数)** | `shuffle` / `pickEvent` に `RandomSource` を注入 | E2E での決定論的再現 |

---

## フェーズ計画

### Phase 0: 準備（テスト基盤強化）
**目的**: リファクタリングの安全ネットを構築

- 既存テストの棚卸しと AAA パターンへのリファクタリング
- テストヘルパー（ファクトリ関数・ビルダー）の整備
- E2E テスト基盤の構築と基本シナリオの作成
- テストカバレッジの現状計測と目標設定

### Phase 1: ドメイン層の抽出
**目的**: 純粋なドメインモデルとドメインサービスを確立

1. **型定義の統合・刷新**
   - `types.ts` と `game-logic.ts` の型を `domain/models/` に統合
   - `any` 型を全廃し、Discriminated Union に置換
   - `Condition` 型を文字列から型付きオブジェクトに変換

2. **値オブジェクト・エンティティの抽出**
   - `Player`, `GameState`, `MetaState` を独立モデルとして定義
   - 不変条件を DbC アサーションとして埋め込み

3. **ドメインサービスの抽出**
   - `game-logic.ts` の関数群を `combat-service.ts`, `unlock-service.ts` 等に再編
   - `definitions.ts` のエンディング・称号判定をサービスに移動

4. **定数の再編**
   - `CFG`, `DIFFICULTY`, `UNLOCKS`, `FLOOR_META` 等を `domain/constants/` に分類

5. **乱数ソースの抽象化**
   - `RandomSource` インターフェースの定義（`random(): number`）
   - `DefaultRandomSource`（`Math.random` ラッパー）の実装
   - `SeededRandomSource`（seed 固定で決定論的な乱数）の実装
   - `shuffle`, `pickEvent` が `RandomSource` を引数で受け取るようリファクタリング

### Phase 2: アプリケーション層の構築
**目的**: ユースケースの明示化とポートの定義

1. **ポートインターフェースの定義**
   - `StoragePort`: save / load / reset
   - `AudioPort`: playSfx / startBgm / stopBgm / setMood / updateCrisis

2. **ユースケースの実装**
   - `StartRunUseCase`: 難易度選択 → プレイヤー生成 → 初期イベント選出
   - `ProcessChoiceUseCase`: 選択 → 結果計算 → 状態更新（純粋部分）
   - `ProceedStepUseCase`: 次イベント選出 → フロア遷移判定（`RandomSource` を注入）
   - `ManageUnlocksUseCase`: アンロック購入 → FX 再計算

3. **ポートにRandomSourceを追加**
   - `RandomPort`: 乱数ソースのインターフェース
   - ユースケースがイベント選択時に `RandomPort` 経由で乱数を取得
   - 本番: `DefaultRandomSource`、E2E テスト: `SeededRandomSource`

### Phase 3: インフラ層の分離
**目的**: 外部依存をアダプターに閉じ込める

1. **ストレージアダプターの実装**
   - `LocalStorageAdapter` が `StoragePort` を実装
   - `safeAsync` の一元化（contracts.tsx と storage.ts の統合）
   - キー管理の一元化

2. **オーディオアダプターの実装**
   - `AudioEngine` をリファクタリング（テスト可能な設計へ）
   - `AudioAdapter` が `AudioPort` を実装
   - BGM 状態管理のカプセル化

### Phase 4: プレゼンテーション層のリファクタリング
**目的**: React コンポーネントとフックの責務を明確化

1. **状態管理の刷新**
   - `GameInner` の 20+ `useState` → `useReducer` + 型安全なアクション
   - カスタムフックの責務を 1 フック 1 責務に分割

2. **コンポーネントの整理**
   - 画面コンポーネントの Props 整理（必要最小限に）
   - 共有 UI 部品の抽出

3. **副作用の集約**
   - 音声再生・タイマー制御を専用フックに集約
   - `useEffect` の依存配列を厳密化（eslint-disable 除去）

### Phase 5: テストリファクタリング・E2E テスト導入
**目的**: テスト品質の向上と E2E カバレッジの確保

1. **単体テストのリファクタリング**
   - ドメイン層テスト: 全ドメインサービス 90% 以上
   - アプリケーション層テスト: 全ユースケース 80% 以上
   - インフラ層テスト: アダプターの振る舞いテスト
   - プレゼンテーション層テスト: フック・コンポーネントの振る舞いテスト

2. **E2E テストの作成**（seed 固定による決定論的テスト）
   - 基本フロー: タイトル → 難易度選択 → 探索 → 結果 → 次イベント（seed 固定でイベント順序を確定）
   - ゲームオーバーフロー: seed 固定で致死イベントを再現 → ゲームオーバー画面 → KP 加算確認
   - エンディング到達: seed 固定でクリア可能なイベント列を再現 → エンディング画面確認
   - 永続化: データ保存・読み込み・リセット
   - キーボード操作: 全画面でのキーボードナビゲーション
   - アンロックシステム: seed 固定で死亡 → KP 獲得 → 購入 → 効果適用確認

### Phase 6: 統合・最適化
**目的**: 全体の整合性確認とパフォーマンス最適化

1. **不要コードの除去**
   - 旧ファイル（`types.ts`, 旧 `game-logic.ts` 等）の削除
   - 未使用エクスポートの除去

2. **パフォーマンス確認**
   - バンドルサイズの前後比較
   - ランタイムパフォーマンスの確認

3. **ドキュメント更新**
   - アーキテクチャ図の作成
   - 開発者向けガイドの更新

---

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| リファクタリング中の機能退行 | **高** | Phase 0 でテスト基盤を先行構築。各ステップで CI 通過を確認 |
| イベントデータ（212KB）の移行 | **中** | event-data.ts は構造を変更せず、型定義のみ刷新 |
| AudioEngine のリファクタリングによる音質変化 | **中** | リファクタリング前後で音声の手動比較を実施 |
| Phase 間の依存によるスケジュール遅延 | **中** | 各 Phase を独立ブランチで進行し、マージ可能な単位で完結させる |
| E2E テストのフレーキーネス | **中** | 乱数ソース注入（SeededRandomSource）により決定論的テストを実現。ランダム依存を排除 |

---

## 成功基準

1. **アーキテクチャ**: DDD 4 層構造が確立され、各層の依存方向が一方向
2. **型安全性**: `any` 型が全廃され、`eslint-disable` が除去
3. **テストカバレッジ**: ドメイン層 90%+、アプリケーション層 80%+、全体 70%+
4. **E2E テスト**: seed 固定による決定論的テスト 6 シナリオ以上が自動化
5. **副作用分離**: ドメイン層に副作用が存在しない
6. **DRY**: 型定義・ユーティリティ関数の重複がゼロ
