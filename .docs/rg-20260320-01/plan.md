# Racing Game 大規模リファクタリング 実装計画書

> 文書ID: RG-20260320-01-PLAN
> 作成日: 2026-03-20
> ブランチ: refactor/racing-game-cleanup
> ステータス: ドラフト

---

## 1. プロジェクト概要

### 1.1 目的

Racing Game のコードベースに対し、DDD（ドメイン駆動設計）を軸とした大規模リファクタリングを実施する。
将来の機能拡張（オンライン対戦、新コース追加、カードシステム拡張等）に対して、柔軟かつ安全に対応できるアーキテクチャを構築する。

### 1.2 現状の課題

| 課題 | 詳細 | 影響ファイル |
|------|------|-------------|
| God Component | `RacingGame.tsx`（758行）に状態管理・ゲームループ・ビジネスロジック・描画制御が混在 | `RacingGame.tsx` |
| 副作用の散在 | `SoundEngine`・`localStorage`・`Date.now()` 等の副作用がロジック内に直接埋め込まれている | `RacingGame.tsx`, `game-logic.ts`, `audio.ts` |
| 境界の不明確さ | ドメインロジック・アプリケーションロジック・インフラストラクチャが同一レイヤーに混在 | 全ファイル |
| 定数の一極集中 | `constants.ts`（288行）に全ドメインの定数が集約 | `constants.ts` |
| テストの脆さ | 内部実装に依存したテストが多く、リファクタリング時に大量のテスト修正が必要 | `__tests__/*.test.ts` |
| 統合テスト不足 | ゲームループ全体のフロー検証テストが存在しない | — |
| DRY 違反 | プレイヤー初期化・入力処理・描画パターンに重複コードが存在 | 複数ファイル |

### 1.3 適用原則・パターン

| 原則/パターン | 適用方針 |
|--------------|---------|
| **DDD** | 境界コンテキストの明確化、集約ルート・値オブジェクト・エンティティの導入 |
| **SOLID** | 単一責任の徹底、インターフェース分離、依存性逆転 |
| **DRY** | 重複コードの関数化・共通モジュール抽出 |
| **DbC（契約による設計）** | 事前条件・事後条件・不変条件の明示（TypeScript 型 + ランタイムアサーション） |
| **Strategy パターン** | CPU AI・コースエフェクト・入力方式の差し替え可能化 |
| **Observer パターン** | ゲームイベント（ラップ完了、衝突等）の通知機構 |
| **Factory パターン** | プレイヤー・デッキ・エンティティの生成を集約 |
| **Repository パターン** | スコア・ゴーストデータの永続化を抽象化 |
| **Command パターン** | 入力をコマンドオブジェクトとして表現し、テスト容易性を向上 |

---

## 2. ターゲットアーキテクチャ

### 2.1 レイヤードアーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                  Presentation 層                      │
│   RacingGame.tsx (薄い Wrapper)                       │
│   hooks/ (useGameLoop, useInput, useIdle)             │
│   components/ (MenuPanel, ResultPanel, VolumeControl) │
├─────────────────────────────────────────────────────┤
│                  Application 層                       │
│   GameOrchestrator (ゲームループ制御)                  │
│   InputProcessor (入力 → コマンド変換)                 │
│   DraftProcessor (ドラフトフロー制御)                  │
│   GameEventBus (イベント通知)                          │
├─────────────────────────────────────────────────────┤
│                    Domain 層                          │
│   player/ (Player, DriftState, HeatState)             │
│   race/ (Race, GamePhase, LapCounter)                 │
│   track/ (Track, Course, WallPhysics, CourseEffect)   │
│   card/ (Card, Deck, CardEffect)                      │
│   highlight/ (Highlight, EventDetector)               │
├─────────────────────────────────────────────────────┤
│                Infrastructure 層                      │
│   renderer/ (Canvas描画: Kart, Track, HUD, Effect)    │
│   audio/ (SoundEngine, AudioEffects)                  │
│   storage/ (ScoreRepository, GhostRepository)         │
│   input/ (KeyboardAdapter, TouchAdapter)              │
└─────────────────────────────────────────────────────┘
```

### 2.2 依存の方向

```
Presentation → Application → Domain ← Infrastructure
                                ↑
                          (依存性逆転)
```

- **Domain 層は外部に一切依存しない**（純粋な TypeScript のみ）
- Infrastructure 層は Domain 層のインターフェースを実装する（依存性逆転）
- Application 層が各層を仲介・オーケストレーションする

### 2.3 ディレクトリ構成（目標）

```
src/features/racing-game/
├── domain/                          # ドメイン層（純粋関数・副作用なし）
│   ├── player/
│   │   ├── player.ts               # Player エンティティ操作
│   │   ├── player-factory.ts       # Player 生成ファクトリ
│   │   ├── drift.ts                # ドリフト値オブジェクト・計算
│   │   ├── heat.ts                 # HEAT値オブジェクト・計算
│   │   ├── cpu-strategy.ts         # CPU AI（Strategy パターン）
│   │   ├── constants.ts            # プレイヤードメイン定数
│   │   └── types.ts                # Player ドメイン型
│   ├── race/
│   │   ├── race.ts                 # Race 集約ルート
│   │   ├── game-phase.ts           # ゲームフェーズ値オブジェクト
│   │   ├── lap-counter.ts          # ラップカウンター
│   │   ├── checkpoint.ts           # チェックポイント判定
│   │   ├── collision.ts            # 衝突判定
│   │   ├── constants.ts            # レースドメイン定数
│   │   └── types.ts
│   ├── track/
│   │   ├── track.ts                # Track エンティティ
│   │   ├── course.ts               # Course 値オブジェクト
│   │   ├── wall-physics.ts         # 壁物理計算
│   │   ├── course-effect.ts        # コース環境効果
│   │   ├── constants.ts            # トラックドメイン定数
│   │   └── types.ts
│   ├── card/
│   │   ├── card.ts                 # Card エンティティ
│   │   ├── deck.ts                 # Deck 集約ルート
│   │   ├── card-effect.ts          # カード効果計算
│   │   ├── card-catalog.ts         # カードマスターデータ
│   │   ├── constants.ts            # カードドメイン定数
│   │   └── types.ts
│   ├── highlight/
│   │   ├── highlight.ts            # Highlight 集約
│   │   ├── event-detector.ts       # イベント検出（Strategy パターン）
│   │   ├── constants.ts
│   │   └── types.ts
│   ├── shared/
│   │   ├── math-utils.ts           # 数学ユーティリティ（純粋関数）
│   │   ├── assertions.ts           # DbC アサーション関数
│   │   └── types.ts                # 共通型（Point, etc.）
│   └── events.ts                   # ドメインイベント型定義
├── application/
│   ├── game-orchestrator.ts        # ゲームループオーケストレーション
│   ├── input-processor.ts          # 入力処理（Command パターン）
│   ├── draft-processor.ts          # ドラフトフロー
│   ├── game-event-bus.ts           # イベントバス（Observer パターン）
│   ├── ports/                      # ポート（インターフェース定義）
│   │   ├── renderer-port.ts        # 描画ポート
│   │   ├── audio-port.ts           # 音声ポート
│   │   ├── storage-port.ts         # 永続化ポート
│   │   └── input-port.ts           # 入力ポート
│   └── types.ts
├── infrastructure/
│   ├── renderer/
│   │   ├── canvas-renderer.ts      # Canvas 描画アダプター
│   │   ├── kart-renderer.ts        # 車体描画
│   │   ├── track-renderer.ts       # トラック描画
│   │   ├── hud-renderer.ts         # HUD 描画
│   │   ├── effect-renderer.ts      # エフェクト描画
│   │   └── draft-renderer.ts       # ドラフトUI描画
│   ├── audio/
│   │   ├── sound-engine.ts         # Web Audio API アダプター
│   │   └── audio-effects.ts        # 効果音定義
│   ├── storage/
│   │   ├── score-repository.ts     # スコア永続化
│   │   └── ghost-repository.ts     # ゴースト永続化
│   └── input/
│       ├── keyboard-adapter.ts     # キーボード入力アダプター
│       └── touch-adapter.ts        # タッチ入力アダプター
├── presentation/
│   ├── RacingGame.tsx              # メインコンポーネント（薄い Wrapper）
│   ├── hooks/
│   │   ├── useGameLoop.ts          # ゲームループフック
│   │   ├── useGameState.ts         # ゲーム状態フック
│   │   └── useIdle.ts              # アイドル検出フック
│   └── components/
│       ├── MenuPanel.tsx
│       ├── ResultPanel.tsx
│       └── VolumeControl.tsx
├── __tests__/
│   ├── domain/                     # ドメイン層単体テスト
│   │   ├── player/
│   │   ├── race/
│   │   ├── track/
│   │   ├── card/
│   │   └── highlight/
│   ├── application/                # アプリケーション層統合テスト
│   ├── integration/                # レイヤー横断統合テスト
│   └── helpers/                    # テスト用ファクトリ・モック
└── index.ts
```

---

## 3. フェーズ計画

### フェーズ概要

```
フェーズ1         フェーズ2          フェーズ3          フェーズ4          フェーズ5
基盤整備     →   ドメイン層    →   アプリ層       →   インフラ層     →   テスト強化
                  リファクタ        リファクタ         リファクタ
```

### フェーズ1: 基盤整備（土台づくり）

**目的**: リファクタリングの安全ネットとなるテスト基盤・共通モジュールを整備する

| ステップ | 内容 | 詳細 |
|---------|------|------|
| 1-1 | ディレクトリ構造の作成 | 新しいレイヤードアーキテクチャのディレクトリを作成（空ファイルなし） |
| 1-2 | 共通ユーティリティの分離 | `utils.ts` → `domain/shared/math-utils.ts` に移行、DbC アサーション関数の導入 |
| 1-3 | 共通型定義の整理 | `types.ts` を各ドメインに分散配置 |
| 1-4 | 既存テストのスナップショット取得 | 現状のテスト結果を記録し、リファクタリング中の回帰テストのベースラインとする |
| 1-5 | スモークテストの作成 | Playwright で最小限の動作確認（ページ表示・ゲーム開始・メニュー復帰）のみ |

### フェーズ2: ドメイン層リファクタリング

**目的**: ビジネスロジックを純粋関数として Domain 層に集約し、副作用を完全に排除する

| ステップ | 内容 | 移行元 → 移行先 |
|---------|------|----------------|
| 2-1 | Player ドメインの構築 | `game-logic.ts`(movePlayer) + `drift.ts` + `heat.ts` → `domain/player/` |
| 2-2 | Track ドメインの構築 | `track.ts` + `wall-physics.ts` + `course-effects.ts` → `domain/track/` |
| 2-3 | Race ドメインの構築 | `game-logic.ts`(checkpoint, collision) + ゲームフェーズ管理 → `domain/race/` |
| 2-4 | Card ドメインの構築 | `draft-cards.ts` + `card-effects.ts` → `domain/card/` |
| 2-5 | Highlight ドメインの構築 | `highlight.ts` → `domain/highlight/` |
| 2-6 | 定数の分散配置 | `constants.ts` → 各 `domain/*/constants.ts` |
| 2-7 | ドメインイベントの定義 | `domain/events.ts` にドメインイベント型を定義 |

**各ステップの進め方**:
1. 既存のテストを新しいパスに移動・アダプト
2. ドメインモデルを新規作成（純粋関数、DbC アサーション付き）
3. 旧モジュールから新モジュールへの委譲（段階的移行）
4. 旧モジュールの re-export を維持（後方互換性）
5. すべてのテストがパスすることを確認
6. 旧モジュールの re-export を削除

### フェーズ3: アプリケーション層リファクタリング

**目的**: ゲームループ・入力処理・ドラフトフローを Application 層に集約し、ドメイン層のオーケストレーションを行う

| ステップ | 内容 | 詳細 |
|---------|------|------|
| 3-1 | ポートインターフェースの定義 | `application/ports/` に描画・音声・永続化・入力のインターフェースを定義 |
| 3-2 | GameOrchestrator の作成 | `RacingGame.tsx` のゲームループロジックを抽出し、純粋なオーケストレーターとして再構成 |
| 3-3 | InputProcessor の作成 | キー入力 → コマンドオブジェクト変換（Command パターン）、CPU AI のStrategy化 |
| 3-4 | DraftProcessor の作成 | `draft-ui-logic.ts` のロジックを Application 層に移行 |
| 3-5 | GameEventBus の作成 | ドメインイベントを Subscribe/Publish する仕組み（Observer パターン） |

### フェーズ4: インフラストラクチャ層リファクタリング

**目的**: 描画・音声・永続化等の外部依存をアダプターとして分離し、ポートインターフェースを実装する

| ステップ | 内容 | 移行元 → 移行先 |
|---------|------|----------------|
| 4-1 | Renderer の分割 | `renderer.ts`(682行) → `infrastructure/renderer/` 配下の責務別ファイル |
| 4-2 | Audio アダプターの整理 | `audio.ts` → `infrastructure/audio/` |
| 4-3 | Storage リポジトリの作成 | `score-storage` 依存 → `infrastructure/storage/score-repository.ts` |
| 4-4 | Input アダプターの整理 | `hooks.ts` → `infrastructure/input/` |

### フェーズ5: テスト強化

**目的**: テスト全体をリファクタリングし、振る舞いベースの堅牢なテストスイートを構築する

| ステップ | 内容 | 詳細 |
|---------|------|------|
| 5-1 | ドメイン層の単体テスト拡充 | 各ドメインモジュールのテストを AAA パターンで再構築、カバレッジ 90% 以上 |
| 5-2 | アプリケーション層の統合テスト | GameOrchestrator の状態遷移テスト、イベントバスの動作テスト（モック Port 注入） |
| 5-3 | レイヤー横断統合テスト | ドメイン層 + アプリケーション層を結合した複合シナリオテスト |
| 5-4 | 旧テストの削除・整理 | 旧パスのテストファイルを削除し、新テスト構成に完全移行 |

> **E2E テストについて**: Canvas 2D ベースのゲームでは、Playwright 等の E2E ツールで
> Canvas 内部の状態（車の移動、ドリフト挙動、HEAT ゲージ等）を検証できないため、
> E2E はスモークテスト（ページ表示・画面遷移の動作確認）に限定する。
> ゲームロジックの検証は、ドメイン層の単体テストとアプリケーション層の統合テストで
> 十分なカバレッジを確保する。

---

## 4. 設計原則の適用詳細

### 4.1 DDD（ドメイン駆動設計）

#### 境界コンテキスト

| コンテキスト | 責務 | 集約ルート |
|-------------|------|-----------|
| Player | プレイヤーの状態管理、移動計算、ドリフト・HEAT | `Player` |
| Race | レース進行、フェーズ遷移、ラップ管理 | `Race` |
| Track | コース情報、壁物理、環境効果 | `Track` |
| Card | カードデータ、デッキ管理、効果適用 | `Deck` |
| Highlight | イベント検出、スコア集計 | `HighlightTracker` |

#### 値オブジェクトの導入例

```typescript
// domain/player/types.ts
// 速度は 0〜1 の範囲に制約された値オブジェクト
type Speed = number & { readonly __brand: unique symbol };

// domain/shared/types.ts
// 角度はラジアン値を表す値オブジェクト
type Angle = number & { readonly __brand: unique symbol };
```

### 4.2 SOLID 原則

#### S: 単一責任の原則

**Before**: `RacingGame.tsx` が状態管理 + ゲームループ + 入力処理 + 描画制御を担当
**After**: 各責務を専用モジュールに分離

| 責務 | 移行先 |
|------|--------|
| ゲーム状態管理 | `presentation/hooks/useGameState.ts` |
| ゲームループ | `application/game-orchestrator.ts` |
| 入力処理 | `application/input-processor.ts` |
| 描画制御 | `infrastructure/renderer/canvas-renderer.ts` |
| ドラフト制御 | `application/draft-processor.ts` |

#### O: 開放閉鎖の原則

- コース環境効果を Strategy パターンで実装し、新コース追加時に既存コードの変更なく拡張可能に
- CPU AI の難易度も Strategy パターンで差し替え可能に

#### L: リスコフの置換原則

- 入力アダプター（Keyboard / Touch）が同一の `InputPort` インターフェースを実装

#### I: インターフェース分離の原則

- 描画ポートを `KartRenderer`, `TrackRenderer`, `HudRenderer` 等に細分化
- 音声ポートを `EngineAudio`, `SfxAudio` 等に分離

#### D: 依存性逆転の原則

- Domain 層がインターフェースを定義し、Infrastructure 層がそれを実装
- Application 層はポート経由で Infrastructure を利用

### 4.3 DbC（契約による設計）

#### アサーション関数の導入

```typescript
// domain/shared/assertions.ts
export function assertInRange(value: number, min: number, max: number, name: string): void {
  if (value < min || value > max) {
    throw new RangeError(`${name} must be between ${min} and ${max}, got ${value}`);
  }
}

export function assertPositive(value: number, name: string): void {
  if (value <= 0) {
    throw new RangeError(`${name} must be positive, got ${value}`);
  }
}
```

#### 適用例

```typescript
// domain/player/drift.ts
export function startDrift(state: DriftState, speed: number): DriftState {
  // 事前条件
  assertInRange(speed, 0, 1, 'speed');

  if (speed < DRIFT.MIN_SPEED) return state;

  const result = { ...state, active: true, duration: 0 };

  // 事後条件
  assert(result.active === true);
  assert(result.duration === 0);

  return result;
}
```

### 4.4 DRY 原則

#### 特定された重複パターンと解決策

| 重複箇所 | 現状 | 解決策 |
|---------|------|--------|
| プレイヤー初期化 | `RacingGame.tsx` 内で inline 生成 | `domain/player/player-factory.ts` に集約 |
| カード効果の合算 | `card-effects.ts` と `game-logic.ts` で類似計算 | `domain/card/card-effect.ts` に単一化 |
| Canvas 描画の共通パターン | `renderer.ts` 内で ctx.save/restore が散在 | `infrastructure/renderer/` の基底ヘルパーに集約 |
| 入力マッピング | `hooks.ts` と `draft-ui-logic.ts` で類似処理 | `application/input-processor.ts` に統一 |
| 時間計算（Date.now） | 複数箇所で `Date.now()` を直接使用 | 時間プロバイダーを注入可能にする |

### 4.5 デザインパターンの適用

#### Strategy パターン

```typescript
// domain/player/cpu-strategy.ts
interface CpuStrategy {
  calculateTurn(player: Player, trackInfo: TrackInfo): number;
  shouldDrift(player: Player, trackInfo: TrackInfo): boolean;
}

class EasyCpuStrategy implements CpuStrategy { ... }
class NormalCpuStrategy implements CpuStrategy { ... }
class HardCpuStrategy implements CpuStrategy { ... }
```

#### Observer パターン（Event Bus）

```typescript
// application/game-event-bus.ts
type GameEvent =
  | { type: 'lap_completed'; player: number; lap: number; time: number }
  | { type: 'collision'; players: [number, number] }
  | { type: 'drift_start'; player: number }
  | { type: 'heat_boost'; player: number }
  | { type: 'race_finished'; winner: number };

interface GameEventListener {
  onEvent(event: GameEvent): void;
}
```

#### Factory パターン

```typescript
// domain/player/player-factory.ts
interface PlayerFactoryConfig {
  position: Point;
  angle: number;
  color: string;
  name: string;
  isCpu: boolean;
}

function createPlayer(config: PlayerFactoryConfig): Player { ... }
function createPlayers(mode: GameMode, course: Course, colors: [string, string]): Player[] { ... }
```

#### Repository パターン

```typescript
// application/ports/storage-port.ts
interface ScoreRepository {
  saveScore(gameId: string, score: number, key: string): Promise<void>;
  getHighScore(gameId: string, key: string, order: 'asc' | 'desc'): Promise<number>;
}
```

---

## 5. 移行戦略

### 5.1 段階的移行（Strangler Fig パターン）

既存のコードを一度に置き換えず、新モジュールに段階的に委譲していく。

```
Phase 1: 新モジュール作成 → 旧モジュールから委譲
Phase 2: テスト移行 → 新モジュール直接テスト
Phase 3: 旧モジュールの re-export 維持（後方互換）
Phase 4: 全参照先を新モジュールに切替
Phase 5: 旧モジュールの削除
```

### 5.2 各ステップの品質ゲート

| ゲート | 基準 |
|--------|------|
| TypeScript型チェック | `npm run typecheck` パス |
| Linter | `npm run lint` パス |
| 単体テスト | `npm test` 全パス |
| スモークテスト | Playwright スモークテスト全パス |
| ビルド | `npm run build` 成功 |
| カバレッジ | 新規コード 80% 以上 |

### 5.3 ロールバック戦略

- 各フェーズ完了時に Git タグを作成（`refactor/phase-N-complete`）
- 問題発覚時はタグ地点にリバート可能
- 旧モジュールの re-export を維持する期間を設け、安全に移行

---

## 6. リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| リファクタリング中の機能退行 | 高 | 単体テスト + 統合テストで回帰検出、各ステップで CI チェック |
| ゲームループのパフォーマンス劣化 | 中 | レイヤー間のオブジェクトコピーを最小化、ホットパスのベンチマーク |
| 移行期間中のコード複雑化 | 中 | re-export による後方互換維持、段階的な旧コード削除 |
| テスト実行時間の増大 | 低 | Jest の並列実行設定、SWC トランスフォームの活用 |
| 既知バグとの干渉 | 中 | 既知バグ（壁スタック、2Pカード）の修正をフェーズ2に含める |

---

## 7. 成功基準

| 指標 | 目標値 |
|------|--------|
| RacingGame.tsx の行数 | 200行以下（現状758行） |
| ドメイン層の外部依存 | 0個（純粋 TypeScript のみ） |
| 単体テストカバレッジ（ドメイン層） | 90% 以上 |
| 単体テストカバレッジ（全体） | 80% 以上 |
| 統合テストシナリオ数（Application層） | 10 以上 |
| スモークテスト（E2E） | 3〜5 シナリオ（ページ表示・画面遷移の動作確認） |
| 最大ファイル行数 | 300行以下 |
| TypeScript `any` 使用数 | 0個 |
| ビルドサイズ変動 | ±5% 以内 |
