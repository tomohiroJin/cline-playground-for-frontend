# Falldown Shooter リファクタリング計画

## 1. 現状分析

### 1.1 アーキテクチャ概要

現在の Falldown Shooter は以下の構成で実装されています。

```
src/features/falldown-shooter/
├── types.ts              # 型定義（全体で共有）
├── constants.ts          # 定数定義
├── utils.ts              # ユーティリティ関数（uid, pick, calcTiming）
├── grid.ts               # グリッド操作（オブジェクトリテラル）
├── block.ts              # ブロック操作（オブジェクトリテラル）
├── bullet.ts             # 弾丸操作（オブジェクトリテラル）
├── collision.ts          # 衝突判定（オブジェクトリテラル）
├── stage.ts              # ステージ管理（オブジェクトリテラル）
├── audio.ts              # 音声システム（IIFE シングルトン）
├── game-logic.ts         # ゲームロジック統合（オブジェクトリテラル）
├── difficulty.ts         # 難易度定義
├── hooks.ts              # 汎用カスタムフック
├── hooks/                # 機能別カスタムフック群
├── components/           # UIコンポーネント群
├── FalldownShooterGame.tsx  # メインコンポーネント（約310行）
└── __tests__/            # テスト群
```

### 1.2 検出された課題

#### アーキテクチャ上の課題

| # | 課題 | 影響 |
|---|------|------|
| A1 | ドメインロジックがオブジェクトリテラル（名前空間パターン）で実装されており、クラスによるカプセル化や継承が不可能 | 拡張性が低い |
| A2 | `types.ts` が全型を一箇所に集約しており、ドメイン境界が不明確 | 変更影響が広範囲に波及 |
| A3 | `FalldownShooterGame.tsx` が約310行あり、全フックの接続・イベントハンドリングを担当 | 単一責任原則違反 |
| A4 | `CONFIG` グローバル定数への直接依存が各モジュールに散在 | テスタビリティの低下、DI不可 |
| A5 | `Audio` が IIFE シングルトンで実装されており、テスト時のモック化が困難 | テスト品質の低下 |
| A6 | `hooks.ts`（ルート）と `hooks/` ディレクトリが並存し、責務が曖昧 | 構造の混乱 |

#### コード品質の課題

| # | 課題 | 影響 |
|---|------|------|
| C1 | `game-logic.ts` の `processBullets` が複雑（ネストが深い、副作用コールバック混在） | 可読性・テスタビリティ低下 |
| C2 | `Block.create` が約70行で複数責任を持つ（ランダム選択、衝突回避、フォールバック） | 単一責任原則違反 |
| C3 | `use-game-controls.ts` 内で `setTimeout` を直接使用（`useSafeTimeout` が存在するのに不使用） | メモリリークのリスク |
| C4 | `use-skill-system.ts` 内で `setTimeout` を直接使用 | 同上 |
| C5 | `collision.ts` の `buildMap` がマップ作成のたびに全グリッドを走査 | パフォーマンス懸念 |
| C6 | スコア計算ロジックが `use-game-loop.ts` 内にインラインで記述 | ロジックの散在 |

#### テストの課題

| # | 課題 | 影響 |
|---|------|------|
| T1 | `processBullets` のテストが存在しない | 最も複雑なロジックがテスト未カバー |
| T2 | `applyExplosion` のテストが存在しない | 爆発処理が未検証 |
| T3 | テストヘルパー（`makeBlock` 等）が各テストファイルに重複定義 | DRY原則違反 |
| T4 | フックのテスト（`use-game-flow`, `use-game-loop` 等）が不足 | カバレッジ不足 |
| T5 | `audio.test.ts` で `eslint-disable` が使用されている | テストの型安全性が低い |
| T6 | 統合テストがDOMクエリに依存しており、内部構造変更に脆い | テストの脆弱性 |

### 1.3 E2E テストの判断

**結論: E2E テストは不要**

理由:
- ゲームは DOM ベース（styled-components + div 要素）で描画されているが、リアルタイムのアクションゲームである
- ゲームループが `setInterval` ベースで動作しており、タイミングに依存する操作を E2E で安定的にテストすることは困難
- キー入力 → 弾丸発射 → 衝突判定 → スコア更新の一連のフローは、統合テスト（Testing Library）で十分にカバー可能
- E2E の導入コスト（Playwright/Cypress のセットアップ、テストの不安定さ対策）に見合うメリットがない

代替として、統合テストの拡充とドメインロジックの単体テスト強化で品質を担保します。

---

## 2. リファクタリング方針

### 2.1 目標アーキテクチャ

DDD（ドメイン駆動設計）のレイヤー構造を導入し、以下の境界を明確化します。

```
src/features/falldown-shooter/
├── domain/                    # ドメイン層（純粋関数・値オブジェクト）
│   ├── models/                # ドメインモデル
│   │   ├── grid.ts            # Grid 値オブジェクト
│   │   ├── block.ts           # Block 値オブジェクト
│   │   ├── bullet.ts          # Bullet 値オブジェクト
│   │   ├── game-state.ts      # GameState 集約ルート
│   │   └── score.ts           # Score 値オブジェクト（スコア計算ロジック）
│   ├── services/              # ドメインサービス
│   │   ├── collision-service.ts
│   │   ├── spawn-service.ts
│   │   └── skill-service.ts
│   ├── types.ts               # ドメイン固有の型定義
│   └── constants.ts           # ドメイン定数
├── application/               # アプリケーション層（ユースケース）
│   ├── game-engine.ts         # ゲームエンジン（ループ管理）
│   ├── score-calculator.ts    # スコア計算サービス
│   └── audio-service.ts       # 音声サービス（インターフェース）
├── infrastructure/            # インフラ層（外部依存）
│   ├── web-audio-adapter.ts   # Web Audio API アダプター
│   └── score-storage-adapter.ts
├── presentation/              # プレゼンテーション層（React）
│   ├── components/            # UIコンポーネント
│   ├── hooks/                 # カスタムフック
│   └── FalldownShooterGame.tsx
├── __tests__/                 # テスト
│   ├── domain/
│   ├── application/
│   ├── presentation/
│   └── helpers/               # テストヘルパー・ファクトリ
└── index.ts
```

### 2.2 適用する設計原則

| 原則 | 適用方法 |
|------|----------|
| **DRY** | テストヘルパーの共通化、スコア計算ロジックの集約 |
| **DbC（契約による設計）** | ドメインモデルの生成時バリデーション、不変条件の保証 |
| **SRP** | `processBullets` の分割、`Block.create` の責務分離 |
| **OCP** | パワーアップ・スキルを Strategy パターンで拡張可能に |
| **LSP** | ドメインモデルの共通インターフェース設計 |
| **ISP** | フックの返り値型を必要最小限に分割 |
| **DIP** | Audio・ScoreStorage を抽象に依存させる |

### 2.3 適用するデザインパターン

| パターン | 適用箇所 |
|----------|----------|
| **Strategy** | パワーアップの効果適用、スキルの発動処理 |
| **Factory** | ブロック・弾丸の生成ロジック |
| **Value Object** | Grid, Block, Bullet, Score の不変データ表現 |
| **Repository** | スコア保存の抽象化 |
| **Adapter** | Audio システムの外部API適合 |
| **Observer** | ゲームイベント（ライン消し、パワーアップ取得等）の通知 |

---

## 3. Phase 分割

各 Phase は独立してコミット・レビュー可能な単位に分割します。
TDD で進め、各 Phase の完了時にテストがすべてパスすることを保証します。

### Phase 1: テスト基盤の整備とテストヘルパーの共通化

**目的:** リファクタリングを安全に進めるためのテスト基盤を構築する

- テストヘルパー・ファクトリの共通モジュール作成
- 既存テストの不足箇所（`processBullets`, `applyExplosion`）のテスト追加
- テストファイル内の重複コード（`makeBlock` 等）をヘルパーに統合
- `audio.test.ts` の `eslint-disable` を除去し型安全なモックに改善

### Phase 2: ドメインモデルの値オブジェクト化

**目的:** コアロジックを純粋関数・不変データとして再設計する

- `Grid` を値オブジェクトクラスに変換（不変性保証、DbC バリデーション）
- `Block` を値オブジェクトクラスに変換（Factory パターンで生成ロジック分離）
- `Bullet` を値オブジェクトクラスに変換
- `Score` 値オブジェクトを新設（スコア計算ロジック集約）
- 各変換ごとにテストを先行して更新（TDD）

### Phase 3: ドメインサービスの抽出

**目的:** 複雑なビジネスロジックをドメインサービスに分離する

- `CollisionService` の抽出（衝突判定ロジック）
- `SpawnService` の抽出（ブロック生成・配置ロジック）
- `SkillService` の抽出（スキル発動処理、Strategy パターン適用）
- `game-logic.ts` の `processBullets` をリファクタリング（責務分割）

### Phase 4: アプリケーション層の構築

**目的:** ユースケースとインフラ層の分離

- `ScoreCalculator` サービスの作成（スコア計算の一元化）
- `AudioService` インターフェースの定義と `WebAudioAdapter` の実装（DIP）
- `ScoreStorageAdapter` の作成（Repository パターン）
- 各サービスのテスト作成

### Phase 5: プレゼンテーション層のリファクタリング

**目的:** React コンポーネントとフックの責務を明確化する

- `FalldownShooterGame.tsx` の分割（接続ロジックの抽出）
- `hooks.ts`（ルート）を `hooks/` に統合
- `use-game-controls.ts` と `use-skill-system.ts` の `setTimeout` を `useSafeTimeout` に統一
- パワーアップの Strategy パターン導入（`use-power-up.ts` のリファクタリング）
- コンポーネントの Props 型を Interface Segregation に従い整理

### Phase 6: テストの総合リファクタリング

**目的:** テスト品質の向上とカバレッジ拡充

- ドメイン層のテストカバレッジ 90% 以上を達成
- 統合テストのリファクタリング（DOM依存の軽減）
- フックのテスト追加（`use-game-flow`, `use-game-loop`, `use-skill-system`）
- テスト記述パターンの統一（AAA パターン、日本語テスト名）
- スナップショットテストがあれば振る舞いテストに置換

### Phase 7: 構成の最終整理と動作検証

**目的:** ディレクトリ構造の最終調整と全体の動作確認

- ディレクトリ構造を目標アーキテクチャに移行
- barrel export (`index.ts`) の更新
- 不要になったファイルの削除
- 全テスト実行・lint チェック
- 手動での動作確認

---

## 4. リスク管理

| リスク | 対策 |
|--------|------|
| リファクタリング中の機能退行 | 各 Phase でテストを先行更新、CI が通ることを確認 |
| Phase 間の依存で手戻り発生 | Phase は独立性を保ち、各 Phase 完了時点で動作する状態を維持 |
| リファクタリング範囲の肥大化 | Phase ごとにスコープを固定し、追加要望は別 Phase に切り出す |
| 既存の外部参照への影響 | `index.ts` の公開 API を維持し、段階的に移行 |

## 5. 前提条件

- 機能の追加・変更は行わない（振る舞いの保持を最優先）
- 既存のテストがすべてパスする状態を常に維持する
- 各 Phase は 1-3 コミットで完了する粒度を目指す
- Conventional Commits に準拠したコミットメッセージを使用する
