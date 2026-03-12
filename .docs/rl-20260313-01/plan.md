# RISK LCD リファクタリング計画

## 概要

RISK LCD モジュールのリファクタリングを計画駆動で実施する。
将来の機能拡張に備え、純粋関数の抽出・副作用の分離・インターフェースによる境界強化を行う。

## 前提：RISK LCD の特性

このゲームは **タイマー駆動の自動進行型 LCD ゲーム** であり、以下の特性を持つ：

- ゲームサイクルは `setTimeout` チェーンで自動進行（プレイヤー操作で進まない）
- プレイヤー操作は **左右移動のみ**（3レーン間の移動）
- GameState は **ミュータブルに直接操作**（40箇所以上で `g.field = value`）
- アニメーション（カスケード表示）とゲームロジック（被弾判定）がタイマー内で結合
- 通常モードは `Math.random()` で非決定論的

これらの特性により、以下は **不適切** と判断した：

| 不採用の手法 | 理由 |
|-------------|------|
| DDD 4層アーキテクチャ | ファイル数・複雑性が2-3倍に膨らむ。ゲームの規模に対して過剰 |
| GameState の Immutable 値オブジェクト化 | 40箇所以上のミュータブル操作の書き換えが必要。ゲームループの性能・開発効率を損なう |
| ドメインイベント（Observer パターン） | タイマーベースのカスケードアニメーションと相性が悪い |
| Playwright E2E テスト | タイマー駆動の自動進行型ゲームでは再現性がない。通常モードは非決定論的 |
| types.ts の4ファイル分割 | 198行のファイルを分割するとナビゲーションコストが増すだけ |

## 目的

1. **テスタビリティの向上**: ドメインロジックを純粋関数として抽出し、テスト可能にする
2. **保守性の向上**: 巨大フックの責務分割（useRunningPhase: 593行、useGameEngine: 489行）
3. **副作用の分離**: UI 更新・音声・タイマーをドメインロジックから分離
4. **テスト強化**: 単体テストの大幅拡充 + 統合テスト（Jest + fake timers）の導入
5. **品質基準の確立**: カバレッジ閾値の設定

## 適用原則

| 原則 | 適用方針 |
|------|----------|
| DRY | セグメント初期化の統一、重複ロジックの共通関数化 |
| DbC | 純粋関数に事前条件・事後条件のアサーションを追加（開発時のみ） |
| SRP | 1関数 = 1責務。巨大関数の分割 |
| OCP | Strategy パターンによる RNG 切り替え |
| ISP | インターフェースの導入（Storage、Audio、RNG） |
| DIP | インフラ層（localStorage、Web Audio）への依存をインターフェース経由に |

## アーキテクチャ設計

### 現状の構成

```
features/risk-lcd/
├── components/   ← UI + 一部ドメインロジック混在
├── hooks/        ← 副作用 + ビジネスロジック混在
│   └── phases/   ← フェーズ別フック（良い分離だが内部が肥大）
├── utils/        ← 純粋関数（良好）
├── constants/    ← 定数定義（良好）
└── types.ts      ← 型定義（良好、分割不要）
```

### 目標の構成（段階的改善）

```
features/risk-lcd/
├── domain/                    ← 新規：純粋関数のドメインサービス層
│   ├── judgment.ts            ← 被弾判定・回避判定（resolve から抽出）
│   ├── judgment.test.ts
│   ├── scoring.ts             ← スコア計算・コンボ計算（game-logic.ts から移行・拡張）
│   ├── scoring.test.ts
│   ├── obstacle.ts            ← 障害物配置ロジック（pickObs から抽出）
│   ├── obstacle.test.ts
│   ├── stage-progress.ts      ← ステージ進行・クリア判定
│   ├── stage-progress.test.ts
│   ├── style-merge.ts         ← スタイルマージ（game-logic.ts から移行）
│   ├── style-merge.test.ts
│   └── index.ts
├── interfaces/                ← 新規：インフラ境界のインターフェース
│   ├── storage.ts             ← 永続化インターフェース
│   ├── audio.ts               ← 音声インターフェース
│   ├── rng.ts                 ← 乱数インターフェース（既存 RngApi の昇格）
│   └── index.ts
├── hooks/                     ← 既存：リファクタリング
│   ├── useGameEngine.ts       ← 責務を絞る（フェーズオーケストレーション + React 状態管理）
│   ├── useStore.ts            ← 機能別ヘルパー関数に分割
│   ├── useAudio.ts            ← マジックナンバー定数化
│   ├── useInput.ts            ← 現状維持
│   └── phases/
│       ├── useRunningPhase.ts  ← domain/ の純粋関数を呼び出すよう変更
│       ├── usePerkPhase.ts     ← 現状維持（68行で適切）
│       ├── useShopPhase.ts     ← ショップロジックを純粋関数に抽出
│       └── useResultPhase.ts   ← 現状維持（94行で適切）
├── components/                ← 既存：軽微な整理
├── utils/                     ← 既存：domain/ への移行後に縮小
├── constants/                 ← 既存：現状維持
├── types.ts                   ← 既存：現状維持（サブグルーピングのみ）
└── index.ts
```

**変更点の要約**:
- `domain/` を新設（純粋関数の抽出先）
- `interfaces/` を新設（インフラ境界の定義）
- 既存の `hooks/` は構成を維持しつつ、内部ロジックを `domain/` に委譲
- `components/` は大きな構成変更なし
- `types.ts` は1ファイルのまま維持

## フェーズ計画

### Phase 1: ドメインロジックの純粋関数化

**目標**: useRunningPhase / game-logic.ts からドメインロジックを純粋関数として抽出

1. 被弾判定の抽出（resolve → domain/judgment.ts）
2. スコア計算の拡充（game-logic.ts → domain/scoring.ts に移行・統合）
3. 障害物配置の抽出（pickObs → domain/obstacle.ts）
4. ステージ進行の抽出（→ domain/stage-progress.ts）
5. スタイルマージの移行（mergeStyles → domain/style-merge.ts）
6. 各純粋関数の単体テスト作成（カバレッジ 90% 以上）
7. useRunningPhase から純粋関数を呼び出すよう変更
8. 旧 utils/game-logic.ts の re-export で後方互換性維持

**成果物**: domain/ ディレクトリ + テスト

**リスク軽減**: 各抽出は独立して実施可能。1つずつ抽出→テスト→統合の小さなサイクルで進める

### Phase 2: インターフェース導入と useStore 分割

**目標**: インフラ依存をインターフェース経由にし、useStore を機能単位で整理

1. RNG インターフェースの定義（既存 RngApi を interfaces/ に昇格）
2. Storage インターフェースの定義
3. Audio インターフェースの定義
4. useStore のヘルパー関数分離（ポイント管理 / スタイル管理 / デイリー管理）
5. useStore の reportDailyPlay 内の報酬計算を domain/scoring.ts に移動
6. useAudio のマジックナンバーを音声設定定数に統合
7. 各テスト作成・更新

**成果物**: interfaces/ ディレクトリ + useStore 改善

**Phase 1 との並行性**: Phase 1 と独立して着手可能（interfaces/ は domain/ に依存しない）

### Phase 3: useRunningPhase の責務分割

**目標**: 593行の useRunningPhase を複数の責務に分割

1. nextCycle のアニメーション制御部分を分離（タイマーチェーン管理）
2. resolve の UI 更新部分を分離（patch, showPop, updArt の呼び出し）
3. セグメント初期化の共通関数化（DRY 違反の解消）
4. useGameEngine の dispatch 関数の整理
5. 循環依存（endGameRef, showPerksRef, announceRef）の改善
6. 各テスト作成・更新

**成果物**: useRunningPhase を 300行以下に削減

**注意**: タイマーベースのアニメーション制御は本質的にある程度の長さが必要。
無理な分割はかえって可読性を下げるため、300行を目安とする。

### Phase 4: テスト強化

**目標**: テストカバレッジの大幅拡充

1. 統合テスト（Jest + fake timers + renderHook）の導入
   - ゲームサイクルの進行テスト（タイマー制御で決定論的に検証）
   - フェーズ遷移テスト（idle → announce → warn → judge → resolve）
   - デイリーモードの再現性テスト（シード固定）
2. コンポーネントテスト（Testing Library）の追加
   - TitleScreen、ResultScreen、PerkSelectScreen 等のメニュー画面
3. 既存テストのリファクタリング
4. jest.config.js にカバレッジ閾値を追加

**E2E テストについて**:
RISK LCD はタイマー駆動の自動進行型ゲームであり、Playwright E2E は不適切。
代わりに、Jest の `useFakeTimers` と `renderHook` を使った **統合テスト** で
ゲームフローの検証を行う。これにより：
- タイマーを `jest.advanceTimersByTime()` で制御可能
- RNG をモック/シード固定で決定論的に検証可能
- フック内部の状態変化を直接検証可能

**成果物**: 統合テスト + コンポーネントテスト + カバレッジ閾値設定

### Phase 5: 仕上げ（DbC・DRY・最適化）

**目標**: 品質の最終確認と仕上げ

1. DbC アサーション追加（開発環境のみ）
2. マジックナンバーの排除確認
3. DRY 違反の最終チェック
4. wPick の Set 最適化
5. 未使用コードの削除
6. 全テスト通過 + カバレッジ確認

**成果物**: 品質基準達成

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| リファクタ中の機能回帰 | 高 | 各ステップで既存テスト通過を必須とする |
| 純粋関数抽出時の仕様漏れ | 中 | useRunningPhase の resolve を読み込んでから抽出 |
| 統合テストの fake timers 制御の複雑さ | 中 | まずシンプルなケースから始める |
| 大規模変更による開発停止 | 中 | Phase 単位で独立してマージ可能にする |

## 成功基準

- [ ] domain/ のカバレッジ: branches 85%, functions 90%, lines 90% 以上
- [ ] risk-lcd 全体のカバレッジ: branches 50%, functions 60%, lines 60% 以上
- [ ] 統合テスト: ゲームサイクル・フェーズ遷移の主要パターンを網羅
- [ ] コンポーネントテスト: メニュー画面 5 画面以上
- [ ] useRunningPhase を 300 行以下に削減
- [ ] 循環依存の改善（ref 経由の相互参照を最小化）
- [ ] `any` 型使用ゼロ
- [ ] 全既存テスト通過
- [ ] ブラウザでの動作確認（通常/デイリー/ショップ/チュートリアル）
