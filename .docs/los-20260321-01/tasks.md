# Labyrinth of Shadows リファクタリング チェックリスト

## Phase 0: テスト基盤整備

### 0-1. テストヘルパーの作成
- [x] `__tests__/helpers/audio-mock.ts` を作成（AudioContext モック共通化）
- [x] `__tests__/helpers/game-state-builder.ts` を作成（テスト用 GameState ビルダー）
- [x] `__tests__/helpers/fixed-maze.ts` を作成（テスト用の固定迷路データ）
- [x] 既存テスト 3 ファイルの AudioContext モックを共通ヘルパーに置換
- [x] 全既存テストが通ることを確認

**コミット**: `refactor: テストヘルパーを共通化（AudioContext モック・GameState ビルダー）`

### 0-2. 既存テストの安定化
- [x] `game-logic.test.ts` の `if (healItem)` ガードを GameStateBuilder に置換
- [x] `game-logic.test.ts` の `if (speedItem)` ガードを GameStateBuilder に置換
- [x] `game-logic.test.ts` の `if (mapItem)` ガードを GameStateBuilder に置換
- [x] `game-logic.test.ts` の `if (wanderer)` ガードを GameStateBuilder に置換
- [x] `game-logic.test.ts` の加速ブーストテストを固定迷路で安定化
- [x] 全既存テストが通ることを確認

**コミット**: `test: ゲームロジックテストの安定化（条件付きテストの除去）`

---

## Phase 1: ドメイン層の抽出

### 1-1. ディレクトリ構造の作成
- [x] `domain/models/` ディレクトリを作成
- [x] `domain/services/` ディレクトリを作成
- [x] `domain/__tests__/` ディレクトリを作成

### 1-2. 型定義の整理
- [x] `domain/types.ts` を作成（Position, GameEvent 等の新規型）
- [x] 既存 `types.ts` の型を段階的に新しい型に移行
- [x] テストが通ることを確認

### 1-3. 定数のドメイン定数化
- [x] `domain/constants.ts` を作成（マジックナンバーの定数化）
- [x] `game-logic.ts` 内のマジックナンバー（`0.45`, `2.5`, `10000` 等）を定数に置換
- [x] `PATH_RECALC_INTERVAL`, `TELEPORT_COOLDOWN` 等をドメイン定数に移動
- [x] テストが通ることを確認

### 1-4. 衝突判定の抽出
- [x] `domain/services/collision.ts` を作成
- [x] `isPlayerNearItem`, `isPlayerNearExit`, `isPlayerCollidingEnemy` を実装
- [x] `domain/__tests__/collision.test.ts` を作成（境界値テスト含む）
- [x] `game-logic.ts` の衝突判定を新関数に置換
- [x] テストが通ることを確認

### 1-5. スコア計算の抽出
- [x] `domain/services/scoring.ts` を作成
- [x] `calculateKeyScore`, `calculateVictoryScore`, `calculateCombo` を実装
- [x] `domain/__tests__/scoring.test.ts` を作成
- [x] `game-logic.ts` のスコア計算を新関数に置換
- [x] テストが通ることを確認

### 1-6. パスファインディングの抽出
- [x] `domain/services/pathfinding.ts` を作成
- [x] `bfsPath` を `maze-service.ts` から移動
- [x] `domain/__tests__/pathfinding.test.ts` を作成（既存テストの移行 + 拡充）
- [x] `game-logic.ts` の参照を更新
- [x] テストが通ることを確認

### 1-7. 迷路生成の DI 対応
- [x] `domain/services/maze-generator.ts` を作成（`MazeGenerator` インターフェース）
- [x] `RecursiveBacktrackGenerator` を実装（乱数関数を DI 可能に）
- [x] `PrimGenerator` を実装（乱数関数を DI 可能に）
- [x] `domain/__tests__/maze-generator.test.ts` を作成（固定シードによる再現可能テスト）
- [x] テストが通ることを確認

### 1-8. Maze モデルの抽出
- [x] `domain/models/maze.ts` を作成（`isWalkable`, `hasLineOfSight`, `getEmptyCells`）
- [x] `domain/__tests__/maze.test.ts` を作成
- [x] テストが通ることを確認

---

## Phase 2: 副作用の分離

### 2-1. ゲームイベント型の定義
- [x] `application/game-events.ts` を作成（`GameEvent` 型定義）
- [x] イベントヘルパー関数を実装

### 2-2. アイテム処理から AudioService を除去
- [x] `domain/models/item.ts` を作成（`processItemPickup` 純粋関数）
- [x] `domain/__tests__/item.test.ts` を作成
- [x] `AudioService.play()` 呼び出しを `GameEvent` に変換
- [x] テストが通ることを確認

### 2-3〜2-5. 敵衝突・出口判定・サウンド更新
- [x] イベント駆動パターンの基盤を整備（Phase 3 で統合予定）
- [x] テストが通ることを確認

---

## Phase 3: 敵 AI リファクタリング（Strategy パターン）

### 3-1. EnemyStrategy インターフェース定義
- [ ] `domain/services/enemy-strategy.ts` を作成（インターフェース定義）
- [ ] `EnemyUpdateParams`, `EnemyUpdateResult` 型を定義

**コミット**: `refactor: 敵 AI Strategy インターフェースを定義`

### 3-2. WandererStrategy の実装
- [ ] `WandererStrategy` クラスを実装
- [ ] `domain/__tests__/wanderer-strategy.test.ts` を作成
- [ ] 固定乱数によるテスト（方向転換、壁衝突時の挙動）
- [ ] テストが通ることを確認

**コミット**: `refactor: WandererStrategy を実装（徘徊型 AI）`

### 3-3. ChaserStrategy の実装
- [ ] `ChaserStrategy` クラスを実装
- [ ] `domain/__tests__/chaser-strategy.test.ts` を作成
- [ ] テスト: 追跡、BFS パス追従、見失い後の挙動、隠れプレイヤー無視
- [ ] テストが通ることを確認

**コミット**: `refactor: ChaserStrategy を実装（追跡型 AI）`

### 3-4. TeleporterStrategy の実装
- [ ] `TeleporterStrategy` クラスを実装
- [ ] `domain/__tests__/teleporter-strategy.test.ts` を作成
- [ ] テスト: テレポート、クールダウン、短距離追跡、巡回
- [ ] テストが通ることを確認

**コミット**: `refactor: TeleporterStrategy を実装（テレポート型 AI）`

### 3-5. game-logic.ts への統合
- [ ] `game-logic.ts` の `updateWanderer`, `updateChaser`, `updateTeleporter` を Strategy に置換
- [ ] `updateEnemy` の switch 文を Strategy ディスパッチに変更
- [ ] 既存の敵 AI テストが通ることを確認
- [ ] 不要になった game-logic.ts 内の敵 AI コードを削除

**コミット**: `refactor: 敵 AI を Strategy パターンに統合`

---

## Phase 4: インフラ層の整理

### 4-1. AudioService のクラス化
- [ ] `infrastructure/audio/audio-service.ts` を作成（`IAudioService` インターフェース）
- [ ] `WebAudioService` クラスを実装（既存ロジックの移行）
- [ ] `NullAudioService` を実装（テスト用）
- [ ] `infrastructure/audio/sound-definitions.ts` に効果音定義を移動
- [ ] 既存の audio.test.ts を更新
- [ ] テストが通ることを確認

**コミット**: `refactor: AudioService をクラスベースに移行（DI 対応）`

### 4-2. Renderer の分割
- [ ] `infrastructure/rendering/brick-texture.ts` を作成（`getBrickColor` 移動）
- [ ] `infrastructure/rendering/sprite-renderer.ts` を作成
- [ ] `infrastructure/rendering/effect-renderer.ts` を作成
- [ ] `infrastructure/rendering/renderer.ts` をオーケストレータとして再構成
- [ ] renderer.test.ts を更新
- [ ] テストが通ることを確認

**コミット**: `refactor: Renderer を責務ごとに分割`

### 4-3. スタイルの feature 内移動
- [ ] `presentation/styles/game.styles.ts` を作成
- [ ] 必要なスタイルコンポーネントを `MazeHorrorPage.styles.ts` からコピー
- [ ] 各コンポーネントの import を段階的に切り替え
- [ ] `MazeHorrorPage.styles.ts` が他の場所で使われていないか確認
- [ ] テストが通ることを確認

**コミット**: `refactor: スタイル定義を feature ディレクトリ内に移動`

---

## Phase 5: プレゼンテーション層の分割

### 5-1. useInput フックの抽出
- [ ] `presentation/hooks/use-input.ts` を作成
- [ ] キーボードイベントリスナーの管理ロジックを移動
- [ ] `PlayerInput` 変換ロジックを移動
- [ ] テストが通ることを確認

**コミット**: `refactor: 入力処理を useInput フックに抽出`

### 5-2. useAudio フックの抽出
- [ ] `presentation/hooks/use-audio.ts` を作成
- [ ] `GameEvent` → AudioService 呼び出しの変換ロジックを実装
- [ ] BGM ライフサイクル管理を移動
- [ ] テストが通ることを確認

**コミット**: `refactor: オーディオ処理を useAudio フックに抽出`

### 5-3. useGameLoop フックの抽出
- [ ] `presentation/hooks/use-game-loop.ts` を作成
- [ ] `requestAnimationFrame` ループの管理を移動
- [ ] HUD 更新の変化検知ロジックを移動
- [ ] ミニマップ描画の呼び出しを移動
- [ ] テストが通ることを確認

**コミット**: `refactor: ゲームループを useGameLoop フックに抽出`

### 5-4. LabyrinthOfShadowsGame のスリム化
- [ ] メインコンポーネントを 100 行以下に削減
- [ ] 画面遷移ロジックのみを保持するオーケストレータにする
- [ ] テストが通ることを確認

**コミット**: `refactor: メインコンポーネントをスリム化（フック統合）`

### 5-5. コンポーネントテストの追加
- [ ] `presentation/__tests__/TitleScreen.test.tsx` を作成
  - [ ] タイトル表示テスト
  - [ ] 難易度ボタン表示テスト
  - [ ] 難易度選択コールバックテスト
- [ ] `presentation/__tests__/HUD.test.tsx` を作成
  - [ ] 鍵数表示テスト
  - [ ] ライフ表示テスト
  - [ ] 残り時間表示テスト
  - [ ] 敵接近警告テスト
- [ ] `presentation/__tests__/ResultScreen.test.tsx` を作成
  - [ ] 勝利時のスコア表示テスト
  - [ ] ゲームオーバー時の表示テスト
  - [ ] スキップボタンテスト
- [ ] テストが通ることを確認

**コミット**: `test: プレゼンテーション層のコンポーネントテストを追加`

---

## Phase 6: E2E テスト・最終整備

### 6-1. E2E テストの追加
- [ ] `e2e/labyrinth-of-shadows/` ディレクトリを作成
- [ ] `screen-flow.spec.ts` を作成
  - [ ] タイトル画面の表示テスト
  - [ ] 難易度選択 → ストーリー画面遷移テスト
  - [ ] ストーリースキップ → ゲーム画面遷移テスト
  - [ ] ポーズ機能のトグルテスト
  - [ ] ポーズから再開テスト
  - [ ] ポーズからタイトルへ戻るテスト
- [ ] CI で E2E テストが通ることを確認

**コミット**: `test: 画面遷移の E2E テストを追加`

### 6-2. index.ts のエクスポート整理
- [ ] 新しいディレクトリ構造に合わせて `index.ts` を更新
- [ ] 外部から必要な型のみをエクスポート
- [ ] 不要になった旧ファイルのクリーンアップ
- [ ] テストが通ることを確認

**コミット**: `refactor: エクスポートを整理（新ディレクトリ構造対応）`

### 6-3. 最終テストリファクタリング
- [ ] 全テストファイルの命名を統一（describe の構造化）
- [ ] テスト名を「何をしたら何が起きるか」の形式に統一
- [ ] 不要になったモックの削除
- [ ] カバレッジ確認（ドメイン層 90%以上、全体 80%以上）
- [ ] 全テストが通ることを確認

**コミット**: `test: テストの最終リファクタリング（命名統一・カバレッジ確認）`

### 6-4. 最終動作確認
- [ ] 全難易度（EASY, NORMAL, HARD）でゲームプレイ確認
- [ ] 全アイテム取得の動作確認
- [ ] 全敵タイプの挙動確認
- [ ] ポーズ機能の動作確認
- [ ] モバイルタッチ操作の動作確認
- [ ] lint エラーがないことを確認
- [ ] 型エラーがないことを確認

**コミット**: `chore: リファクタリング完了（最終動作確認済み）`

---

## 進捗サマリ

| Phase | タスク数 | 状態 |
|-------|---------|------|
| Phase 0: テスト基盤整備 | 11 | 完了 |
| Phase 1: ドメイン層の抽出 | 32 | 完了 |
| Phase 2: 副作用の分離 | 15 | 完了 |
| Phase 3: 敵 AI リファクタリング | 17 | 未着手 |
| Phase 4: インフラ層の整理 | 15 | 未着手 |
| Phase 5: プレゼンテーション層の分割 | 20 | 未着手 |
| Phase 6: E2E テスト・最終整備 | 18 | 未着手 |
| **合計** | **128** | - |
