# Deep Sea Interceptor リファクタリング チェックリスト

## Phase 1: 基盤整備（テスト強化 + 型安全性向上）

### 1-1: テストヘルパー・ファクトリの拡充
- [x] `test-factories.ts` を作成し、全エンティティ用のビルダー関数を実装
  - `buildEnemy`, `buildBullet`, `buildEnemyBullet`, `buildItem`, `buildParticle`, `buildBubble`
- [x] 既存の `test-helpers.ts` の `buildGameState`, `buildUiState` を `test-factories.ts` に統合
- [x] 既存テストを新ファクトリ関数に移行
- [x] コミット: `refactor: テストファクトリを拡充し既存テストに適用`

### 1-2: 欠落テストの追加
- [x] `achievements.ts` のテストを追加（`checkNewAchievements`, `loadAchievements`, `saveAchievements`）
- [x] `audio.ts` のテストを追加（`createAudioSystem` の init/play）
- [x] 環境ギミック関数（`applyCurrentGimmick` 等）のテストを追加
- [x] `calculateRank` 関数のテストを追加
- [x] コミット: `test: 欠落していたモジュールのテストを追加`

### 1-3: 型安全性の向上
- [x] `EnemyConfig` のキーを `Record<string, ...>` から `Record<EnemyType, ...>` に変更
- [x] `BossPatterns` のキーを型安全に変更
- [x] `MidbossPatterns` のキーを型安全に変更
- [x] `processItemCollection` 内の `as` キャストを排除
- [x] `EntityFactory.enemy` の `type` パラメータを `string` から `EnemyType` に変更
- [x] 全テストがパスすることを確認
- [x] コミット: `refactor: 型安全性を強化（Record<string, ...> を EnemyType 制約に変更）`

### 1-4: マジックナンバーの定数化
- [x] `game-logic.ts` 内のマジックナンバーを `constants.ts` に移動
  - コンボタイマー: `3000` → `COMBO_TIMEOUT_MS`
  - ボス撃破後待機: `2000` → `BOSS_DEFEAT_DELAY_MS`
  - 海流切替間隔: `10000` → `CURRENT_CHANGE_INTERVAL_MS`
  - 機雷スポーン間隔: `3000` → `MINE_SPAWN_INTERVAL_MS`
  - 熱水柱生成間隔: `5000` → `THERMAL_VENT_INTERVAL_MS`
  - グレイズスコア: `50` → `GRAZE_SCORE`
  - その他散在するマジックナンバー
- [x] `DeepSeaInterceptorGame.tsx` 内のマジックナンバーも定数化
- [x] 全テストがパスすることを確認
- [x] コミット: `refactor: マジックナンバーを定数に置換`

---

## Phase 2: ドメイン層の抽出

### 2-1: ディレクトリ構造の作成
- [x] `domain/entities/`, `domain/services/`, `domain/strategies/`, `domain/events/` ディレクトリを作成
- [x] コミット: `chore: ドメイン層のディレクトリ構造を作成`

### 2-2: 値オブジェクトとエンティティの分離
- [x] `domain/entities/position.ts` を作成（`Position` 値オブジェクト + 演算関数 + DbC アサーション）
- [x] `domain/entities/player.ts` を作成（プレイヤー関連ロジック）
- [x] `domain/entities/bullet.ts` を作成（`Bullet`, `EnemyBullet` 生成ロジック）
- [x] `domain/entities/enemy.ts` を作成（`Enemy` + `isBoss`/`isMidboss` 判定）
- [x] `domain/entities/item.ts` を作成
- [x] `domain/entities/particle.ts` を作成（`Particle`, `Bubble`）
- [x] 既存の `entities.ts` からの移行（re-export で後方互換性を維持）
- [x] 各エンティティのテストを追加/移行
- [x] 全テストがパスすることを確認
- [x] コミット: `refactor: エンティティをドメイン層に分離`

### 2-3: 衝突判定サービスの分離
- [x] `domain/services/collision-service.ts` を作成（既存の `collision.ts` を移動）
- [x] DbC アサーション追加（半径 >= 0 等）
- [x] テストを移行
- [x] コミット: `refactor: 衝突判定をドメインサービスに移動`

### 2-4: スコアリングサービスの分離
- [x] `domain/services/scoring-service.ts` を作成
  - コンボ計算ロジック
  - スコア倍率計算
  - ランク判定（`calculateRank`）
  - ステージクリアボーナス計算
- [x] テストを追加/移行
- [x] コミット: `refactor: スコアリングロジックをドメインサービスに分離`

### 2-5: ダメージサービスの分離
- [x] `domain/services/damage-service.ts` を作成
  - 敵ダメージ処理（弾 → 敵）
  - プレイヤーダメージ処理
  - グレイズ判定
- [x] 既存の `processBulletEnemyCollisions`, `processPlayerDamage`, `processGraze` を移行
- [x] テストを移行
- [x] コミット: `refactor: ダメージ処理をドメインサービスに分離`

### 2-6: 移動戦略の Strategy パターン化
- [x] `domain/strategies/movement/movement-strategy.ts` でインターフェースを定義
- [x] 各移動戦略を個別ファイルに分離（straight, sine, drift, boss, homing）
- [x] 既存の `movement.ts` を re-export で後方互換維持
- [x] テストを移行
- [x] コミット: `refactor: 移動ロジックを Strategy パターンに変更`

### 2-7: ギミック戦略の Strategy パターン化
- [x] `domain/strategies/gimmick/gimmick-strategy.ts` でインターフェースを定義
- [x] 各ギミックを個別ファイルに分離（current, minefield, thermal-vent, bioluminescence, pressure）
- [x] `gimmick-registry.ts` でギミック名→戦略の対応を管理
- [x] `game-logic.ts` の `switch` 文をレジストリ呼び出しに置換
- [x] 各ギミックのテストを追加
- [x] コミット: `refactor: 環境ギミックを Strategy パターン + レジストリに変更`

### 2-8: 武器戦略の Strategy パターン化
- [x] `domain/strategies/weapon/weapon-strategy.ts` でインターフェースを定義
- [x] 各武器を個別ファイルに分離（torpedo, sonar-wave, bio-missile）
- [x] `weapon-registry.ts` でディスパッチ
- [x] 既存の `weapon.ts` からの移行
- [x] テストを移行
- [x] コミット: `refactor: 武器ロジックを Strategy パターンに変更`

### 2-9: 敵AI戦略の整理
- [x] `domain/strategies/enemy-ai/attack-pattern.ts` でインターフェースを定義
- [x] ボスパターン、ミッドボスパターン、通常パターンを個別ファイルに分離
- [x] `Date.now()` の直接参照を排除し、タイムスタンプを引数で受け取る
- [x] テストを移行/追加
- [x] コミット: `refactor: 敵AI を Strategy パターンに整理`

### 2-10: ドメインイベントの定義
- [x] `domain/events/game-events.ts` を作成
- [x] `AudioEvent` を `GameEvent` ユニオン型に統合
- [x] `game-logic.ts` 内のイベント生成を `GameEvent` に移行
- [x] テストを更新
- [x] コミット: `refactor: ドメインイベント型を定義し AudioEvent を統合`

---

## Phase 3: アプリケーション層の整理

### 3-1: FrameProcessor の作成
- [x] `application/game-loop/frame-processor.ts` を作成
- [x] `updateFrame` のミューテーションをイミュータブル更新に変更
- [x] `audioPlay` コールバックを排除し、イベント配列で返却
- [x] 既存テストを新 API に移行
- [x] 全テストがパスすることを確認
- [x] コミット: `refactor: FrameProcessor を作成し updateFrame をイミュータブルに変更`

### 3-2: ステージ管理の分離
- [x] `application/stages/stage-progression.ts` を作成（既存の `checkStageProgression` を移動）
- [x] `application/stages/stage-config.ts` を作成（`StageConfig` を移動）
- [x] テストを移行
- [x] コミット: `refactor: ステージ管理をアプリケーション層に分離`

### 3-3: 実績管理の分離
- [x] `application/achievements/achievement-checker.ts` を作成
- [x] `application/achievements/achievement-list.ts` を作成
- [x] テストを移行
- [x] コミット: `refactor: 実績管理をアプリケーション層に分離`

---

## Phase 4: インフラ層の分離

### 4-1: オーディオシステムの抽象化
- [x] `infrastructure/audio/audio-system.ts` で `AudioPort` インターフェースを定義
- [x] `createWebAudioSystem` を実装（既存 `audio.ts` のリファクタリング）
- [x] `createNullAudioSystem` をテスト用に作成
- [x] テストを追加
- [x] コミット: `refactor: オーディオシステムをインターフェースで抽象化`

### 4-2: ストレージの抽象化
- [x] `infrastructure/storage/score-repository.ts` を作成
- [x] `infrastructure/storage/achievement-repository.ts` を作成
- [x] `localStorage` 直接参照を排除
- [x] テストを追加
- [x] コミット: `refactor: ストレージ操作をリポジトリパターンで抽象化`

### 4-3: 入力ハンドラの抽象化
- [x] `infrastructure/input/input-handler.ts` で `InputAdapter` インターフェースを定義
- [x] `keyboard-adapter.ts`、`touch-adapter.ts` を実装
- [x] `hooks.ts` の入力処理ロジックを移行
- [x] テストを追加
- [x] コミット: `refactor: 入力処理をアダプタパターンで抽象化`

---

## Phase 5: プレゼンテーション層のリファクタリング

### 5-1: 画面コンポーネントの分割
- [x] `presentation/screens/TitleScreen.tsx` を作成（`DeepSeaInterceptorGame.tsx` から抽出）
- [x] `presentation/screens/ResultScreen.tsx` を作成
- [x] `presentation/screens/PlayScreen.tsx` を作成
- [x] `DeepSeaInterceptorGame.tsx` を画面切替のみの薄いコンテナに縮小
- [x] コミット: `refactor: メインコンポーネントを3画面に分割`

### 5-2: 演出コンポーネントの分離
- [x] `presentation/components/GimmickEffects.tsx` を作成（海流表示、熱水柱、発光、水圧の壁）
- [x] `presentation/components/ScreenOverlays.tsx` を作成（WARNING、ボス撃破、ステージクリア）
- [x] コミット: `refactor: 演出コンポーネントを分離`

### 5-3: スタイルの統一
- [x] インラインスタイルを styled-components に移行
- [x] `presentation/styles/theme.ts` にカラーテーマを集約
- [x] マジックナンバー（フォントサイズ、パディング等）を定数化
- [x] コミット: `style: インラインスタイルを styled-components に移行`

### 5-4: フックの分割
- [x] `presentation/hooks/use-game-loop.ts` を作成（ゲームループ制御のみ）
- [x] `presentation/hooks/use-input.ts` を作成（入力処理のみ）
- [x] `presentation/hooks/use-audio.ts` を作成（オーディオ制御のみ）
- [x] `presentation/hooks/use-deep-sea-game.ts` を薄い統合フックに縮小
- [x] コミット: `refactor: カスタムフックを責務ごとに分割`

### 5-5: 画面コンポーネントのテスト追加
- [x] `TitleScreen` の統合テスト（武器選択、難易度選択、ゲーム開始）
- [x] `ResultScreen` の統合テスト（スコア表示、リトライ、タイトル戻り）
- [x] `PlayScreen` の統合テスト（HUD 表示）
- [x] コミット: `test: 画面コンポーネントの統合テストを追加`

---

## Phase 6: テストリファクタリングと最終確認

### 6-1: テスト構造のリファクタリング
- [x] テストファイルを新ディレクトリ構造に移動
  - `__tests__/domain/entities/`
  - `__tests__/domain/services/`
  - `__tests__/domain/strategies/`
  - `__tests__/application/`
  - `__tests__/presentation/`
- [x] 全テストで AAA パターンのコメントを明示
- [x] `describe` ネストを「正常系」「異常系」「境界値」で統一
- [x] テスト名を日本語で「何をしたら何が起きるか」に統一
- [x] コミット: `test: テスト構造をリファクタリングし AAA パターンを明示`

### 6-2: Date.now() 依存の排除
- [x] すべてのドメイン関数から `Date.now()` 直接呼び出しを排除
- [x] タイムスタンプは引数として注入する設計に統一
- [x] テストでタイムスタンプを制御可能にする
- [x] コミット: `refactor: Date.now() 依存を排除しタイムスタンプ注入に統一`

### 6-3: カバレッジ確認と不足テスト追加
- [x] カバレッジレポートを確認
- [x] ドメインロジック 90% 以上を達成
- [x] アプリケーション層 80% 以上を達成
- [x] 不足しているテストを追加
- [x] コミット: `test: カバレッジ基準を達成するテストを追加`

### 6-4: 後方互換性と最終確認
- [x] `index.ts` の公開 API が変更されていないことを確認
- [x] 古い `import` パスが re-export で動作することを確認
- [x] 全テストがパスすることを最終確認
- [x] ゲームを手動で動作確認（タイトル → 各ステージ → リザルト）
- [x] パフォーマンス確認（60fps 維持）
- [x] コミット: `chore: リファクタリング完了、後方互換性を確認`

---

## 作業見積もり

| Phase | タスク数 | 推定工数 |
|-------|---------|---------|
| Phase 1: 基盤整備 | 4 | 小 |
| Phase 2: ドメイン層 | 10 | 大 |
| Phase 3: アプリケーション層 | 3 | 中 |
| Phase 4: インフラ層 | 3 | 中 |
| Phase 5: プレゼンテーション層 | 5 | 中 |
| Phase 6: テスト最終確認 | 4 | 中 |
| **合計** | **29** | - |

## 依存関係

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
                                    ↓
                              Phase 4, Phase 5 は並行作業可能
```

Phase 1 は他の全 Phase の前提条件です。Phase 4 と Phase 5 は Phase 3 完了後に並行して進めることが可能です。
