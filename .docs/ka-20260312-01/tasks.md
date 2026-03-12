# KEYS & ARMS 大規模リファクタリング — タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[~]` 進行中
- `[x]` 完了
- `[-]` スキップ

---

## Phase 1: 型システム基盤（Type Foundation）

### 型定義ファイルの作成

- [x] **T-1.01** `types/game-state.ts` 作成: GameState, GameScreen 型定義
- [x] **T-1.02** `types/input.ts` 作成: InputState 型定義
- [x] **T-1.03** `types/stage.ts` 作成: Stage, CaveState, PrairieState, BossState, PrairieEnemy, ShieldOrb 型定義
- [x] **T-1.04** `types/screen.ts` 作成: Screen インターフェース定義
- [x] **T-1.05** `types/rendering.ts` 作成: DrawingAPI インターフェース定義
- [x] **T-1.06** `types/audio.ts` 作成: AudioModule, SoundEffects インターフェース定義
- [x] **T-1.07** `types/particles.ts` 作成: Particle, ParticlePool, ParticleSpawnParams, ParticleSystemAPI, PopupSystemAPI, ParticlesModule 型定義
- [x] **T-1.08** `types/hud.ts` 作成: HUDModule インターフェース定義
- [x] **T-1.09** `types/engine-context.ts` 作成: EngineContext インターフェース定義
- [x] **T-1.10** `types/enemies.ts` 作成: CaveEnemyType, PrairieEnemyType 型定義
- [x] **T-1.11** `types/constants.ts` 作成: SpriteData, Position, RoomNavigation, LCDPalette 型定義

### `@ts-nocheck` 除去（依存の浅い順）

- [x] **T-1.12** `core/math.ts`: `@ts-nocheck` 除去、型注釈追加、テスト通過確認
- [x] **T-1.13** `constants.ts`: `@ts-nocheck` 除去、SpriteData 型適用
- [-] **T-1.14** `difficulty.ts`: 元々 `@ts-nocheck` なし（型付き済み）
- [x] **T-1.15** `core/particles.ts`: `@ts-nocheck` 除去、ParticlesModule 型適用
- [x] **T-1.16** `core/rendering.ts`: `@ts-nocheck` 除去、DrawingAPI 型適用
- [x] **T-1.17** `core/audio.ts`: `@ts-nocheck` 除去、AudioModule 型適用
- [x] **T-1.18** `core/hud.ts`: `@ts-nocheck` 除去、HUDModule 型適用
- [x] **T-1.19** `screens/title.ts`: `@ts-nocheck` 除去、EngineContext 型適用
- [x] **T-1.20** `screens/help.ts`: `@ts-nocheck` 除去、EngineContext 型適用
- [x] **T-1.21** `screens/game-over.ts`: `@ts-nocheck` 除去、EngineContext 型適用
- [x] **T-1.22** `screens/ending.ts`: `@ts-nocheck` 除去、EngineContext 型適用
- [x] **T-1.23** `screens/true-end.ts`: `@ts-nocheck` 除去、EngineContext 型適用
- [x] **T-1.24** `engine.ts`: `@ts-nocheck` 除去、GameState 型適用、モジュール型参照
- [x] **T-1.25** `stages/cave/index.ts`: `@ts-nocheck` 除去、CaveState 型適用
- [x] **T-1.26** `stages/prairie/index.ts`: `@ts-nocheck` 除去、PrairieState 型適用
- [x] **T-1.27** `stages/boss/index.ts`: `@ts-nocheck` 除去、BossState 型適用

### Phase 1 検証

- [x] **V-1.01** `npx tsc --noEmit` — 型チェック通過
- [x] **V-1.02** `npm test` — 全 81 テスト通過
- [x] **V-1.03** `npx eslint src/features/keys-and-arms/` — ESLint 通過（エラー0）
- [x] **V-1.04** `npm run build` — webpack ビルド成功（警告のみ）
- [ ] **V-1.05** ブラウザ確認: 全 3 ステージ通しプレイで動作に変化なし

---

## Phase 2: ドメイン層の抽出（Domain Layer）

### 共通基盤

- [x] **T-2.01** `domain/contracts/assertions.ts` 作成: assert, assertRange, assertInteger, assertDefined
- [x] **T-2.02** `domain/shared/value-objects.ts` 作成: HP, Score, BeatCounter バリューオブジェクト
- [x] **T-2.03** `domain/shared/game-events.ts` 作成: GameEventType, GameEvent, EventHandler, GameEventBus 型定義
- [x] **T-2.04** `domain/shared/event-bus.ts` 作成: createEventBus() 同期イベントバス実装

### プレイヤードメイン

- [x] **T-2.05** `domain/player/player-state.ts` 作成: プレイヤー状態管理（HP、スコア、位置）
- [x] **T-2.06** `domain/player/player-actions.ts` 作成: 移動、攻撃、ガード等のアクション

### 敵 AI ドメイン

- [x] **T-2.07** `domain/enemies/enemy-registry.ts` 作成: EnemyBehaviorRegistry（Strategy パターン）
- [x] **T-2.08** `domain/enemies/bat-behavior.ts` 作成: BAT AI（hazard-phase 共通ユーティリティで DRY 化）
- [x] **T-2.09** `domain/enemies/spider-behavior.ts` 作成: SPIDER AI（hazard-phase 共通ユーティリティで DRY 化）
- [x] **T-2.10** `domain/enemies/mimic-behavior.ts` 作成: MIMIC ロジック（Z 連打で開放）
- [x] **T-2.11** `domain/enemies/shifter-behavior.ts` 作成: SHIFTER AI（ビート後レーン移動）
- [x] **T-2.12** `domain/enemies/dasher-behavior.ts` 作成: DASHER AI（充電 → 突進）
- [x] **T-2.12a** `domain/enemies/hazard-phase.ts` 追加: BAT/SPIDER 共通のフェーズ計算（DRY リファクタリング）

### 戦闘ドメイン

- [x] **T-2.13** `domain/combat/damage-calculator.ts` 作成: ダメージ計算、ヒット判定
- [x] **T-2.14** `domain/combat/combo-system.ts` 作成: コンボ管理、スウィープ判定

### ステージフロードメイン

- [x] **T-2.15** `domain/stage-flow/stage-transition.ts` 作成: ステージ遷移ルール（STAGE_INFO で DRY 化）
- [x] **T-2.16** `domain/stage-flow/loop-manager.ts` 作成: ループ進行管理、トゥルーエンド判定

### アイテムドメイン

- [x] **T-2.17** `domain/items/key-manager.ts` 作成: 鍵の収集・設置ロジック
- [x] **T-2.18** `domain/items/gem-manager.ts` 作成: 宝石の設置ロジック（DbC アサーション追加）
- [x] **T-2.19** `domain/items/shield-manager.ts` 作成: シールド獲得・消費ロジック

### ボスドメイン

- [x] **T-2.20** `domain/boss/arm-ai.ts` 作成: 腕の進攻 AI（resetArmToRest で DRY 化、DbC 追加）
- [x] **T-2.21** `domain/boss/rage-system.ts` 作成: レイジウェーブシステム
- [x] **T-2.22** `domain/boss/counter-system.ts` 作成: カウンターシステム

### ドメインテスト

- [x] **T-2.23** `__tests__/domain/contracts.test.ts` 作成: アサーション関数テスト（13 ケース）
- [x] **T-2.24** `__tests__/domain/value-objects.test.ts` 作成: HP, Score, BeatCounter テスト（20 ケース）
- [x] **T-2.25** `__tests__/domain/event-bus.test.ts` 作成: イベントバステスト（8 ケース）
- [x] **T-2.26** `__tests__/domain/player.test.ts` 作成: プレイヤーテスト（12 ケース）
- [x] **T-2.27** `__tests__/domain/bat-behavior.test.ts` 作成: BAT AI テスト（10 ケース）
- [x] **T-2.28** `__tests__/domain/spider-behavior.test.ts` 作成: SPIDER テスト（7 ケース）
- [x] **T-2.29** `__tests__/domain/mimic-behavior.test.ts` 作成: MIMIC テスト（8 ケース）
- [x] **T-2.30** `__tests__/domain/shifter-behavior.test.ts` 作成: SHIFTER テスト（7 ケース）
- [x] **T-2.31** `__tests__/domain/dasher-behavior.test.ts` 作成: DASHER テスト（7 ケース）
- [x] **T-2.32** `__tests__/domain/damage-calculator.test.ts` 作成: ダメージ計算テスト（11 ケース）
- [x] **T-2.33** `__tests__/domain/combo-system.test.ts` 作成: コンボテスト（11 ケース）
- [x] **T-2.34** `__tests__/domain/stage-transition.test.ts` 作成: ステージ遷移テスト（9 ケース）
- [x] **T-2.35** `__tests__/domain/loop-manager.test.ts` 作成: ループ管理テスト（5 ケース）
- [x] **T-2.36** `__tests__/domain/key-manager.test.ts` 作成: 鍵管理テスト（7 ケース）
- [x] **T-2.37** `__tests__/domain/gem-manager.test.ts` 作成: 宝石管理テスト（8 ケース）
- [x] **T-2.38** `__tests__/domain/shield-manager.test.ts` 作成: シールド管理テスト（5 ケース）
- [x] **T-2.39** `__tests__/domain/arm-ai.test.ts` 作成: 腕 AI テスト（12 ケース）
- [x] **T-2.40** `__tests__/domain/rage-system.test.ts` 作成: レイジテスト（6 ケース）
- [x] **T-2.41** `__tests__/domain/counter-system.test.ts` 作成: カウンターテスト（4 ケース）

### Phase 2 検証

- [x] **V-2.01** `npm run typecheck` — 型チェック通過
- [x] **V-2.02** `npm test` — 全テスト通過（80 既存 + 209 新規ドメインテスト = 289 テスト）
- [x] **V-2.03** `npm run lint` — ESLint 通過
- [x] **V-2.04** `npm run build` — ビルド成功（警告のみ）
- [x] **V-2.05** ドメインテストカバレッジ: 93.46%（目標 85% 超過）
- [ ] **V-2.06** ブラウザ確認: 全 3 ステージ通しプレイで動作に変化なし

---

## Phase 3: アーキテクチャ再構築

### 洞窟ステージ分割

- [ ] **T-3.01** `stages/cave/cave-background.ts` 抽出: 背景描画（鍾乳石、松明、水滴等）
- [ ] **T-3.02** `stages/cave/enemies/bat.ts` 抽出: BAT 描画・アニメーション
- [ ] **T-3.03** `stages/cave/enemies/spider.ts` 抽出: SPIDER 描画・アニメーション
- [ ] **T-3.04** `stages/cave/enemies/mimic.ts` 抽出: MIMIC 描画・アニメーション
- [ ] **T-3.05** `stages/cave/enemies/rat.ts` 抽出: RAT 描画・アニメーション
- [ ] **T-3.06** `stages/cave/enemies/cage-trap.ts` 抽出: ケージトラップ描画
- [ ] **T-3.07** `stages/cave/cave-renderer.ts` 抽出: キャラクター・UI 描画
- [ ] **T-3.08** `stages/cave/cave-logic.ts` 抽出: ゲームロジック（ドメイン層呼び出し）
- [ ] **T-3.09** `stages/cave/index.ts` をオーケストレーターに簡素化（100 行以内）

### 草原ステージ分割

- [ ] **T-3.10** `stages/prairie/prairie-background.ts` 抽出: 背景描画（山、城、雲、花、草）
- [ ] **T-3.11** `stages/prairie/enemies/normal.ts` 抽出: 通常敵描画
- [ ] **T-3.12** `stages/prairie/enemies/shifter.ts` 抽出: SHIFTER 描画
- [ ] **T-3.13** `stages/prairie/enemies/dasher.ts` 抽出: DASHER 描画
- [ ] **T-3.14** `stages/prairie/prairie-renderer.ts` 抽出: キャラクター・UI 描画
- [ ] **T-3.15** `stages/prairie/prairie-logic.ts` 抽出: ゲームロジック（ドメイン層呼び出し）
- [ ] **T-3.16** `stages/prairie/index.ts` をオーケストレーターに簡素化（100 行以内）

### ボスステージ分割

- [ ] **T-3.17** `stages/boss/boss-background.ts` 抽出: 城背景描画
- [ ] **T-3.18** `stages/boss/arm-renderer.ts` 抽出: 腕の描画（ベジェ曲線等）
- [ ] **T-3.19** `stages/boss/pedestal-renderer.ts` 抽出: 台座・宝石描画
- [ ] **T-3.20** `stages/boss/boss-renderer.ts` 抽出: ボス・プレイヤー描画
- [ ] **T-3.21** `stages/boss/boss-logic.ts` 抽出: ゲームロジック（ドメイン層呼び出し）
- [ ] **T-3.22** `stages/boss/index.ts` をオーケストレーターに簡素化（100 行以内）

### デザインパターン導入

- [ ] **T-3.23** `domain/enemies/enemy-registry.ts` に Strategy パターン適用（洞窟敵の登録）
- [ ] **T-3.24** `domain/enemies/enemy-registry.ts` に草原敵の登録
- [ ] **T-3.25** `domain/shared/event-bus.ts` を各ステージに統合（Observer パターン）
- [ ] **T-3.26** audio への SFX トリガーをイベントバス経由に変更
- [ ] **T-3.27** HUD の `transTo()` をイベントバス経由に変更

### engine.ts リファクタリング

- [ ] **T-3.28** engine.ts: ゲーム状態管理をドメイン層に委譲
- [ ] **T-3.29** engine.ts: モジュール組み立てを DI パターンに変更
- [ ] **T-3.30** engine.ts: gameTick() を 100 行以内に簡素化
- [ ] **T-3.31** engine.ts: render() を 100 行以内に簡素化
- [ ] **T-3.32** engine.ts: 全体を 200 行以内に削減

### Phase 3 検証

- [ ] **V-3.01** 全ステージファイルが 400 行以内
- [ ] **V-3.02** engine.ts が 200 行以内
- [ ] **V-3.03** `npm run typecheck` — 型チェック通過
- [ ] **V-3.04** `npm test` — 全テスト通過
- [ ] **V-3.05** `npm run lint` — ESLint 通過
- [ ] **V-3.06** `npm run build` — ビルド成功
- [ ] **V-3.07** ブラウザ確認: 全 3 ステージ通しプレイで動作に変化なし
- [ ] **V-3.08** 循環参照がないことを確認

---

## Phase 4: 副作用の隔離

### Infrastructure 層

- [ ] **T-4.01** `infrastructure/storage-repository.ts` 作成: GameStorageRepository インターフェース + LocalStorage 実装
- [ ] **T-4.02** `infrastructure/storage-repository.ts`: InMemoryStorageRepository（テスト用）実装
- [ ] **T-4.03** `infrastructure/audio-service.ts` 作成: AudioService の実装を既存 `core/audio.ts` から移行
- [ ] **T-4.04** `infrastructure/null-audio-service.ts` 作成: NullAudioService（テスト用）実装
- [ ] **T-4.05** `infrastructure/input-handler.ts` 作成: InputHandler 実装
- [ ] **T-4.06** `infrastructure/programmatic-input-handler.ts` 作成: ProgrammaticInputHandler（テスト用）実装

### 副作用の除去

- [ ] **T-4.07** engine.ts: `localStorage.setItem('kaG', ...)` を GameStorageRepository 経由に変更
- [ ] **T-4.08** engine.ts: `localStorage.getItem('kaG')` を GameStorageRepository 経由に変更
- [ ] **T-4.09** 各ステージ: audio 直接呼び出しをイベントバス経由に完全移行
- [ ] **T-4.10** engine.ts: AudioContext 初期化を AudioService に完全委譲

### Phase 4 検証

- [ ] **V-4.01** ドメイン層に副作用呼び出し（localStorage, AudioContext, Canvas API）がないことを確認
- [ ] **V-4.02** `npm run typecheck` — 型チェック通過
- [ ] **V-4.03** `npm test` — 全テスト通過
- [ ] **V-4.04** `npm run build` — ビルド成功
- [ ] **V-4.05** ブラウザ確認: 音声・ストレージが正常に動作

---

## Phase 5: テスト基盤強化

### テストヘルパー

- [ ] **T-5.01** `__tests__/helpers/test-state-builder.ts` 作成: GameStateBuilder パターン
- [ ] **T-5.02** `__tests__/helpers/mock-factories.ts` 作成: モック生成ヘルパー（DrawingAPI, AudioService 等）
- [ ] **T-5.03** `__tests__/helpers/test-engine.ts` 作成: テスト用エンジン（副作用なし、ProgrammaticInputHandler 使用）

### 既存テストのリファクタリング

- [ ] **T-5.04** `math.test.ts`: AAA パターン統一、テスト名日本語化
- [ ] **T-5.05** `particles.test.ts`: AAA パターン統一、テスト名日本語化
- [ ] **T-5.06** `audio.test.ts`: AAA パターン統一、テスト名日本語化、NullAudioService 活用
- [ ] **T-5.07** `rendering.test.ts`: AAA パターン統一、テスト名日本語化
- [ ] **T-5.08** `pause.test.ts`: AAA パターン統一、テスト名日本語化、ProgrammaticInputHandler 活用
- [ ] **T-5.09** `help.test.ts`: AAA パターン統一、テスト名日本語化
- [ ] **T-5.10** `difficulty.test.ts`: AAA パターン統一、テスト名日本語化

### 統合テスト

- [ ] **T-5.11** `__tests__/integration/cave-flow.test.ts` 作成: 洞窟ステージの状態遷移テスト（5 ケース）
- [ ] **T-5.12** `__tests__/integration/prairie-flow.test.ts` 作成: 草原ステージの状態遷移テスト（5 ケース）
- [ ] **T-5.13** `__tests__/integration/boss-flow.test.ts` 作成: ボスステージの状態遷移テスト（5 ケース）
- [ ] **T-5.14** `__tests__/integration/game-loop.test.ts` 作成: ループ進行テスト（洞窟→草原→ボス→ループ 2、4 ケース）

### Phase 5 検証

- [ ] **V-5.01** `npm test` — 全ユニット・統合テスト通過
- [ ] **V-5.02** テストケース合計: 200 以上
- [ ] **V-5.03** ドメイン層テストカバレッジ: 85% 以上
- [ ] **V-5.04** 既存テスト全件がリファクタリング後も通過

---

## Phase 6: 品質・仕上げ

### DRY 改善

- [ ] **T-6.01** パーティクルプリセット定数の定義（PARTICLE_PRESETS）
- [ ] **T-6.02** 各ステージのパーティクル生成をプリセット経由に変更
- [ ] **T-6.03** マジックナンバーの定数化（GAMEPLAY 定数オブジェクト）
- [ ] **T-6.04** 各ファイルのマジックナンバーを定数参照に変更
- [ ] **T-6.05** 敵描画の共通化（共通レンダリングヘルパー）

### パフォーマンス最適化

- [ ] **T-6.06** パーティクル配列: `splice` → スワップ削除（O(1)）に変更
- [ ] **T-6.07** 静的背景の OffscreenCanvas キャッシュ導入（洞窟ステージ）
- [ ] **T-6.08** 静的背景の OffscreenCanvas キャッシュ導入（草原ステージ）
- [ ] **T-6.09** 静的背景の OffscreenCanvas キャッシュ導入（ボスステージ）

### コード品質

- [ ] **T-6.10** ESLint ルール適用確認・違反修正
- [ ] **T-6.11** コメントの日本語統一
- [ ] **T-6.12** 命名規則の統一（camelCase / PascalCase）
- [ ] **T-6.13** 未使用コード・デッドコードの除去

### ドキュメント

- [ ] **T-6.14** `README.md` 更新: アーキテクチャ概要図の追加
- [ ] **T-6.15** `README.md` 更新: ディレクトリ構成の説明

### Phase 6 検証

- [ ] **V-6.01** マジックナンバーが全て定数化されていること
- [ ] **V-6.02** `npm run typecheck` — 型チェック通過
- [ ] **V-6.03** `npm test` — 全テスト通過
- [ ] **V-6.04** `npm run lint` — ESLint 通過
- [ ] **V-6.05** `npm run build` — ビルド成功
- [ ] **V-6.06** ブラウザ確認: 全 3 ステージ通しプレイ
- [ ] **V-6.07** ブラウザ確認: パフォーマンスに劣化がないこと

---

## サマリー

| Phase | 実装タスク数 | テストタスク数 | 検証項目数 | 合計 |
|-------|------------|-------------|----------|------|
| Phase 1: 型システム基盤 | 27 | 0 | 5 | 32 |
| Phase 2: ドメイン層抽出 | 22 | 19 | 6 | 47 |
| Phase 3: アーキテクチャ再構築 | 32 | 0 | 8 | 40 |
| Phase 4: 副作用隔離 | 10 | 0 | 5 | 15 |
| Phase 5: テスト基盤強化 | 15 | 0 | 4 | 19 |
| Phase 6: 品質・仕上げ | 15 | 0 | 8 | 23 |
| **合計** | **121** | **19** | **36** | **176** |

### E2E テストを導入しない理由

Canvas 2D ベースのリアルタイムアクションゲームでは E2E テスト（Playwright）は採用しない：

1. **Canvas は DOM 要素を持たない** — `getByText()` 等のセレクタが使用不可
2. **リアルタイムアクション操作が必要** — タイミング依存操作の自動化が非現実的
3. **確率的要素** — フレーム単位の変動で再現性が低い
4. **Primal Path との構造差** — 既存 E2E は「React DOM + 自動進行型」で成立しており、「Canvas + リアルタイムアクション」とは根本的に異なる

**代替戦略**: ドメインユニットテスト + 統合テストでゲームロジックを厚く保証し、描画・操作感は手動ブラウザ検証で補完する。

### 目標指標

| 指標 | 現在 | 目標 |
|------|------|------|
| `@ts-nocheck` ファイル数 | 16 | 0 |
| 最大ファイル行数 | 2,500 | 400 |
| engine.ts 行数 | 400 | 200 |
| テストケース数 | 80 | 200+（ユニット + 統合） |
| ドメインテストカバレッジ | 0% | 85%+ |
| マジックナンバー | 多数 | 0 |
| 循環参照 | あり | なし |
| 副作用の混在 | あり | infrastructure 層に集約 |
