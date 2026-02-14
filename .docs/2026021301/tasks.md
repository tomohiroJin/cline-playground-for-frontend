# リファクタリングタスク一覧

## フェーズ0: 準備

- [x] 全テスト実行・緑確認（`npm test -- --run`）
- [x] ビルド確認（`npm run build`）
- [x] 共通 `math-utils.ts` の拡張候補を調査
  - [x] 各ゲームから重複している数学関数（lerp, normalize, shuffle, clamp, distance 等）をリストアップ
  - [x] `src/utils/math-utils.ts` に追加する関数を決定
  - [x] 関数を追加・テスト作成
  - [x] テスト確認

---

## フェーズ1: P1 ゲーム

### 1. Racing Game

- [x] テスト確認（事前）: 既存テスト通過確認
- [x] `src/features/racing-game/` ディレクトリ作成
- [x] 型定義の抽出（`types.ts`）→ テスト確認
- [x] 定数の抽出（`constants.ts`）→ テスト確認
- [x] 純粋関数/ユーティリティの抽出（`utils.ts`）→ テスト追加・確認
- [x] Audio の分離（`audio.ts`）→ テスト確認
- [x] エンティティの抽出（`entities.ts`）→ テスト追加・確認
- [x] トラック関連の抽出（`track.ts`）→ テスト追加・確認
- [x] レンダラーの抽出（`renderer.ts`）→ テスト確認
- [x] ゲームロジックの抽出（`game-logic.ts`）→ テスト追加・確認
- [x] カスタムフックの抽出（`hooks.ts`）→ テスト確認
- [x] UIコンポーネントの抽出（`components/VolumeControl.tsx`）→ テスト確認
- [x] メインコンポーネントの整理（`RacingGame.tsx`）→ テスト確認
- [x] `RacingGamePage.tsx` を薄いラッパーに変更 → テスト確認
- [x] `index.ts` 作成（re-export）
- [x] テスト確認（事後）: 全テスト通過・ビルド確認

### 2. Labyrinth of Shadows

- [x] テスト確認（事前）: 既存テスト通過確認
- [x] `src/features/labyrinth-of-shadows/` ディレクトリ作成
- [x] 型定義の抽出（`types.ts`）→ テスト確認
- [x] 定数の抽出（`constants.ts`）→ テスト確認
- [x] 純粋関数/ユーティリティの抽出（`utils.ts`）→ テスト追加・確認
- [x] Audio の分離（`audio.ts`）→ テスト確認
- [x] 迷路サービスの抽出（`maze-service.ts`）→ テスト追加・確認
- [x] エンティティファクトリの抽出（`entity-factory.ts`）→ テスト追加・確認
- [x] ゲームロジックの抽出（`game-logic.ts`）→ テスト追加・確認
- [x] レンダラーの抽出（`renderer.ts`）→ テスト確認
- [x] カスタムフックの抽出（`hooks.ts`）→ テスト確認
- [x] UIコンポーネントの抽出（`components/Minimap.tsx`, `HUD.tsx`, `TitleScreen.tsx`, `ResultScreen.tsx`）→ テスト確認
- [x] メインコンポーネントの整理 → テスト確認
- [x] `MazeHorrorPage.tsx` を薄いラッパーに変更 → テスト確認
- [x] `index.ts` 作成（re-export）
- [x] テスト確認（事後）: 全テスト通過・ビルド確認

### 3. Falldown Shooter

- [x] テスト確認（事前）: 既存テスト通過確認
- [x] `src/features/falldown-shooter/` ディレクトリ作成
- [x] 型定義の抽出（`types.ts`）→ テスト確認
- [x] 定数の抽出（`constants.ts`）→ テスト確認
- [x] 純粋関数/ユーティリティの抽出（`utils.ts`）→ テスト追加・確認
- [x] Audio の分離（`audio.ts`）→ テスト確認
- [x] グリッド管理の抽出（`grid.ts`）→ テスト追加・確認
- [x] ブロックロジックの抽出（`block.ts`）→ テスト追加・確認
- [x] 弾丸ロジックの抽出（`bullet.ts`）→ テスト追加・確認
- [x] 衝突判定の抽出（`collision.ts`）→ テスト追加・確認
- [x] ゲームロジックの抽出（`game-logic.ts`）→ テスト追加・確認
- [x] ステージ定義の抽出（`stage.ts`）→ テスト確認
- [x] カスタムフックの抽出（`hooks.ts`）→ テスト確認
- [x] UIコンポーネントの抽出（`components/CellView.tsx`, `BulletView.tsx`, `PlayerShip.tsx`, `SkillGauge.tsx`）→ テスト確認
- [x] メインコンポーネントの整理 → テスト確認
- [x] `FallingShooterPage.tsx` を薄いラッパーに変更 → テスト確認
- [x] `index.ts` 作成（re-export）
- [x] テスト確認（事後）: 全テスト通過・ビルド確認

### 4. Deep Sea Interceptor

- [x] テスト確認（事前）: 既存テスト通過確認
- [x] `src/features/deep-sea-interceptor/` ディレクトリ作成
- [x] 型定義の抽出（`types.ts`）→ テスト確認
- [x] 定数の抽出（`constants.ts`）→ テスト確認
- [x] エンティティの抽出（`entities.ts`）→ テスト追加・確認
- [x] 移動ロジックの抽出（`movement.ts`）→ テスト追加・確認
- [x] 衝突判定の抽出（`collision.ts`）→ テスト追加・確認
- [x] 敵AIの抽出（`enemy-ai.ts`）→ テスト追加・確認
- [x] Audio の分離（`audio.ts`）→ テスト確認
- [x] ゲームロジックの抽出（`game-logic.ts`）→ テスト追加・確認
- [x] カスタムフックの抽出（`hooks.ts`）→ テスト確認
- [x] スタイルの抽出（`styles.ts`）→ テスト確認
- [x] UIコンポーネントの抽出（`components/PlayerSprite.tsx`, `EnemySprite.tsx`, `BulletSprite.tsx`, `HUD.tsx`）→ テスト確認
- [x] メインコンポーネントの整理 → テスト確認
- [x] `DeepSeaShooterPage.tsx` を薄いラッパーに変更 → テスト確認
- [x] `index.ts` 作成（re-export）
- [x] テスト確認（事後）: 全テスト通過・ビルド確認

---

## フェーズ2: P2 ゲーム

### 5. Labyrinth Echo

- [x] テスト確認（事前）: 既存テスト通過確認
- [x] 型定義/契約の抽出（`contracts.ts`）→ テスト確認
- [x] Audio の分離（`audio.ts`）→ テスト確認
- [x] イベントデータの分離（`events/event-data.ts`）→ テスト確認
- [x] イベントユーティリティの分離（`events/event-utils.ts`）→ テスト追加・確認
- [x] ゲーム定義の分離（`definitions.ts`）→ テスト確認
- [x] スタイルの分離（`styles.ts`）→ テスト確認
- [x] UIコンポーネントの抽出（`components/Page.tsx`, `Section.tsx`, `Badge.tsx` 等）→ テスト確認
- [x] カスタムフックの抽出（`hooks.ts`）→ テスト確認
- [x] メインコンポーネントの整理（`LabyrinthEchoGame.tsx` を約300行に）→ テスト確認
- [x] `index.ts` 作成/更新（re-export）
- [x] テスト確認（事後）: 全テスト通過・ビルド確認

### 6. Keys & Arms

- [x] テスト確認（事前）: 既存テスト通過確認
- [x] 型定義の抽出（`types.ts`）→ @ts-nocheck のため不要（スキップ）
- [x] 定数の抽出（`constants.ts`）→ テスト確認
- [x] コア機能の分割
  - [x] 数学ユーティリティ（`core/math.ts`）→ テスト追加・確認
  - [x] 描画ユーティリティ（`core/rendering.ts`）→ テスト確認
  - [x] パーティクルシステム（`core/particles.ts`）→ テスト追加・確認
  - [x] Audio（`core/audio.ts`）→ テスト確認
  - [x] HUD描画（`core/hud.ts`）→ テスト確認
- [x] ステージの分割
  - [x] 洞窟ステージ（`stages/cave/index.ts`）→ テスト追加・確認
  - [x] 草原ステージ（`stages/prairie/index.ts`）→ テスト追加・確認
  - [x] ボスステージ（`stages/boss/index.ts`）→ テスト追加・確認
- [x] 画面の分割
  - [x] タイトル画面（`screens/title.ts`）→ テスト確認
  - [x] ゲームオーバー画面（`screens/game-over.ts`）→ テスト確認
  - [x] エンディング画面（`screens/ending.ts`）→ テスト確認
  - [x] トゥルーエンド画面（`screens/true-end.ts`）→ テスト確認
- [x] EngineContext パターンの導入 → テスト確認
- [x] `engine.ts` をオーケストレーターに整理 → テスト確認
- [x] `index.ts` 作成/更新（re-export）→ 不要（スキップ）
- [x] テスト確認（事後）: 全テスト通過・ビルド確認（100 suites, 1202 tests passed）

---

## フェーズ3: P3-P4 ゲーム

### 7. Air Hockey

- [x] テスト確認（事前）: 既存テスト通過確認
- [x] `src/features/air-hockey/` ディレクトリ整備
- [x] カスタムフックの抽出（`hooks/useGameLoop.ts`, `hooks/useInput.ts`）→ テスト確認
- [x] UIコンポーネントの抽出（`components/Field.tsx`, `Scoreboard.tsx`, `TitleScreen.tsx`, `ResultScreen.tsx`）→ テスト確認
- [x] メインコンポーネントの整理 → テスト確認
- [x] `AirHockeyPage.tsx` を薄いラッパーに変更 → テスト確認
- [x] `index.ts` 作成（re-export）
- [x] テスト確認（事後）: 全テスト通過・ビルド確認

### 8. IPNE

- [x] テスト確認（事前）: 既存542テスト通過確認
- [x] `presentation/` ディレクトリ作成
- [x] 画面設定の分離（`presentation/config.ts`）→ テスト確認
- [x] 画面コンポーネントの分離
  - [x] タイトル画面（`presentation/screens/Title.tsx`）→ テスト確認
  - [x] プロローグ画面（`presentation/screens/Prologue.tsx`）→ テスト確認
  - [x] ゲーム画面（`presentation/screens/Game.tsx`）→ テスト確認
  - [x] クリア画面（`presentation/screens/Clear.tsx`）→ テスト確認
- [x] カスタムフックの分離
  - [x] ゲーム状態管理（`presentation/hooks/useGameState.ts`）→ テスト確認
  - [x] ゲームループ（`presentation/hooks/useGameLoop.ts`）→ テスト確認
- [x] `IpnePage.tsx` の整理 → テスト確認
- [x] `index.ts` 更新（re-export で既存テストのインポートパス互換性を維持）
- [x] テスト確認（事後）: 全542テスト通過・ビルド確認

### 9. Risk LCD

- [x] テスト確認（事前）: 既存53テスト通過確認
- [x] `phases/` ディレクトリ作成
- [x] フェーズ別フックの分割
  - [x] ランニングフェーズ（`phases/useRunningPhase.ts`）→ テスト確認
  - [x] パークフェーズ（`phases/usePerkPhase.ts`）→ テスト確認
  - [x] ショップフェーズ（`phases/useShopPhase.ts`）→ テスト確認
  - [x] リザルトフェーズ（`phases/useResultPhase.ts`）→ テスト確認
- [x] `useGameEngine.ts` をオーケストレーターに整理 → テスト確認
- [x] テスト確認（事後）: 全53テスト通過・ビルド確認

### 10. Non-Brake Descent

- [x] テスト確認（事前）: 既存11テスト通過確認
- [x] `renderers/` サブディレクトリ作成
- [x] レンダラーの分割
  - [x] 環境描画（`renderers/environment/index.tsx`）→ テスト確認
  - [x] エンティティ描画（`renderers/entities/index.tsx`）→ テスト確認
  - [x] エフェクト描画（`renderers/effects/index.tsx`）→ テスト確認
  - [x] UI描画（`renderers/ui/index.tsx`）→ テスト確認
- [x] `renderers/index.tsx` 作成（re-export）
- [x] 既存の `renderers.tsx` を削除 → テスト確認
- [x] テスト確認（事後）: 全11テスト通過・ビルド確認

### 11. Agile Quiz Sugoroku

- [x] テスト確認（事前）: 既存テスト通過確認
- [x] `styles/` サブディレクトリ作成
- [x] スタイルの分割
  - [x] アニメーション（`styles/animations.ts`）→ テスト確認
  - [x] レイアウト（`styles/layout.ts`）→ テスト確認
  - [x] クイズ関連（`styles/quiz.ts`）→ テスト確認
  - [x] リザルト画面（`styles/result.ts`）→ テスト確認
  - [x] 共通スタイル（`styles/common.ts`）→ テスト確認
- [x] `styles/index.ts` 作成（re-export）
- [x] 既存の `styles.ts` を削除 → テスト確認
- [x] コンポーネントテストの追加
- [x] テスト確認（事後）: 全テスト通過・ビルド確認

---

## フェーズ4: 統合・仕上げ

- [x] ローカル math 関数の共通化
  - [x] 各ゲームの `utils.ts` / `math.ts` から重複関数を `src/utils/math-utils.ts` に移動
  - [x] 各ゲームのインポートを更新
  - [x] テスト確認
- [x] 全テスト一括実行（`npm test -- --run`）→ 全テスト通過確認
- [x] ビルド確認（`npm run build` 成功）
- [x] リンター確認（`npm run lint`）
- [x] 最終レビュー
  - [x] 各ゲームの主要ファイルが300行以下であることを確認
  - [x] 不要な import / export がないことを確認
  - [x] 全ページが正常に動作することを確認（ブラウザ確認）
- [x] コミット・PR作成
