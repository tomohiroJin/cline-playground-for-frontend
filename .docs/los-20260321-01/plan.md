# Labyrinth of Shadows リファクタリング計画

## 1. 現状分析

### 1.1 ファイル構成（現在）

```
src/features/labyrinth-of-shadows/
  LabyrinthOfShadowsGame.tsx   # メインコンポーネント（354行、巨大な God Component）
  types.ts                      # 型定義
  constants.ts                  # 設定値・コンテンツ定義
  game-logic.ts                 # ゲームロジック（345行、オブジェクトリテラル）
  maze-service.ts               # 迷路生成・パスファインディング
  entity-factory.ts             # エンティティ・ゲーム状態の生成
  renderer.ts                   # Canvas 3D レンダリング（301行）
  minimap-renderer.ts           # ミニマップ描画
  audio.ts                      # 音声サービス（AudioContext 管理）
  utils.ts                      # ユーティリティ関数
  index.ts                      # エクスポート
  components/
    TitleScreen.tsx              # タイトル画面
    ResultScreen.tsx             # 結果画面
    HUD.tsx                      # HUD 表示
    Controls.tsx                 # タッチ操作
    Minimap.tsx                  # ミニマップコンポーネント
  __tests__/
    game-logic.test.ts
    maze-service.test.ts
    entity-factory.test.ts
    renderer.test.ts
    audio.test.ts
    utils.test.ts
```

### 1.2 検出された問題点

#### アーキテクチャ上の問題

| # | 問題 | 対象ファイル | 影響度 |
|---|------|-------------|--------|
| A1 | **God Component**: `LabyrinthOfShadowsGame.tsx` がゲームループ、入力処理、画面遷移、HUD 更新、ミニマップ更新を全て担当 | LabyrinthOfShadowsGame.tsx | 高 |
| A2 | **ドメイン境界の不在**: ゲームロジック、描画、音声が型レベルで分離されておらず、`GameState` が全てを保持する巨大な God Object | types.ts, game-logic.ts | 高 |
| A3 | **副作用の混在**: `GameLogic` がグローバルの `AudioService` を直接呼び出し（アイテム取得、ダメージ等）、テスタビリティが低下 | game-logic.ts | 高 |
| A4 | **スタイルの外部依存**: `MazeHorrorPage.styles.ts` が feature 外の `pages/` に存在、コンポーネントの独立性が低い | components/*.tsx | 中 |
| A5 | **オブジェクトリテラルパターン**: `GameLogic`, `MazeService`, `Renderer`, `AudioService` が全て `const obj = { ... }` で定義されており、DI やモック差し替えが困難 | 複数ファイル | 中 |

#### コード品質の問題

| # | 問題 | 対象 | 影響度 |
|---|------|------|--------|
| C1 | **破壊的ミューテーション**: `GameLogic` の全関数が `GameState` を直接変更（副作用） | game-logic.ts | 高 |
| C2 | **マジックナンバー**: `0.45`（衝突判定）, `2.5`（ノックバック）, `99`（初期敵距離）等が散在 | game-logic.ts, LabyrinthOfShadowsGame.tsx | 中 |
| C3 | **省略された命名**: `g`（GameState）, `e`（Enemy）, `d`（distance）, `k`（keys）等、可読性が低い | 複数ファイル | 中 |
| C4 | **`Math.random()` 直接呼び出し**: 迷路生成・敵AI で `Math.random()` を直接使用しており、テストの再現性がない | maze-service.ts, game-logic.ts | 中 |
| C5 | **コンボ判定のハードコーディング**: `10000`（コンボ時間窓）等が定数化されていない | game-logic.ts | 低 |

#### テストの問題

| # | 問題 | 対象 | 影響度 |
|---|------|------|--------|
| T1 | **条件付きテスト（if ガード）**: `if (healItem) { ... }` パターンにより、アイテムが見つからない場合テストがスキップされる | game-logic.test.ts | 高 |
| T2 | **AudioContext モックの重複**: 3つのテストファイルで同じ AudioContext モックが別々に定義 | game-logic.test.ts, renderer.test.ts, audio.test.ts | 中 |
| T3 | **コンポーネントテストの不在**: TitleScreen, ResultScreen, HUD, Controls, Minimap のテストが皆無 | - | 中 |
| T4 | **テストが実装に依存**: `GameStateFactory.create('EASY')` で生成した状態に依存するテストがあり、設定変更で壊れやすい | game-logic.test.ts | 中 |

### 1.3 E2E テストの必要性判断

**結論: E2E テストは限定的に有効**

- このゲームは Canvas ベースの 3D レンダリングを使用しているため、ゲームプレイ自体の E2E テストは非実用的（Canvas ピクセル検証は不安定）
- ただし、以下の DOM ベースの画面遷移フローは E2E テスト可能で価値がある:
  - タイトル画面 → 難易度選択 → ストーリー → ゲーム画面 → 結果画面 の遷移
  - HUD の表示確認
  - ポーズ機能のトグル
- 既存の Playwright 環境が整備済み（`playwright.config.ts`、他ゲームの E2E あり）

---

## 2. リファクタリング方針

### 2.1 DDD ベースのレイヤー構成（目標）

```
src/features/labyrinth-of-shadows/
  domain/                          # ドメイン層（純粋関数、副作用なし）
    models/
      game-state.ts                # GameState 値オブジェクト + 不変更新関数
      player.ts                    # Player ドメインモデル
      enemy.ts                     # Enemy ドメインモデル（タイプ別 Strategy）
      item.ts                      # Item ドメインモデル
      maze.ts                      # Maze 値オブジェクト
    services/
      maze-generator.ts            # 迷路生成（DI 対応の乱数）
      pathfinding.ts               # BFS パスファインディング
      collision.ts                 # 衝突判定
      scoring.ts                   # スコア計算
    types.ts                       # ドメイン型定義
    constants.ts                   # ドメイン定数（ゲームバランス）
    __tests__/                     # ドメイン層テスト
  application/                     # アプリケーション層（ユースケース）
    game-engine.ts                 # ゲームループ管理
    input-handler.ts               # 入力処理
    game-events.ts                 # イベント型定義（副作用のトリガー）
    __tests__/
  infrastructure/                  # インフラ層（副作用あり）
    audio/
      audio-service.ts             # 音声再生
      sound-definitions.ts         # 効果音定義
    rendering/
      renderer.ts                  # 3D レンダリング
      minimap-renderer.ts          # ミニマップ
      brick-texture.ts             # テクスチャ生成
    storage/
      score-repository.ts          # スコア永続化
  presentation/                    # プレゼンテーション層（React コンポーネント）
    LabyrinthOfShadowsGame.tsx     # メインコンポーネント（薄いオーケストレータ）
    hooks/
      use-game-loop.ts             # ゲームループフック
      use-input.ts                 # 入力フック
      use-audio.ts                 # オーディオフック
    components/
      TitleScreen.tsx
      ResultScreen.tsx
      HUD.tsx
      Controls.tsx
      Minimap.tsx
    styles/                        # feature 内にスタイルを移動
      game.styles.ts
  index.ts
```

### 2.2 適用する設計原則

| 原則 | 適用内容 |
|------|---------|
| **DRY** | AudioContext モック共通化、スタイル定義統合、敵 AI の移動コード共通化 |
| **DbC** | ドメインモデルのファクトリで事前条件チェック（迷路サイズ、パラメータ範囲） |
| **SRP** | GameState の責務分割、LabyrinthOfShadowsGame の分割 |
| **OCP** | 敵 AI を Strategy パターンで拡張可能にする |
| **LSP** | Enemy タイプ別 Strategy が共通インターフェースを満たす |
| **ISP** | HUDData, MinimapData 等、表示に必要な最小限のインターフェース |
| **DIP** | GameLogic → AudioService の直接依存をイベント駆動に置換 |

### 2.3 デザインパターン

| パターン | 適用箇所 |
|---------|---------|
| **Strategy** | 敵 AI（Wanderer, Chaser, Teleporter）|
| **Observer / Event** | ゲームイベント → 音声・UI への通知 |
| **Factory Method** | GameState, Enemy, Item の生成 |
| **Builder** | テスト用 GameState ビルダー |
| **Repository** | スコア永続化の抽象化 |

---

## 3. Phase 構成

### Phase 0: 準備（テスト基盤整備）
- テストヘルパー・ビルダーの作成
- AudioContext モックの共通化
- 既存テストの安定化（if ガード除去）

### Phase 1: ドメイン層の抽出
- 型定義の整理（models 分離）
- 定数のドメイン定数化（マジックナンバー除去）
- 純粋関数の抽出（collision, scoring, pathfinding）
- 迷路生成の DI 対応（乱数注入）

### Phase 2: 副作用の分離
- ゲームイベント型の定義
- GameLogic から AudioService 呼び出しを除去（イベント返却に変更）
- GameState の不変更新パターン導入

### Phase 3: 敵 AI リファクタリング（Strategy パターン）
- EnemyStrategy インターフェース定義
- WandererStrategy, ChaserStrategy, TeleporterStrategy 実装
- 既存テストの移行・拡充

### Phase 4: インフラ層の整理
- AudioService のクラス化・DI 対応
- Renderer の分割（背景、壁、スプライト、エフェクト）
- スタイル定義の feature 内移動

### Phase 5: プレゼンテーション層の分割
- カスタムフック抽出（useGameLoop, useInput, useAudio）
- LabyrinthOfShadowsGame のスリム化
- コンポーネントテストの追加

### Phase 6: E2E テスト・最終整備
- 画面遷移の E2E テスト追加
- index.ts のエクスポート整理
- 既存テストの最終リファクタリング

---

## 4. リスク管理

| リスク | 対策 |
|-------|------|
| リファクタリング中の機能退行 | 各 Phase で既存テストが全て通ることを確認してからコミット |
| Canvas レンダリングの動作確認困難 | Renderer のリファクタリングはインターフェースのみ変更し、描画ロジックは保持 |
| GameState の不変化によるパフォーマンス低下 | ゲームループ内は mutable パターンを維持し、ドメイン境界でのみ不変性を強制 |
| 迷路生成のランダム性によるテスト不安定 | 乱数関数を DI 可能にして、テストではシード固定 |
