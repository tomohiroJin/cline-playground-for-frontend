# Air Hockey 大規模リファクタリング — 実装計画

## 概要

Air Hockey の保守性・拡張性・テスタビリティを抜本的に改善する大規模リファクタリング。
DDD（ドメイン駆動設計）の導入、副作用の分離、SOLID 原則の適用、テスト戦略の見直しを段階的に実施する。

## 現状の課題

### アーキテクチャ

| 課題 | 影響 | 該当ファイル |
|------|------|-------------|
| `AirHockeyGame.tsx` が 710 行で肥大化 | 変更時の影響範囲が広い | `AirHockeyGame.tsx` |
| `useGameLoop.ts` が 28KB、22 パラメータ | テスト困難、責務過多 | `hooks/useGameLoop.ts` |
| `renderer.ts` が 28KB | 責務集中、テスト不能 | `renderer.ts` |
| localStorage 操作が 6 モジュールに分散 | 副作用の散在、テスト時のモック複雑化 | `achievements.ts`, `story.ts`, `unlock.ts`, `dex.ts`, `daily-challenge.ts`, `audio-settings.ts` |
| scoreRef と scores state の二重管理 | 同期ミスのリスク | `AirHockeyGame.tsx`, `useGameLoop.ts` |
| ドメイン知識がフック・コンポーネントに混在 | ロジックの再利用不可 | 全体 |

### テスト

| 課題 | 影響 |
|------|------|
| `useGameLoop.ts` のフローテストが不十分 | ゲームループの振る舞い保証なし |
| `renderer.ts` のテストなし | 描画の正しさを保証できない |
| テストコードに重複したモック設定が多い | テスト保守コストが高い |
| 一部テストが実装詳細に依存 | リファクタリング時の脆弱性 |
| ドメインロジックの統合テストが不足 | クロスモジュールのリグレッション検知が弱い |

## 目標

1. **DDD レイヤー構成**: labyrinth-echo / primal-path と同等のレイヤー分離を達成
2. **副作用の隔離**: すべての外部依存（localStorage, Web Audio API, Canvas API）をインフラ層に集約
3. **SOLID 原則の適用**: 各モジュールの単一責任化、依存性逆転による拡張性確保
4. **テスト強化**: ドメイン統合テスト・ユースケース結合テストの充実 + 単体テストの品質向上（振る舞いベース化）
5. **カスタマイズ性**: 新フィールド・新アイテム・新キャラクターの追加が設定変更のみで可能

## 設計原則

### DDD レイヤー構成（目標）

```
src/features/air-hockey/
├── domain/                    # ドメイン層（純粋関数、副作用なし）
│   ├── models/                # エンティティ・値オブジェクト
│   │   ├── vector.ts          # Vector 値オブジェクト
│   │   ├── puck.ts            # Puck エンティティ
│   │   ├── mallet.ts          # Mallet エンティティ
│   │   ├── game-state.ts      # GameState 集約ルート
│   │   ├── match-stats.ts     # MatchStats 値オブジェクト
│   │   └── item.ts            # Item エンティティ
│   ├── services/              # ドメインサービス
│   │   ├── physics.ts         # 物理演算サービス（現 core/physics.ts）
│   │   ├── ai.ts              # AI サービス（現 core/ai.ts）
│   │   ├── item-effect.ts     # アイテムエフェクトサービス（現 core/items.ts）
│   │   ├── scoring.ts         # スコアリングサービス
│   │   └── difficulty.ts      # 難易度調整サービス（現 core/difficulty-adjust.ts）
│   ├── contracts/             # インターフェース（ポート）
│   │   ├── storage.ts         # ストレージポート
│   │   ├── audio.ts           # オーディオポート
│   │   └── renderer.ts        # レンダラーポート
│   ├── constants/             # ゲーム定数
│   │   ├── physics.ts         # 物理定数（現 core/constants.ts から分離）
│   │   ├── fields.ts          # フィールド設定（現 core/config.ts から分離）
│   │   └── items.ts           # アイテム設定
│   ├── events/                # ドメインイベント
│   │   └── game-events.ts     # ゲームイベント定義
│   └── types.ts               # ドメイン型定義（現 core/types.ts を精査）
├── application/               # アプリケーション層（ユースケース）
│   ├── use-cases/
│   │   ├── game-loop.ts       # ゲームループユースケース（現 useGameLoop のロジック部分）
│   │   ├── story-mode.ts      # ストーリーモードユースケース
│   │   ├── free-battle.ts     # フリー対戦ユースケース
│   │   ├── daily-challenge.ts # デイリーチャレンジユースケース
│   │   └── character-dex.ts   # キャラクター図鑑ユースケース
│   └── ports/                 # アプリケーションポート
│       ├── storage-port.ts    # ストレージ抽象
│       └── audio-port.ts      # オーディオ抽象
├── infrastructure/            # インフラ層（外部依存の実装）
│   ├── storage/
│   │   ├── local-storage-adapter.ts  # localStorage アダプタ
│   │   ├── achievement-storage.ts    # 実績ストレージ
│   │   ├── story-storage.ts          # ストーリーストレージ
│   │   ├── unlock-storage.ts         # アンロックストレージ
│   │   ├── dex-storage.ts            # 図鑑ストレージ
│   │   └── score-storage.ts          # スコアストレージ
│   ├── audio/
│   │   └── web-audio-adapter.ts      # Web Audio API アダプタ（現 core/sound.ts）
│   └── renderer/
│       ├── canvas-renderer.ts        # Canvas レンダラー本体
│       ├── field-renderer.ts         # フィールド描画
│       ├── entity-renderer.ts        # エンティティ描画（パック・マレット）
│       ├── effect-renderer.ts        # エフェクト描画
│       └── ui-renderer.ts            # UI 描画（カウントダウン等）
├── presentation/              # プレゼンテーション層（React コンポーネント）
│   ├── components/            # 現 components/ を移動
│   ├── hooks/                 # React フック（UI 関心のみ）
│   │   ├── useGameLoop.ts     # ゲームループフック（薄いラッパー）
│   │   ├── useInput.ts        # 入力フック
│   │   ├── useKeyboardInput.ts
│   │   └── useCharacterDex.ts
│   ├── AirHockeyGame.tsx      # メインコンポーネント（薄く保つ）
│   └── styles.ts
├── __tests__/                 # テスト共通ヘルパー
│   └── helpers/
├── doc/                       # 技術ドキュメント（現状維持）
└── index.ts
```

### 適用する設計原則

| 原則 | 適用箇所 | 具体的な施策 |
|------|---------|-------------|
| **SRP**（単一責任） | useGameLoop 分割、renderer 分割 | 1 モジュール = 1 責務 |
| **OCP**（開放閉鎖） | アイテムエフェクトの Strategy パターン | 新アイテム追加時に既存コード変更不要 |
| **LSP**（リスコフ置換） | ストレージポートの統一インターフェース | localStorage → IndexedDB 等への差替可能 |
| **ISP**（インターフェース分離） | ドメインコントラクト | 必要最小限のインターフェース定義 |
| **DIP**（依存性逆転） | インフラ層への依存注入 | ドメイン層が外部依存を持たない |
| **DRY** | テストヘルパー・ファクトリーの統一 | モック設定の集約 |
| **DbC**（契約による設計） | ドメインモデルの不変条件 | ファクトリーメソッドでのバリデーション |

### 適用するデザインパターン

| パターン | 適用箇所 | 目的 |
|---------|---------|------|
| **Strategy** | アイテムエフェクト、AI 行動 | エフェクト/AI の差替・拡張を容易に |
| **Observer** | ドメインイベント | ゲーム内イベントの疎結合な通知 |
| **Factory Method** | エンティティ生成 | 生成ロジックの集約と不変条件の保証 |
| **Adapter** | ストレージ、オーディオ、レンダラー | 外部依存の抽象化 |
| **Facade** | ゲームループユースケース | 複雑なサブシステム操作の簡素化 |
| **Value Object** | Vector, FieldConfig, AiBehaviorConfig | 不変性と等値性の保証 |
| **Aggregate Root** | GameState | 整合性境界の明確化 |

## フェーズ計画

### 全体スケジュール

```
Phase R1（ドメインモデル層）
  ├── R1-1: 型定義の精査・Value Object 導入
  ├── R1-2: ドメインサービスの移行（physics, ai, items）
  ├── R1-3: エンティティ・集約ルートの導入
  └── R1-4: ドメインイベントの定義
        ↓
Phase R2（インフラ層の分離）
  ├── R2-1: ストレージポート定義 + Adapter 実装
  ├── R2-2: オーディオポート定義 + Adapter 実装
  └── R2-3: レンダラー分割 + ポート定義
        ↓
Phase R3（アプリケーション層の構築）
  ├── R3-1: ゲームループユースケースの抽出
  ├── R3-2: ストーリーモードユースケース
  ├── R3-3: フリー対戦/デイリーチャレンジユースケース
  └── R3-4: キャラクター図鑑ユースケース
        ↓
Phase R4（プレゼンテーション層のリファクタリング）
  ├── R4-1: useGameLoop の薄いラッパー化
  ├── R4-2: AirHockeyGame.tsx の責務分離
  └── R4-3: コンポーネントの移動・整理
        ↓
Phase R5（テストリファクタリング + テスト強化）
  ├── R5-1: テストヘルパー・ファクトリーの統一
  ├── R5-2: 既存テストの振る舞いベース化
  ├── R5-3: ドメイン層の網羅的テスト
  ├── R5-4: インフラ層のテスト
  ├── R5-5: ドメイン統合テスト（ゲームフロー検証）
  └── R5-6: ユースケース結合テスト（クロスモジュール検証）
```

### Phase R1: ドメインモデル層の導入

**目的**: 純粋なドメイン知識をインフラ・UI から完全に分離する

**R1-1: 型定義の精査・Value Object 導入**

- `core/types.ts` の型を精査し、ドメイン型とプレゼンテーション型に分離
- `Vector` を Value Object 化（不変性、等値比較、演算メソッド）
- `FieldConfig`, `AiBehaviorConfig` を Value Object 化
- `domain/types.ts` に純粋なドメイン型を集約
- 既存コードは re-export で後方互換を維持

**R1-2: ドメインサービスの移行**

- `core/physics.ts` → `domain/services/physics.ts`（純粋関数の移行、API 変更なし）
- `core/ai.ts` → `domain/services/ai.ts`（AI ロジックの移行）
- `core/items.ts` → `domain/services/item-effect.ts`（Strategy パターン導入）
- `core/difficulty-adjust.ts` → `domain/services/difficulty.ts`
- 各モジュールの re-export で後方互換を維持

**R1-3: エンティティ・集約ルートの導入**

- `Puck` エンティティ：位置・速度の管理、衝突判定メソッド
- `Mallet` エンティティ：位置・速度の管理、入力適用メソッド
- `GameState` 集約ルート：ゲーム全体の整合性管理
- `MatchStats` 値オブジェクト：統計情報の不変管理
- ファクトリーメソッドによる生成と不変条件（DbC）の保証

**R1-4: ドメインイベントの定義**

- `GoalScoredEvent`: ゴール時の通知
- `CollisionEvent`: 衝突時の通知（音声・エフェクトのトリガー）
- `ItemCollectedEvent`: アイテム取得時の通知
- `GamePhaseChangedEvent`: フェーズ遷移の通知
- `AchievementUnlockedEvent`: 実績解除の通知

**成果物**: `domain/` ディレクトリ以下の全ファイル
**完了条件**: 既存テスト全パス、型エラーなし、ドメイン層に外部依存なし

### Phase R2: インフラ層の分離

**目的**: すべての外部依存（localStorage, Web Audio API, Canvas API）をアダプターパターンで隔離する

**R2-1: ストレージポート定義 + Adapter 実装**

- `domain/contracts/storage.ts` にストレージインターフェースを定義
  ```typescript
  interface GameStoragePort {
    loadAchievements(): AchievementState;
    saveAchievements(state: AchievementState): void;
    loadStoryProgress(): StoryProgress;
    saveStoryProgress(progress: StoryProgress): void;
    loadUnlockState(): UnlockState;
    saveUnlockState(state: UnlockState): void;
    loadDexProgress(): DexProgress;
    saveDexProgress(progress: DexProgress): void;
    loadAudioSettings(): AudioSettings;
    saveAudioSettings(settings: AudioSettings): void;
    loadDailyChallengeResults(): DailyChallengeResults;
    saveDailyChallengeResult(date: string, result: DailyChallengeResult): void;
  }
  ```
- `infrastructure/storage/local-storage-adapter.ts` に localStorage 実装
- 各モジュール（achievements, story, unlock, dex, audio-settings, daily-challenge）を Adapter 経由に変更
- テスト用 `InMemoryStorageAdapter` の作成

**R2-2: オーディオポート定義 + Adapter 実装**

- `domain/contracts/audio.ts` にオーディオインターフェースを定義
  ```typescript
  interface AudioPort {
    playHitSound(speed: number): void;
    playWallSound(): void;
    playGoalSound(): void;
    playItemSound(): void;
    startBgm(): void;
    stopBgm(): void;
    setVolume(type: 'bgm' | 'se', volume: number): void;
    isMuted(type: 'bgm' | 'se'): boolean;
  }
  ```
- `infrastructure/audio/web-audio-adapter.ts` に Web Audio API 実装
- テスト用 `NullAudioAdapter` の作成

**R2-3: レンダラー分割 + ポート定義**

- 現 `renderer.ts`（28KB）を責務ごとに分割:
  - `field-renderer.ts`: フィールド・障害物描画
  - `entity-renderer.ts`: パック・マレット描画
  - `effect-renderer.ts`: パーティクル・衝撃波・ヒットストップ描画
  - `ui-renderer.ts`: カウントダウン・スコア・アイテム表示描画
  - `canvas-renderer.ts`: 統合レンダラー（Facade パターン）
- `domain/contracts/renderer.ts` にレンダラーインターフェースを定義

**成果物**: `infrastructure/` ディレクトリ、`domain/contracts/` ディレクトリ
**完了条件**: 既存テスト全パス、副作用がインフラ層に集約、ドメイン層に外部依存なし

### Phase R3: アプリケーション層の構築

**目的**: ユースケースを明示的に定義し、ドメイン操作のオーケストレーションを集約する

**R3-1: ゲームループユースケースの抽出**

- 現 `useGameLoop.ts` から純粋なゲームロジックを `application/use-cases/game-loop.ts` に抽出
- フレーム更新ロジック: 入力適用 → 物理演算 → 衝突判定 → AI 更新 → スコア判定
- ドメインイベントの発行（衝突、ゴール等）
- インフラ依存は注入（ストレージ、オーディオ、レンダラー）

**R3-2: ストーリーモードユースケース**

- 現 `AirHockeyGame.tsx` のストーリーモードロジックを抽出
- ステージ選択 → ダイアログ → VS → ゲーム → リザルト のフロー管理
- ストーリー進行の保存・読込

**R3-3: フリー対戦/デイリーチャレンジユースケース**

- 設定選択 → ゲーム → リザルト のフロー管理
- デイリーチャレンジのシード生成とルール適用

**R3-4: キャラクター図鑑ユースケース**

- 現 `useCharacterDex.ts` のロジック部分を抽出
- アンロック判定、図鑑進行管理

**成果物**: `application/` ディレクトリ以下の全ファイル
**完了条件**: 既存テスト全パス、ユースケースが明示的に定義

### Phase R4: プレゼンテーション層のリファクタリング

**目的**: React コンポーネント・フックを薄いラッパーに変え、プレゼンテーション関心のみに集中させる

**R4-1: useGameLoop の薄いラッパー化**

- ゲームロジックはアプリケーション層のユースケースに委譲
- フックは `requestAnimationFrame` の管理と React state の同期のみ
- パラメータ数を大幅削減（22 → 5 以下）

**R4-2: AirHockeyGame.tsx の責務分離**

- 画面遷移ロジックを `useScreenNavigation` フックに分離
- ゲームモード管理を `useGameMode` フックに分離
- 710 行 → 200 行以下を目標

**R4-3: コンポーネントの移動・整理**

- `components/` → `presentation/components/` に移動
- `hooks/` → `presentation/hooks/` に移動
- `AirHockeyGame.tsx` → `presentation/AirHockeyGame.tsx` に移動
- re-export で後方互換を維持

**成果物**: `presentation/` ディレクトリ、リファクタリング済みコンポーネント
**完了条件**: 既存テスト全パス、各コンポーネントが 200 行以下

### Phase R5: テストリファクタリング + テスト強化

**目的**: テストコードの品質向上、重複削減、振る舞いベースへの移行、ドメイン統合テストによるリグレッション検知強化

> **E2E テストを採用しない理由**:
> Canvas ベースのゲームでは、ゲーム中の操作対象（パック・マレット）が DOM 要素ではなくピクセルであるため、
> 従来の E2E テスト（Playwright 等）では操作・検証が困難。入力がマウス座標ベースであり、
> 物理演算の結果がフレームタイミングに依存するため、決定的なテストが書けない。
> 代わりに、**ドメイン統合テスト**（ゲームループを複数フレーム回して結果を検証）と
> **ユースケース結合テスト**（ストーリー全フローをユースケースレベルで検証）で
> Canvas 外も含めたリグレッション検知を実現する。

**R5-1: テストヘルパー・ファクトリーの統一**

- `__tests__/helpers/` にテストファクトリーを集約
  - `createTestGameState()`: テスト用 GameState 生成
  - `createTestPuck()`: テスト用 Puck 生成
  - `createTestMallet()`: テスト用 Mallet 生成
  - `createInMemoryStorage()`: テスト用ストレージ
- 共通モック設定の統一（Canvas, Audio, localStorage）
- 個別テストファイルのモック設定を共通化

**R5-2: 既存テストの振る舞いベース化**

- 実装詳細に依存するテストを振る舞いベースに書き換え
- テスト名を日本語で「何をしたら何が起きるか」に統一
- 不要なスナップショットテストの削除
- `getByTestId` → `getByRole`, `getByText` への置き換え

**R5-3: ドメイン層の網羅的テスト**

- Value Object のテスト（不変性、等値比較）
- エンティティのテスト（状態遷移、不変条件）
- ドメインサービスのテスト（物理演算、AI、アイテムエフェクト）
- カバレッジ目標: ドメイン層 90% 以上

**R5-4: インフラ層のテスト**

- ストレージアダプターのテスト（保存・読込・破損時フォールバック）
- レンダラーの基本テスト（呼び出し検証）

**R5-5: ドメイン統合テスト（ゲームフロー検証）**

ゲームループを純粋関数として複数フレーム実行し、ドメインレベルでの正しさを検証する。
Canvas や Audio の副作用なしにゲーム全体のフローを高速に検証可能。

- ゲームループの複数フレーム実行テスト
  ```typescript
  // パックがゴールに入ったらスコアが加算され、ドメインイベントが発行される
  test('パックがゴールに到達するとスコアが加算される', () => {
    const state = GameState.create(defaultField, 'easy');
    const withPuck = setPuckVelocity(state, { vy: 10 }); // ゴール方向に射出

    // 複数フレーム更新
    const { state: result, events } = runFrames(withPuck, 60);

    expect(result.score.cpu).toBe(1);
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'GOAL_SCORED', scorer: 'cpu' })
    );
  });
  ```
- パック・マレット衝突 → 反射方向の正しさ
- アイテム取得 → エフェクト適用 → タイムアウト解除のフルサイクル
- コンボ蓄積 → フィーバー発動の閾値テスト
- 障害物衝突 → HP 減少 → 破壊 → リスポーンのサイクル
- 複数パック（Split アイテム）の同時ゴール処理

**R5-6: ユースケース結合テスト（クロスモジュール検証）**

ユースケース層を通してストレージ・ドメインロジックが正しく連携することを検証する。
InMemoryStorage を注入するため、localStorage に依存せず高速に実行可能。

- ストーリーモード全フロー結合テスト
  ```typescript
  // ステージ 1-1 → 1-2 → 1-3 を順にクリアし、全キャラがアンロックされる
  test('ストーリーモード全ステージクリアで全キャラアンロック', () => {
    const storage = new InMemoryStorageAdapter();
    const story = new StoryModeUseCase(storage, dispatcher);
    const dex = new CharacterDexUseCase(storage);

    story.completeStage('1-1', 'player', createTestMatchStats());
    story.completeStage('1-2', 'player', createTestMatchStats());
    story.completeStage('1-3', 'player', createTestMatchStats());

    const progress = dex.getProgress();
    expect(progress.unlockedCharacterIds).toContain('hiro');
    expect(progress.unlockedCharacterIds).toContain('misaki');
    expect(progress.unlockedCharacterIds).toContain('takuma');
  });
  ```
- フリー対戦完了 → スコア保存 → 実績判定 → アンロック判定の連鎖テスト
- デイリーチャレンジ完了 → 結果保存 → 翌日チャレンジへの影響なしテスト
- 図鑑アンロック → 通知 → 既読処理 → 通知消去の連鎖テスト
- 難易度オートアジャスト → 連勝/連敗 → 設定変更の反映テスト

**成果物**: リファクタリング済みテストファイル群、テストヘルパー、統合・結合テスト
**完了条件**: 全テストパス、テストコードの重複削減、ドメイン層カバレッジ 90% 以上

## 移行戦略

### 段階的移行（Strangler Fig パターン）

各フェーズで以下のアプローチを採用:

1. **新構造を作成**: 新しいディレクトリ・ファイルを作成
2. **ロジックを移行**: 既存コードからロジックを新構造にコピー
3. **re-export で互換維持**: 旧パスからの import を維持
4. **テスト実行**: 既存テスト全パスを確認
5. **旧コードを削除**: re-export 経由で参照がなくなった旧コードを削除

### 各フェーズの完了条件（共通）

- [ ] 既存テスト全パス（`npm test`）
- [ ] 型エラーなし（`tsc --noEmit`）
- [ ] ESLint エラーなし（`npm run lint:ci`）
- [ ] ビルド成功（`npm run build`）

## リスク管理

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 大規模移行による既存機能の破損 | 高 | 段階的移行 + 各ステップでのテスト実行 |
| re-export による循環依存 | 中 | レイヤー間の依存方向を厳守（domain ← application ← infrastructure/presentation） |
| DDD 導入による過度な抽象化 | 中 | ドメインの複雑さに比例した抽象化レベルを維持 |
| テストリファクタリング中のカバレッジ低下 | 中 | テスト削除前に代替テストを作成 |
| 開発期間の長期化 | 中 | フェーズ毎に成果物を確定、途中で止めても価値がある設計 |

## Phase R1 完了後の状態

- `domain/` ディレクトリが作成され、純粋なドメイン知識が集約
- 既存の `core/` からの re-export で後方互換を維持
- Value Object（Vector, FieldConfig）が不変性を保証
- Strategy パターンによるアイテムエフェクトの拡張準備完了
- ドメインイベントの定義が完了し、Observer パターンの基盤が整備

## テスト戦略の方針

### Canvas ゲームに適したテストピラミッド

```
         /  UI コンポーネントテスト  \        ← Testing Library（Canvas 外の UI のみ）
        /  ユースケース結合テスト      \      ← InMemoryStorage 注入、クロスモジュール検証
       /  ドメイン統合テスト            \    ← ゲームループ複数フレーム実行、イベント検証
      /  ドメイン単体テスト              \  ← 純粋関数の入出力テスト（最も充実させる）
```

### E2E テストを採用しない理由

1. **DOM 要素がない**: ゲーム中の操作対象は Canvas ピクセルであり、`getByRole` 等で取得不可
2. **入力がマウス座標ベース**: ボタンクリックではなく座標移動が操作の本質
3. **結果がフレーム依存**: 物理演算の結果がタイミング依存で決定的テストが困難
4. **ゲーム終了制御不能**: 「プレイヤーが勝つ」状態を E2E から確実に再現不可

### 代替テスト戦略

| テスト種別 | 対象 | 効果 |
|-----------|------|------|
| **ドメイン統合テスト** | ゲームループを複数フレーム実行 | ゴール判定・衝突・アイテム等のフルサイクル検証 |
| **ユースケース結合テスト** | ストーリー全フロー・実績・アンロック連鎖 | クロスモジュールのリグレッション検知 |
| **UI コンポーネントテスト** | Canvas 外の画面遷移・図鑑・設定 | 既存の Testing Library テストを振る舞いベースに強化 |

## 全フェーズ完了後の状態

- labyrinth-echo / primal-path と同等の DDD レイヤー構成
- すべての副作用がインフラ層に隔離
- 新フィールド・新アイテムの追加が設定ファイル + Strategy 実装のみで可能
- ドメイン統合テスト + ユースケース結合テストにより主要フローのリグレッション検知が可能
- テストコードの保守コストが大幅に低減
- `AirHockeyGame.tsx` が 200 行以下、`useGameLoop` が薄いラッパーに変貌
