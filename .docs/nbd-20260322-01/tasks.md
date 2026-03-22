# Non-Brake Descent リファクタリング チェックリスト

## Phase 1: 基盤整備（テスト強化 + テストインフラ整備）

### 1-1: テストヘルパー・ファクトリの作成
- [ ] `__tests__/helpers/test-factories.ts` を作成
  - `buildPlayer`, `buildRamp`, `buildObstacle`, `buildParticle`, `buildScorePopup`
  - `buildGameWorld`, `buildUIState`, `buildCollisionContext`
- [ ] `__tests__/helpers/test-helpers.ts` を作成（共通ユーティリティ）
- [ ] コミット: `test: テストファクトリとヘルパーを作成`

### 1-2: 不足テストの追加（ドメイン層）
- [ ] `physics.ts` のテストを追加（`applyMovement`, `applyJump`, `checkTransition`）
- [ ] `entities.ts` のテストを追加（各ファクトリ関数）
- [ ] `generators.ts` のテストを追加（`RampGen.generate`, `ObstacleGen.generate`）
- [ ] `particles.ts` のテストを追加（`updateAndFilter`, `updateClouds`）
- [ ] `combo-domain.ts` のテストを追加（`shouldActivate`, `increment`, `reset`, `tick`）
- [ ] `danger-domain.ts` のテストを追加（`calcLevel`）
- [ ] `geometry-domain.ts` のテストを追加（各関数）
- [ ] コミット: `test: 不足していたドメインモジュールのテストを追加`

### 1-3: 既存テストのリファクタリング
- [ ] 既存の `non-brake-descent-domains.test.ts` を AAA パターンに統一
- [ ] テスト名を日本語で「何をしたら何が起きるか」に統一
- [ ] `describe` ネストを「正常系」「異常系」「境界値」で整理
- [ ] 全テストがパスすることを確認
- [ ] コミット: `test: 既存テストを AAA パターンに統一しリファクタリング`

### 1-4: マジックナンバーの定数化
- [ ] `NonBrakeDescentGame.tsx` 内のマジックナンバーを `config.ts` に移動
  - 敵キル減速値: `-2` → `Config.combat.enemyKillSlowdown`
  - バウンス倍率: `0.4` → `Config.combat.bounceMultiplier`
  - バウンス速度: `5` / `-5` → `Config.combat.bounceSpeed`
  - ジェット生成閾値: `5` → `Config.particle.jetSpeedThreshold`
  - カメラ追従率: `0.1` → `Config.camera.followRate`
  - その他散在するマジックナンバー
- [ ] 全テストがパスすることを確認
- [ ] コミット: `refactor: マジックナンバーを定数に置換`

---

## Phase 2: ドメイン層の強化

### 2-1: ディレクトリ構造の作成とドメイン型の整理
- [ ] `domain/entities/`, `domain/services/`, `domain/strategies/`, `domain/events/` ディレクトリを作成
- [ ] `types.ts` をドメイン型として整理（`CollisionHandlerResult` の排除）
- [ ] `CollisionResult` 型を定義（`boolean | 'slow'` の置換）
- [ ] コミット: `chore: ドメイン層のディレクトリ構造を作成`

### 2-2: ドメインイベントの定義
- [ ] `domain/events/game-events.ts` を作成（`GameEvent` ユニオン型）
- [ ] イベント型のテストを追加（型の網羅性テスト）
- [ ] コミット: `feat: ドメインイベント型を定義`

### 2-3: エンティティの分離と DbC 強化
- [ ] `domain/entities/player.ts` を作成（`EntityFactory.createPlayer` を移行 + DbC）
- [ ] `domain/entities/obstacle.ts` を作成（障害物関連ファクトリを移行）
- [ ] `domain/entities/ramp.ts` を作成（ランプファクトリを移行）
- [ ] `domain/entities/particle.ts` を作成（パーティクル系ファクトリを移行）
- [ ] `domain/entities/background.ts` を作成（Cloud / Building ファクトリを移行）
- [ ] 既存の `entities.ts` を re-export で後方互換維持
- [ ] 各エンティティのテストを追加
- [ ] コミット: `refactor: エンティティをドメイン層に分離し DbC を追加`

### 2-4: ドメインサービスの再編成
- [ ] 既存の `domains/` 内の各モジュールを `domain/services/` に移行
  - `collision-domain.ts` → `domain/services/collision-service.ts`
  - `scoring-domain.ts` → `domain/services/scoring-service.ts`
  - `speed-domain.ts` → `domain/services/speed-service.ts`
  - `combo-domain.ts` → `domain/services/` に統合
  - `danger-domain.ts` → `domain/services/danger-service.ts`
  - `geometry-domain.ts` → `domain/services/geometry-service.ts`
- [ ] `physics.ts` → `domain/services/physics-service.ts` に移行（DbC 追加）
- [ ] 既存のファイルは re-export で後方互換維持
- [ ] テストを移行/更新
- [ ] コミット: `refactor: ドメインサービスを再編成`

### 2-5: 衝突ハンドラの Strategy パターン化
- [ ] `domain/strategies/collision/collision-handler.ts` でインターフェースを定義
- [ ] `hole-handler.ts` を作成（HOLE_S / HOLE_L 対応）
- [ ] `rock-handler.ts` を作成
- [ ] `enemy-handler.ts` を作成（速度ランク別の挙動）
- [ ] `item-handler.ts` を作成（SCORE / REVERSE / FORCE_JUMP 対応）
- [ ] `collision-registry.ts` で登録・ディスパッチを管理
- [ ] `NonBrakeDescentGame.tsx` の `createCollisionHandlers` をレジストリ呼び出しに置換
- [ ] 各ハンドラのテストを追加
- [ ] コミット: `refactor: 衝突ハンドラを Strategy パターンに変更`

---

## Phase 3: アプリケーション層の抽出

### 3-1: ゲーム状態の統合型定義
- [ ] `application/game-loop/game-state.ts` を作成（`GameWorld` + `UIState` 型）
- [ ] 25個の `useState` を統合する `useReducer` のアクション型を定義
- [ ] テストを追加
- [ ] コミット: `refactor: ゲーム状態を統合型に定義`

### 3-2: FrameProcessor の作成
- [ ] `application/game-loop/frame-processor.ts` を作成
- [ ] `NonBrakeDescentGame.tsx` のゲームループ内ロジックを `processFrame` に抽出
  - 入力処理
  - 速度更新
  - パーティクル更新
  - プレイヤー移動
  - 遷移チェック
  - スコア・コンボ更新
  - カメラ追従
- [ ] 副作用（Audio, setState）を排除し、イベント配列で返却
- [ ] 既存テストが全パスすることを確認
- [ ] `processFrame` のテストを追加
- [ ] コミット: `refactor: FrameProcessor を作成しゲームループを純粋関数化`

### 3-3: 衝突処理の分離
- [ ] `application/collision/collision-processor.ts` を作成
- [ ] `NonBrakeDescentGame.tsx` の衝突ループを `processCollisions` に抽出
- [ ] テストを追加
- [ ] コミット: `refactor: 衝突処理をアプリケーション層に分離`

### 3-4: ジェネレータの分離
- [ ] `application/generators/ramp-generator.ts` を作成
- [ ] `application/generators/obstacle-generator.ts` を作成
- [ ] `application/generators/background-generator.ts` を作成
- [ ] 既存の `generators.ts` を re-export で後方互換維持
- [ ] テストを移行
- [ ] コミット: `refactor: ジェネレータをアプリケーション層に分離`

---

## Phase 4: インフラ層の分離

### 4-1: オーディオシステムの抽象化
- [ ] `infrastructure/audio/audio-port.ts` で `AudioPort` インターフェースを定義
- [ ] `infrastructure/audio/web-audio-adapter.ts` を作成（既存 `audio.ts` のリファクタリング）
- [ ] `infrastructure/audio/null-audio-adapter.ts` をテスト用に作成
- [ ] テストを追加
- [ ] コミット: `refactor: オーディオシステムをインターフェースで抽象化`

### 4-2: ストレージの抽象化
- [ ] `infrastructure/storage/score-repository.ts` を作成（`ScoreRepository` インターフェース）
- [ ] 既存の `score-storage.ts` への依存をインターフェース経由に変更
- [ ] テストを追加
- [ ] コミット: `refactor: ストレージをリポジトリパターンで抽象化`

---

## Phase 5: プレゼンテーション層のリファクタリング

### 5-1: ゲームエンジンフックの作成
- [ ] `presentation/hooks/use-game-engine.ts` を作成
- [ ] `NonBrakeDescentGame.tsx` から状態管理・ゲームループロジックを抽出
- [ ] `useReducer` で状態更新を単一化
- [ ] イベントハンドラでオーディオ・パーティクルを処理
- [ ] テストを追加
- [ ] コミット: `refactor: ゲームエンジンフックを作成`

### 5-2: 入力・オーディオフックの分離
- [ ] `presentation/hooks/use-input.ts` を作成（キーボード・タッチ入力の統合）
- [ ] `presentation/hooks/use-audio.ts` を作成（AudioPort 経由のオーディオ制御）
- [ ] `presentation/hooks/use-mobile.ts` を作成（既存 `useIsMobile` を移行）
- [ ] テストを追加
- [ ] コミット: `refactor: 入力・オーディオフックを分離`

### 5-3: 画面コンポーネントの分割
- [ ] `presentation/screens/TitleScreen.tsx` を作成
- [ ] `presentation/screens/PlayScreen.tsx` を作成
- [ ] `presentation/screens/ResultScreen.tsx` を作成
- [ ] `NonBrakeDescentGame.tsx` を画面切替のみの薄いコンテナに縮小（目標 150行以内）
- [ ] 統合テストを追加
- [ ] コミット: `refactor: メインコンポーネントを3画面に分割`

### 5-4: レンダラーの移行とスタイル統一
- [ ] 既存 `renderers/` のコンポーネントを `presentation/components/` に移行
- [ ] インラインスタイルを styled-components に移行
- [ ] `presentation/styles/theme.ts` にカラーテーマ・フォント定数を集約
- [ ] コミット: `style: レンダラーを移行しスタイルを統一`

---

## Phase 6: E2E テスト追加とテストリファクタリング・最終確認

### 6-1: E2E テスト（最低限のハッピーパス）の追加
- [ ] `e2e/non-brake-descent.spec.ts` を作成
  - タイトル画面が表示されること（タイトル文字列・操作説明の存在確認）
  - Space キーでカウントダウンが開始されること
  - カウントダウン後にプレイ画面（HUD・スコア表示）に遷移すること
  - ※ ゲームクリアまでのテストはアクションゲームの性質上不要（ランダム障害物で再現不可）
- [ ] E2E テストが通ることを確認
- [ ] コミット: `test: E2E テスト（ハッピーパス）を追加`

### 6-2: テスト構造のリファクタリング
- [ ] テストファイルを新ディレクトリ構造に移動
  - `__tests__/domain/services/`
  - `__tests__/domain/strategies/`
  - `__tests__/domain/entities/`
  - `__tests__/application/`
  - `__tests__/presentation/`
- [ ] 全テストで AAA パターンのコメントを明示
- [ ] テスト名を日本語で統一
- [ ] コミット: `test: テスト構造をリファクタリング`

### 6-3: カバレッジ確認と不足テスト追加
- [ ] カバレッジレポートを確認
- [ ] ドメインロジック 90% 以上を達成
- [ ] アプリケーション層 80% 以上を達成
- [ ] 不足しているテストを追加
- [ ] コミット: `test: カバレッジ基準を達成するテストを追加`

### 6-4: 最終確認
- [ ] 全テスト（単体 + E2E）がパスすることを最終確認
- [ ] Lint エラーがゼロであることを確認
- [ ] ゲームを手動で動作確認（タイトル → 各ステージ → リザルト）
- [ ] パフォーマンス確認（60fps 維持）
- [ ] 古い re-export パスが動作することを確認
- [ ] コミット: `chore: リファクタリング完了、最終確認`

---

## 作業見積もり

| Phase | タスク数 | 推定規模 |
|-------|---------|---------|
| Phase 1: 基盤整備 | 4 | 小 |
| Phase 2: ドメイン層 | 5 | 大 |
| Phase 3: アプリケーション層 | 4 | 大 |
| Phase 4: インフラ層 | 2 | 小 |
| Phase 5: プレゼンテーション層 | 4 | 中 |
| Phase 6: テスト・最終確認 | 4 | 中 |
| **合計** | **23** | - |

## 依存関係

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
                                    ↓
                              Phase 4, Phase 5 は Phase 3 完了後に並行作業可能
```

Phase 1 は他の全 Phase の前提条件です。Phase 4 と Phase 5 は Phase 3 完了後に並行して進めることが可能です。
