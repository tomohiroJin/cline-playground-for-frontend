# KEYS & ARMS 大規模リファクタリング計画

## 概要

KEYS & ARMS は Game & Watch 風レトロ LCD アクションゲーム（React + Canvas）。前回のブラッシュアップ（ka-20260226-01）でポーズ機能・ヘルプ画面・演出強化・テスト 80 ケースを達成済み。

本計画では、将来の機能拡張に備えたコードベースの構造的改善を実施する。

### 現状の課題

| カテゴリ | 課題 | 影響 |
|---------|------|------|
| 型安全性 | 全ファイルに `@ts-nocheck`、型定義なし | バグ検出不能、IDE 支援なし |
| 巨大ファイル | cave: 2,500行 / boss: 2,200行 / prairie: 1,800行 | 保守困難、変更影響範囲が不明 |
| 密結合 | ステージ → HUD → Audio → Engine が相互参照 | 個別テスト不能、変更の波及 |
| グローバル状態 | `G` オブジェクトに全状態を格納（型なし） | 副作用の追跡困難、テスト困難 |
| 副作用混在 | ロジック・描画・音声・ストレージが未分離 | 純粋関数テスト不能 |
| DRY 違反 | パーティクル生成、敵描画、座標計算の重複 | 変更漏れリスク |
| テスト不足 | 推定カバレッジ 20-30%、ゲームロジック未テスト | リグレッション検出不能 |

### 設計方針

1. **段階的な型安全化**: `@ts-nocheck` を段階的に除去し、型定義を導入
2. **DDD（ドメイン駆動設計）**: ゲームロジックをドメイン層に抽出、描画・音声と分離
3. **SOLID 原則の適用**: 依存性逆転、単一責任、開放閉鎖の各原則を適用
4. **DbC（契約による設計）**: ドメイン層に事前条件・事後条件のアサーションを導入
5. **副作用の隔離**: Pure Core / Imperative Shell パターンで副作用を外殻に押し出す
6. **既存動作の保全**: 各フェーズでテスト・ビルド・ブラウザ検証を実施

### ブランチ戦略

- ブランチ名: `refactor/ka-large-scale`
- `main` から分岐
- 各 Phase 完了時にテスト・ビルド確認後、PR 作成

---

## Phase 1: 型システム基盤（Type Foundation）

### 目的

`@ts-nocheck` を除去し、全コードに型安全性を導入する。これが後続フェーズの前提条件。

### タスク

1. **型定義ファイル群の作成** (`types/`)
   - `game-state.ts`: ゲーム全体状態（`GameState`）の型定義
   - `engine-context.ts`: エンジンコンテキスト（`EngineContext`）の型定義
   - `stage.ts`: ステージ共通インターフェース（`Stage`）
   - `screen.ts`: 画面共通インターフェース（`Screen`）
   - `input.ts`: 入力状態（`InputState`）の型定義
   - `rendering.ts`: 描画コンテキスト（`DrawingAPI`）の型定義
   - `audio.ts`: オーディオ API（`AudioAPI`）の型定義
   - `particles.ts`: パーティクル（`Particle`, `ParticlePool`）の型定義
   - `hud.ts`: HUD API（`HUDAPI`）の型定義
   - `enemies.ts`: 敵共通型（`Enemy`, `EnemyType`）
   - `constants.ts`: 定数の型（`SpriteData`, `Position`）
2. **`@ts-nocheck` の段階的除去**
   - 優先順位: math.ts → constants.ts → difficulty.ts → particles.ts → rendering.ts → audio.ts → hud.ts → screens/* → engine.ts → stages/*
   - 各ファイルで `@ts-nocheck` を除去 → 型エラーを修正 → テスト通過確認
3. **engine.ts の `G` オブジェクトに `GameState` 型を適用**
4. **EngineContext の型定義と適用**

### 依存関係

- 型定義ファイルの作成が先行
- `@ts-nocheck` 除去は依存関係の浅いファイルから順に実施

### リスク

- **型推論の限界**: クロージャベースの設計で型推論が困難な箇所がある → 明示的型注釈で対処
- **スプライトデータ**: 配列リテラルの型定義が冗長 → `as const` satisfies で対処
- **作業量**: 全ファイルの型付けは大規模 → Phase 1 だけで 2-3 日を見込む

### 成果物

- `src/features/keys-and-arms/types/` ディレクトリ（11 ファイル）
- 全ソースファイルから `@ts-nocheck` 除去
- `npm run typecheck` 通過

---

## Phase 2: ドメイン層の抽出（Domain Layer）

### 目的

ゲームロジック（状態遷移・判定・計算）を描画・音声から分離し、テスト可能なドメイン層を構築する。

### タスク

1. **ドメインディレクトリ構成の作成** (`domain/`)
   - `player/`: プレイヤー状態管理（HP、スコア、位置、アイテム）
   - `enemies/`: 敵 AI・行動パターン（BAT, SPIDER, MIMIC, SHIFTER, DASHER）
   - `combat/`: 戦闘判定・ダメージ計算・コンボシステム
   - `stage-flow/`: ステージ遷移・ループ管理・難易度進行
   - `items/`: 鍵・宝石・シールドの状態管理
   - `boss/`: ボス AI（腕の進攻・レイジウェーブ・カウンター）
   - `shared/`: 共通バリューオブジェクト（Position, HP, Score 等）
2. **ステージロジックの抽出**
   - `cave/index.ts` から: 鍵管理、トラップ判定、部屋ナビゲーション、敵 AI（BAT, SPIDER, MIMIC）
   - `prairie/index.ts` から: レーン管理、敵生成・進行、コンボシステム、スウィープ判定
   - `boss/index.ts` から: 腕 AI、台座管理、シールド配置、レイジウェーブ
3. **バリューオブジェクトの定義**（`domain/shared/`）
   - `Position`: 座標（不変）
   - `HP`: 体力（制約: 0 以上）
   - `Score`: スコア（制約: 0 以上）
   - `BeatCounter`: ビートカウンター（制約: 0 以上、周期性）
4. **ドメインサービスの作成**
   - `CombatService`: ダメージ計算、ヒット判定
   - `StageFlowService`: ステージ遷移ルール、ループ管理
   - `DifficultyService`: 難易度パラメータ算出（既存 `difficulty.ts` を拡張）
5. **DbC（契約による設計）の導入**（`domain/contracts/`）
   - 事前条件: 入力値の範囲チェック（HP >= 0, Score >= 0 等）
   - 事後条件: 状態遷移の整合性チェック
   - 不変条件: ドメインオブジェクトの一貫性保証

### 依存関係

- Phase 1（型定義）が完了していること
- ドメイン層 → ステージファイル分割（Phase 3）の順序

### リスク

- **描画コードとの分離が困難**: ステージファイルでロジックと描画が密に混在 → 描画トリガーをイベントで通知する方式で分離
- **パフォーマンス影響**: 関数呼び出しの増加 → ホットパスのインライン化で対処
- **既存動作の変更リスク**: ロジック抽出時の振る舞い変更 → 既存テスト + 新規テストで保護

### 成果物

- `src/features/keys-and-arms/domain/` ディレクトリ
- 全ドメインロジックが純粋関数として実装
- ドメイン層のテストカバレッジ 85% 以上

---

## Phase 3: アーキテクチャ再構築（Architecture Restructuring）

### 目的

SOLID 原則・デザインパターンを適用し、拡張可能な構造に再構築する。

### タスク

1. **巨大ステージファイルの分割**
   - `cave/index.ts`（2,500行）→ 以下に分割:
     - `cave/cave-logic.ts`: ゲームロジック（鍵管理、部屋遷移、トラップ）
     - `cave/cave-renderer.ts`: 描画処理（背景、キャラクター、エフェクト）
     - `cave/cave-background.ts`: 背景描画（鍾乳石、松明、水滴等）
     - `cave/enemies/`: 敵別ファイル（bat.ts, spider.ts, mimic.ts, rat.ts）
     - `cave/index.ts`: オーケストレーター（100行以内）
   - `prairie/index.ts`（1,800行）→ 同様に分割
   - `boss/index.ts`（2,200行）→ 同様に分割
2. **デザインパターンの導入**
   - **Strategy パターン**: 敵 AI の差し替え可能化
     ```
     interface EnemyBehavior {
       update(enemy: EnemyState, context: StageContext): EnemyState;
       render(enemy: EnemyState, draw: DrawingAPI): void;
     }
     ```
   - **Observer パターン**: ゲームイベント通知（スコア獲得、ダメージ、ステージクリア等）
     ```
     interface GameEventBus {
       emit(event: GameEvent): void;
       on(type: GameEventType, handler: EventHandler): void;
     }
     ```
   - **Command パターン**: 入力処理の抽象化
     ```
     interface InputCommand {
       execute(state: GameState): GameState;
     }
     ```
   - **Factory パターン**: ステージ・敵の生成
     ```
     interface StageFactory {
       create(type: StageType, context: EngineContext): Stage;
     }
     ```
3. **依存性逆転の適用**（DIP）
   - ステージ → HUD の直接参照を、イベントバス経由に変更
   - ステージ → Audio の直接参照を、イベントバス経由に変更
   - engine.ts の遅延バインドを、コンストラクタインジェクションに変更
4. **engine.ts のリファクタリング**
   - 現在 400 行 → 200 行以内を目標
   - 責務: Canvas セットアップ、モジュール組み立て、メインループのみ
   - ゲーム状態管理はドメイン層に委譲
   - 入力処理は InputCommand に委譲

### 依存関係

- Phase 2（ドメイン層）が完了していること
- ステージ分割 → デザインパターン適用の順序

### リスク

- **パフォーマンス影響**: イベントバスのオーバーヘッド → ゲームループ内はダイレクトコールを維持、イベントは非クリティカルパスのみ
- **変更規模**: 全ステージの書き換え → Phase ごとに 1 ステージずつ進める

### 成果物

- 全ステージファイルが 400 行以内
- engine.ts が 200 行以内
- デザインパターン 4 種の導入
- 全モジュール間の循環参照解消

---

## Phase 4: 副作用の隔離（Side Effect Isolation）

### 目的

Pure Core / Imperative Shell パターンを適用し、副作用をアプリケーション境界に集約する。

### タスク

1. **Repository パターンの導入**（localStorage 隔離）
   - `infrastructure/storage-repository.ts`: `GameStorageRepository` インターフェース + 実装
   - テスト用: `InMemoryStorageRepository`
   - 現在の `localStorage.setItem('kaG', ...)` を Repository 経由に変更
2. **Audio サービスの抽象化**
   - `infrastructure/audio-service.ts`: `AudioService` インターフェース + 実装
   - テスト用: `NullAudioService`（音声なし）
   - SFX トリガーをイベントバス経由に変更
3. **Canvas 描画の抽象化**
   - `infrastructure/canvas-renderer.ts`: `CanvasRenderer` 実装
   - テスト用: `NullRenderer`（描画なし）
   - 描画命令を DrawCommand オブジェクトとして発行
4. **入力の抽象化**
   - `infrastructure/input-handler.ts`: `InputHandler` 実装
   - テスト用: `ProgrammaticInputHandler`（プログラムで入力注入）

### 依存関係

- Phase 3（アーキテクチャ再構築）が完了していること

### リスク

- **描画パフォーマンス**: DrawCommand の中間表現はオーバーヘッド → Canvas API 直接呼び出しは維持し、描画ロジックのみ分離
- **音声同期**: イベントバス経由の遅延 → 同期的イベント発行で対処

### 成果物

- `infrastructure/` ディレクトリ
- 全副作用が infrastructure 層に集約
- ドメイン層が純粋関数のみで構成

---

## Phase 5: テスト基盤強化（Test Infrastructure）

### 目的

既存テストのリファクタリング、ドメインテストの拡充、統合テストの追加。

### E2E テストを導入しない理由

KEYS & ARMS は Canvas 2D ベースのリアルタイムアクションゲームであり、以下の理由から E2E テスト（Playwright）は導入しない：

1. **Canvas は DOM 要素を持たない** — Playwright の `getByText()` / `getByRole()` 等のセレクタが使用不可。ゲーム内テキストやボタンは全て Canvas 描画であり、外部から状態を観察できない
2. **リアルタイムアクション操作が必要** — ビート同期、敵回避、カウンター等のタイミング依存操作を自動化することは非現実的
3. **確率的要素** — 敵の出現パターン、ダメージ判定がフレーム単位で変動し、テストの再現性が低い
4. **Primal Path との構造差** — 既存 E2E が成立する Primal Path は React DOM ベース + 自動進行型であり、Canvas + リアルタイムアクションの KEYS & ARMS とは根本的に異なる

**代替戦略**: ドメインユニットテスト + 統合テストでゲームロジックの正しさを保証する。テストピラミッドの下層（ユニット・統合）を厚くすることで、E2E に頼らずにリグレッションを検出する。

```
テスト戦略:
  ドメインユニットテスト（85%+） ← ゲームロジックの正しさ保証
    ↓
  統合テスト                     ← ステージ遷移・ループ進行の保証
    ↓
  手動ブラウザ検証               ← 描画・操作感の最終確認
```

### タスク

1. **既存テストのリファクタリング**
   - テストヘルパーの作成（`__tests__/helpers/`）
     - `test-state-builder.ts`: GameState のビルダーパターン
     - `mock-factories.ts`: モック生成ヘルパー
     - `test-engine.ts`: テスト用エンジン（副作用なし）
   - 既存 80 テストケースの AAA パターン統一
   - テスト名の日本語化（振る舞いベース）
2. **ドメイン層のユニットテスト**
   - `domain/player/` テスト: HP 管理、スコア計算、位置移動
   - `domain/enemies/` テスト: 各敵 AI の行動パターン
   - `domain/combat/` テスト: ダメージ計算、コンボシステム
   - `domain/stage-flow/` テスト: ステージ遷移、ループ管理
   - `domain/items/` テスト: 鍵・宝石・シールド管理
   - `domain/boss/` テスト: ボス AI
   - `domain/contracts/` テスト: DbC アサーション
   - **目標**: ドメイン層カバレッジ 85% 以上
3. **統合テストの追加**
   - ステージ全体の状態遷移テスト（洞窟→草原→ボス）
   - ループ進行テスト（ループ 1→2→3→トゥルーエンド）
   - 入力 → 状態変化の統合テスト（ProgrammaticInputHandler 使用）

### 依存関係

- Phase 4（副作用隔離）完了後が理想だが、ドメインテストは Phase 2 以降で並行可能

### リスク

- **テスト実行時間**: ドメインテスト増加による CI 時間増 → テストの並列実行で対処
- **統合テストの境界**: 副作用（Canvas, Audio）をモック化した上で、ドメイン → ステージロジックの連携をテストする

### 成果物

- テストケース合計: 200+ （現在 80 → 目標 200 以上）
- ドメイン層カバレッジ: 85% 以上
- 全テスト通過 + ビルド成功

---

## Phase 6: 品質・仕上げ（Quality & Polish）

### 目的

DRY 原則の徹底、パフォーマンス最適化、ドキュメント整備。

### タスク

1. **DRY 原則の適用**
   - パーティクル生成パラメータの定数化（プリセット定義）
   - 敵描画の共通化（`EnemyRenderer` クラス）
   - 座標計算の共通ユーティリティ化
   - マジックナンバーの定数化（ヒットストップ値、クールダウン値等）
2. **パフォーマンス最適化**
   - パーティクル配列: `splice` → スワップ削除（O(1)）
   - 背景描画: 静的部分のキャッシュ（OffscreenCanvas）
   - 敵配列: オブジェクトプール化
3. **コード品質の統一**
   - ESLint ルールの適用確認
   - コメントの日本語統一
   - 命名規則の統一（camelCase / PascalCase）
4. **ドキュメント整備**
   - `README.md` の更新（アーキテクチャ図、ディレクトリ構成）
   - 各モジュールの JSDoc コメント

### 依存関係

- Phase 5（テスト基盤）完了後

### リスク

- **パフォーマンス最適化**: 可読性とのトレードオフ → ホットパスのみ最適化
- **OffscreenCanvas**: ブラウザ互換性 → フォールバック実装

### 成果物

- マジックナンバー全除去
- 描画パフォーマンス改善
- ドキュメント完備

---

## 変更ファイル一覧（予定）

### 新規作成

| ディレクトリ | ファイル数 | 内容 |
|------------|----------|------|
| `types/` | 11 | 型定義ファイル群 |
| `domain/player/` | 2-3 | プレイヤードメイン |
| `domain/enemies/` | 5-6 | 敵 AI ドメイン |
| `domain/combat/` | 2-3 | 戦闘ドメイン |
| `domain/stage-flow/` | 2-3 | ステージ遷移ドメイン |
| `domain/items/` | 2-3 | アイテムドメイン |
| `domain/boss/` | 2-3 | ボスドメイン |
| `domain/shared/` | 3-4 | バリューオブジェクト |
| `domain/contracts/` | 1-2 | DbC アサーション |
| `infrastructure/` | 4 | 副作用隔離層 |
| `cave/` 分割ファイル | 5-6 | ステージ分割 |
| `prairie/` 分割ファイル | 4-5 | ステージ分割 |
| `boss/` 分割ファイル | 4-5 | ステージ分割 |
| `__tests__/domain/` | 15-20 | ドメインテスト |
| `__tests__/helpers/` | 3 | テストヘルパー |
| `__tests__/integration/` | 4 | 統合テスト |

### 変更

| ファイル | 内容 |
|---------|------|
| `engine.ts` | 型適用、責務削減、DI 導入 |
| `KeysAndArmsGame.tsx` | 型適用 |
| `constants.ts` | 型適用、定数整理 |
| `difficulty.ts` | 型適用 |
| `styles.ts` | 変更なし（CSS-in-JS） |
| `core/audio.ts` | 型適用、AudioService 抽象化 |
| `core/rendering.ts` | 型適用、DrawingAPI 抽象化 |
| `core/particles.ts` | 型適用、パフォーマンス改善 |
| `core/hud.ts` | 型適用、イベントバス連携 |
| `core/math.ts` | 型適用 |
| `stages/cave/index.ts` | 分割・リファクタリング |
| `stages/prairie/index.ts` | 分割・リファクタリング |
| `stages/boss/index.ts` | 分割・リファクタリング |
| `screens/*.ts` | 型適用 |
| 既存テスト 7 ファイル | AAA パターン統一、名前日本語化 |

---

## 検証方法

各 Phase 完了時に以下を実施:

1. `npm run typecheck` — 型チェック通過（Phase 1 以降）
2. `npm test` — 全テスト通過
3. `npm run lint` — ESLint 通過
4. `npm run build` — ビルド成功
5. ブラウザ確認 — 全 3 ステージ通しプレイ、ポーズ・ヘルプ・演出の動作確認

---

## スケジュール（目安）

| Phase | 内容 | 想定規模 |
|-------|------|---------|
| Phase 1 | 型システム基盤 | 大 |
| Phase 2 | ドメイン層抽出 | 特大 |
| Phase 3 | アーキテクチャ再構築 | 特大 |
| Phase 4 | 副作用隔離 | 大 |
| Phase 5 | テスト基盤強化（ユニット + 統合） | 大 |
| Phase 6 | 品質・仕上げ | 中 |

※ Phase 2, 3 が最も作業量が大きい。段階的に進め、各 Phase 終了時に動作確認を行う。
