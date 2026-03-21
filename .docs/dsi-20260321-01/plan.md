# Deep Sea Interceptor リファクタリング計画

## 1. 現状分析

### 1.1 プロジェクト概要

Deep Sea Interceptor は React + TypeScript で実装された縦スクロール型シューティングゲームです。
DOM ベースのレンダリング（SVG + div）を使用しており、Canvas は未使用です。

### 1.2 現在のファイル構成

```
src/features/deep-sea-interceptor/
  __tests__/
    collision.test.ts
    enemy-ai.test.ts
    entities.test.ts
    game-logic.test.ts
    game-logic-subfunctions.test.ts
    movement.test.ts
    weapon.test.ts
  components/
    BulletSprite.tsx
    EnemySprite.tsx
    HUD.tsx
    PlayerSprite.tsx
    TouchControls.tsx
  achievements.ts
  audio.ts
  collision.ts
  constants.ts
  DeepSeaInterceptorGame.tsx
  enemy-ai.ts
  entities.ts
  game-logic.ts
  hooks.ts
  index.ts
  movement.ts
  styles.ts
  test-helpers.ts
  types.ts
  weapon.ts
```

### 1.3 検出された問題点

#### アーキテクチャ上の問題

1. **ドメイン境界の不在**: ゲームロジック、エンティティ生成、UI が同一レイヤーに混在し、ドメイン層が明確でない
2. **`game-logic.ts` の肥大化**: 785行の巨大ファイルに環境ギミック・衝突処理・ステージ進行・入力処理が集約されている
3. **`updateFrame` 関数の副作用**: `GameState` を直接ミューテーションしており、純粋関数とコメントされているが実態は副作用あり（`gd.player.x += force` 等）
4. **`hooks.ts` の責務過多**: 入力処理、ゲームループ、実績チェック、オーディオ制御がすべて1つのフックに集約

#### 設計原則違反

5. **DRY 違反**: ボス判定ロジック（`isBoss`）が `entities.ts` と `EnemySprite.tsx` で重複定義
6. **OCP 違反**: ギミック追加時に `game-logic.ts` の `switch` 文を直接変更する必要がある
7. **SRP 違反**: `processItemCollection` がUI変更・敵HP変更・弾クリアの3責務を持つ
8. **DbC 不在**: 事前条件・事後条件のチェックが一切ない（例: `EntityFactory.enemy` の `type` パラメータが `string` 型）
9. **マジックナンバー散在**: `game-logic.ts` 内の `3000`（コンボタイマー）、`2000`（ボス撃破後待機）等が定数化されていない

#### コード品質の問題

10. **型安全性の不足**: `EnemyConfig` のキーが `Record<string, ...>` で、型による制限がない
11. **`uniqueId` のグローバル状態**: クロージャによるグローバルカウンタが存在し、テスト間の独立性を損なう可能性
12. **`as` キャスト多用**: `processItemCollection` 内で `(uiChanges as UiState)` を多用
13. **`Date.now()` 直接参照**: `BossPatterns` 内で `Date.now()` を直接使用し、テスタビリティを損なう

#### テストの問題

14. **テストカバレッジの偏り**: `achievements.ts`、`audio.ts`、コンポーネント群のテストが存在しない
15. **テストヘルパーの不足**: `test-helpers.ts` が最小限で、テストデータ生成の仕組みが貧弱
16. **`updateFrame` のテスト**: 統合テスト的だが、環境ギミックのテストがない

#### コンポーネントの問題

17. **`DeepSeaInterceptorGame.tsx` の肥大化**: 568行のメインコンポーネントにタイトル画面・リザルト画面・プレイ画面が全て含まれる
18. **インラインスタイル多用**: styled-components が一部のみ適用で、大半がインラインスタイル
19. **表示ロジックの混在**: ボーナス計算等のロジックが JSX テンプレート内に存在

## 2. リファクタリング方針

### 2.1 DDD レイヤード・アーキテクチャの導入

```
domain/        # ドメイン層（純粋なビジネスロジック、外部依存なし）
  entities/    # エンティティ（値オブジェクト含む）
  services/    # ドメインサービス（衝突判定、ダメージ計算等）
  events/      # ドメインイベント（AudioEvent 等）

application/   # アプリケーション層（ユースケース・オーケストレーション）
  game-loop/   # ゲームループ制御
  stages/      # ステージ管理
  achievements/ # 実績管理

infrastructure/ # インフラ層（外部依存）
  audio/       # オーディオシステム
  storage/     # localStorage 操作
  input/       # 入力デバイス抽象化

presentation/  # プレゼンテーション層（React コンポーネント）
  screens/     # 画面（Title, Playing, Result）
  components/  # 共通UIコンポーネント
  hooks/       # React フック
```

### 2.2 デザインパターンの適用

| パターン | 適用箇所 | 目的 |
|---------|---------|------|
| Strategy | 敵移動パターン、ギミック | OCP 準拠、switch 文の排除 |
| Factory Method | エンティティ生成 | 生成ロジックのカプセル化と型安全性強化 |
| Observer/Event | オーディオ・演出イベント | 副作用の分離 |
| Command | 入力処理 | 入力デバイスの抽象化 |
| State | ゲーム画面遷移 | 画面状態管理の明確化 |
| Specification | 実績条件 | 条件ロジックの再利用性向上 |

### 2.3 E2E テストの判断

**結論: E2E テストは導入しない**

理由:
- DOM ベースのレンダリングではあるが、60fps のゲームループで `requestAnimationFrame` を使用
- ゲーム操作がリアルタイム入力（キーボード連打、チャージ操作）に依存
- 敵スポーンやアイテムドロップに `Math.random()` が多用され、再現性が低い
- E2E で検証すべき「ユーザーフロー」（画面遷移: タイトル → プレイ → リザルト）は統合テストで十分カバー可能

代替案:
- 統合テスト（Testing Library）でコンポーネントの画面遷移をテスト
- ドメインロジックの単体テストを拡充して品質を担保

## 3. Phase 構成

### Phase 1: 基盤整備（テスト強化 + 型安全性向上）
既存の動作を壊さずにテストを拡充し、安全にリファクタリングを進める土台を作る。

### Phase 2: ドメイン層の抽出
`game-logic.ts` からドメインロジックを分離し、純粋関数化とドメイン境界を確立する。

### Phase 3: アプリケーション層の整理
ゲームループ、ステージ管理、実績管理をアプリケーション層として再編成する。

### Phase 4: インフラ層の分離
オーディオ、ストレージ、入力処理を抽象化し、テスタビリティを向上させる。

### Phase 5: プレゼンテーション層のリファクタリング
メインコンポーネントの分割、スタイルの統一、画面コンポーネントの整理。

### Phase 6: テストリファクタリングと最終確認
テストコードのリファクタリング、カバレッジ確認、統合テスト追加。

## 4. リスク管理

| リスク | 対策 |
|-------|------|
| リファクタリング中のデグレ | 各 Phase で既存テストが全パスすることを確認 |
| ゲームバランスの崩壊 | ロジック変更時は定数・計算式を変えない |
| パフォーマンス劣化 | Phase 完了ごとに 60fps が維持されているか確認 |
| 過度な抽象化 | ゲーム特化のシンプルな抽象化にとどめる |

## 5. 成功基準

- すべての既存テストがパスすること
- 新規テストカバレッジ: ドメインロジック 90%以上
- `game-logic.ts` を 200行以内の複数ファイルに分割
- `DeepSeaInterceptorGame.tsx` を 100行以内に縮小
- 新しいギミックや敵タイプの追加が既存ファイルの変更なしに可能
